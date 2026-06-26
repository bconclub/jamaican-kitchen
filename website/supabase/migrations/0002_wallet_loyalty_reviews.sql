-- =====================================================================
-- 0002 — Customer wallet / cashback loyalty, customer auth link,
--        reviews, and a `featured` flag for Best Sellers.
-- Additive + idempotent. Safe to run on top of 0001.
-- Decisions: 5% cashback per order, wallet redeemable at checkout,
--            email magic-link login, account auto-created on first order.
-- =====================================================================

-- ---------- customers: link to an auth user (claimed account) ----------
alter table public.customers
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
create unique index if not exists uq_customers_auth_user on public.customers(auth_user_id)
  where auth_user_id is not null;

-- ---------- menu_items: featured flag (drives website Best Sellers) ----------
alter table public.menu_items
  add column if not exists featured boolean not null default false;

-- ---------- orders: record wallet redemption + cashback earned ----------
alter table public.orders
  add column if not exists wallet_redeemed numeric(10,2) not null default 0,
  add column if not exists cashback_earned numeric(10,2) not null default 0;

-- ---------- wallets ----------
create table if not exists public.customer_wallets (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  balance numeric(10,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  kind text not null check (kind in ('earn','redeem','adjust')),
  amount numeric(10,2) not null,            -- signed: + credit, - debit
  balance_after numeric(10,2) not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_wallet_tx_customer on public.wallet_transactions(customer_id, created_at desc);

-- ---------- reviews (replaces hardcoded testimonials) ----------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text not null,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  status text not null default 'pending',   -- pending | approved | rejected
  source text not null default 'web',
  created_at timestamptz not null default now()
);
create index if not exists idx_reviews_status on public.reviews(status, created_at desc);

-- ---------- helper: ensure a wallet row exists for a customer ----------
create or replace function public.ensure_wallet(p_customer_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.customer_wallets (customer_id, balance)
  values (p_customer_id, 0)
  on conflict (customer_id) do nothing;
end $$;

-- ---------- auto-link / create customer + wallet when an auth user appears ----------
-- A magic-link sign-in creates an auth.users row; link it to the existing
-- guest customer (matched by email) or create one, then ensure a wallet.
create or replace function public.handle_new_customer_auth()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_customer_id uuid;
begin
  update public.customers
    set auth_user_id = new.id
    where lower(email) = lower(new.email) and auth_user_id is null
    returning id into v_customer_id;

  if v_customer_id is null then
    insert into public.customers (name, email, channels, auth_user_id)
    values (coalesce(new.raw_user_meta_data->>'name', new.email), new.email, '{web}', new.id)
    returning id into v_customer_id;
  end if;

  perform public.ensure_wallet(v_customer_id);
  return new;
end $$;

drop trigger if exists trg_new_customer_auth on auth.users;
create trigger trg_new_customer_auth
  after insert on auth.users
  for each row execute function public.handle_new_customer_auth();

-- =====================================================================
-- place_order v2 — now awards 5% cashback and supports wallet redemption.
-- Drop the old 10-arg signature, recreate with p_wallet_redeem (11 args).
-- =====================================================================
drop function if exists public.place_order(text,jsonb,text,jsonb,numeric,numeric,numeric,numeric,text,text);

create or replace function public.place_order(
  p_location_slug text,
  p_customer jsonb,
  p_type text,
  p_items jsonb,
  p_subtotal numeric,
  p_tax numeric,
  p_tip numeric default 0,
  p_fees numeric default 0,
  p_notes text default null,
  p_address text default null,
  p_wallet_redeem numeric default 0      -- amount of wallet balance to apply
)
returns table (order_id uuid, short_id text, cashback_earned numeric, wallet_balance numeric)
language plpgsql security definer set search_path = public as $$
declare
  v_cashback_rate numeric := 0.05;       -- 5% cashback
  v_location_id uuid;
  v_customer_id uuid;
  v_order_id uuid;
  v_short_id text;
  v_total numeric(10,2);
  v_item jsonb;
  v_mi_id uuid;
  v_balance numeric(10,2) := 0;
  v_redeem numeric(10,2) := 0;
  v_cashback numeric(10,2) := 0;
  v_gross numeric(10,2);
begin
  select id into v_location_id from public.locations where slug = p_location_slug limit 1;

  -- find / create customer (by email)
  if p_customer ? 'email' and coalesce(p_customer->>'email','') <> '' then
    select id into v_customer_id from public.customers
      where lower(email) = lower(p_customer->>'email') limit 1;
  end if;
  if v_customer_id is null and p_customer is not null then
    insert into public.customers (name, email, phone, channels)
    values (p_customer->>'name', p_customer->>'email', p_customer->>'phone', '{web}')
    returning id into v_customer_id;
  end if;

  -- ensure wallet, read balance
  if v_customer_id is not null then
    perform public.ensure_wallet(v_customer_id);
    select balance into v_balance from public.customer_wallets where customer_id = v_customer_id for update;
  end if;

  v_gross := coalesce(p_subtotal,0) + coalesce(p_tax,0) + coalesce(p_tip,0) + coalesce(p_fees,0);

  -- clamp redemption: not more than balance, not more than the bill
  v_redeem := least(greatest(coalesce(p_wallet_redeem,0),0), coalesce(v_balance,0), v_gross);
  v_total := v_gross - v_redeem;
  v_cashback := round(coalesce(p_subtotal,0) * v_cashback_rate, 2);

  insert into public.orders as o (
    channel, location_id, customer_id, customer_name, customer_phone, customer_email,
    subtotal, tax, tip, fees, total, wallet_redeemed, cashback_earned,
    status, type, notes, address
  ) values (
    'web', v_location_id, v_customer_id,
    p_customer->>'name', p_customer->>'phone', p_customer->>'email',
    coalesce(p_subtotal,0), coalesce(p_tax,0), coalesce(p_tip,0), coalesce(p_fees,0),
    v_total, v_redeem, v_cashback,
    'new', coalesce(p_type,'pickup')::public.order_type, p_notes, p_address
  ) returning o.id, o.short_id into v_order_id, v_short_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_items,'[]'::jsonb))
  loop
    v_mi_id := null;
    if v_item ? 'menu_item_slug' then
      select id into v_mi_id from public.menu_items where slug = v_item->>'menu_item_slug' limit 1;
    end if;
    insert into public.order_items (order_id, menu_item_id, name, qty, price, spice_level, modifiers)
    values (
      v_order_id, v_mi_id, v_item->>'name',
      coalesce((v_item->>'qty')::int,1), coalesce((v_item->>'price')::numeric,0),
      v_item->>'spice_level', coalesce(v_item->'modifiers','[]'::jsonb)
    );
  end loop;

  insert into public.order_status_events (order_id, status, note)
  values (v_order_id, 'new', 'Order placed via website');

  -- wallet movements (redeem first, then earn)
  if v_customer_id is not null then
    if v_redeem > 0 then
      v_balance := v_balance - v_redeem;
      insert into public.wallet_transactions (customer_id, order_id, kind, amount, balance_after, note)
      values (v_customer_id, v_order_id, 'redeem', -v_redeem, v_balance, 'Redeemed at checkout');
    end if;
    if v_cashback > 0 then
      v_balance := v_balance + v_cashback;
      insert into public.wallet_transactions (customer_id, order_id, kind, amount, balance_after, note)
      values (v_customer_id, v_order_id, 'earn', v_cashback, v_balance, 'Cashback on order ' || v_short_id);
    end if;
    update public.customer_wallets set balance = v_balance, updated_at = now()
      where customer_id = v_customer_id;
  end if;

  return query select v_order_id, v_short_id, v_cashback, coalesce(v_balance,0);
end $$;

grant execute on function public.place_order(text,jsonb,text,jsonb,numeric,numeric,numeric,numeric,text,text,numeric) to anon, authenticated;

-- =====================================================================
-- RLS — customers see their own wallet/data; reviews public-read approved
-- =====================================================================
alter table public.customer_wallets   enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.reviews             enable row level security;

-- customers: a signed-in customer can read their own row
drop policy if exists "customer reads own row" on public.customers;
create policy "customer reads own row" on public.customers for select
  using (auth_user_id = auth.uid());

-- wallets: owner reads own; staff read all
drop policy if exists "customer reads own wallet" on public.customer_wallets;
create policy "customer reads own wallet" on public.customer_wallets for select
  using (customer_id in (select id from public.customers where auth_user_id = auth.uid()));
drop policy if exists "staff read wallets" on public.customer_wallets;
create policy "staff read wallets" on public.customer_wallets for select using (public.is_staff());

-- wallet tx: owner reads own; staff read all (inserts happen via definer RPC)
drop policy if exists "customer reads own wallet tx" on public.wallet_transactions;
create policy "customer reads own wallet tx" on public.wallet_transactions for select
  using (customer_id in (select id from public.customers where auth_user_id = auth.uid()));
drop policy if exists "staff read wallet tx" on public.wallet_transactions;
create policy "staff read wallet tx" on public.wallet_transactions for select using (public.is_staff());

-- reviews: public can read approved; anyone may submit (pending); staff manage
drop policy if exists "public read approved reviews" on public.reviews;
create policy "public read approved reviews" on public.reviews for select
  using (status = 'approved' or public.is_staff());
drop policy if exists "anyone submit review" on public.reviews;
create policy "anyone submit review" on public.reviews for insert
  with check (status = 'pending');
drop policy if exists "staff manage reviews" on public.reviews;
create policy "staff manage reviews" on public.reviews for all
  using (public.is_staff()) with check (public.is_staff());

-- a customer reading their own orders (by linked customer_id)
drop policy if exists "customer reads own orders" on public.orders;
create policy "customer reads own orders" on public.orders for select
  using (customer_id in (select id from public.customers where auth_user_id = auth.uid()));
