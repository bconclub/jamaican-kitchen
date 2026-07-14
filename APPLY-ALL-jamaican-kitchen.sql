-- =====================================================================
-- Jamaican Kitchen — FULL BACKEND SETUP (all 4 migrations, in order)
-- Target project: kpxdlfkxibqbpxtfgdju
-- Paste ALL of this into Supabase → SQL Editor → New query → Run.
-- Idempotent: safe to run once on the empty DB (and safe to re-run).
-- After it succeeds: create the owner Auth user, then grant the role
--   (see the final block at the very bottom).
-- =====================================================================


-- #####################################################################
-- ###  0001_init_shared_schema.sql
-- #####################################################################

-- =====================================================================
-- Jamaican Kitchen — shared backend schema (site + admin dashboard)
-- Project: adqmjrzafrhsommelaqb
-- Run once in Supabase SQL editor (or via supabase db push).
-- Idempotent-ish: safe types/tables guarded with IF NOT EXISTS where possible.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ---------- Enums ----------
do $$ begin
  create type public.spice_level as enum ('mild','medium','hot');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_channel as enum ('web','app','pos');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_type as enum ('pickup','delivery','dine_in');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum
    ('new','accepted','preparing','ready','out_for_delivery','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.app_role as enum ('owner','manager','staff','developer');
exception when duplicate_object then null; end $$;

-- ---------- Utility: updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- =====================================================================
-- Tables
-- =====================================================================

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  address text,
  city text,
  manager text,
  phone text,
  hours text,
  lat double precision,
  lng double precision,
  channels text[] not null default '{web,app}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  description text,
  base_price numeric(10,2) not null default 0,
  image text,
  spice_level public.spice_level not null default 'mild',
  available boolean not null default true,
  stock int not null default 100,
  low_stock_threshold int not null default 10,
  channel_overrides jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_menu_items_updated on public.menu_items;
create trigger trg_menu_items_updated before update on public.menu_items
  for each row execute function public.set_updated_at();

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  channels text[] not null default '{web}',
  created_at timestamptz not null default now()
);
create index if not exists idx_customers_email on public.customers(lower(email));

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  short_id text unique,
  channel public.order_channel not null default 'web',
  location_id uuid references public.locations(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  customer_phone text,
  customer_email text,
  subtotal numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  fees numeric(10,2) not null default 0,
  tip numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status public.order_status not null default 'new',
  type public.order_type not null default 'pickup',
  eta_minutes int not null default 20,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_location on public.orders(location_id);
create index if not exists idx_orders_created on public.orders(created_at desc);
drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  qty int not null default 1,
  price numeric(10,2) not null default 0,
  spice_level text,
  modifiers jsonb not null default '[]'::jsonb
);
create index if not exists idx_order_items_order on public.order_items(order_id);

create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_status_events_order on public.order_status_events(order_id);

create table if not exists public.catering_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  event_type text,
  event_date date,
  guest_count int,
  location text,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

-- ---------- Auth: profiles + roles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique(user_id, role)
);

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Security-definer helpers (avoid RLS recursion)
-- =====================================================================
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid());
$$;

-- =====================================================================
-- short_id generator for orders (JK-XXXXX)
-- =====================================================================
create or replace function public.set_order_short_id()
returns trigger language plpgsql as $$
begin
  if new.short_id is null then
    new.short_id := 'JK-' || upper(substr(md5(new.id::text || clock_timestamp()::text), 1, 5));
  end if;
  return new;
end $$;
drop trigger if exists trg_orders_short_id on public.orders;
create trigger trg_orders_short_id before insert on public.orders
  for each row execute function public.set_order_short_id();

-- =====================================================================
-- RPC: place_order  (public/anon entry point for the website)
-- security definer => bypasses RLS, server controls status/short_id.
-- =====================================================================
create or replace function public.place_order(
  p_location_slug text,
  p_customer jsonb,         -- { name, email, phone }
  p_type text,             -- 'pickup' | 'delivery'
  p_items jsonb,           -- [{ name, qty, price, spice_level, menu_item_slug?, modifiers? }]
  p_subtotal numeric,
  p_tax numeric,
  p_tip numeric default 0,
  p_fees numeric default 0,
  p_notes text default null,
  p_address text default null
)
returns table (order_id uuid, short_id text)
language plpgsql security definer set search_path = public as $$
declare
  v_location_id uuid;
  v_customer_id uuid;
  v_order_id uuid;
  v_short_id text;
  v_total numeric(10,2);
  v_item jsonb;
  v_mi_id uuid;
begin
  select id into v_location_id from public.locations where slug = p_location_slug limit 1;

  if p_customer ? 'email' and coalesce(p_customer->>'email','') <> '' then
    select id into v_customer_id from public.customers
      where lower(email) = lower(p_customer->>'email') limit 1;
  end if;
  if v_customer_id is null and p_customer is not null then
    insert into public.customers (name, email, phone, channels)
    values (p_customer->>'name', p_customer->>'email', p_customer->>'phone', '{web}')
    returning id into v_customer_id;
  end if;

  v_total := coalesce(p_subtotal,0) + coalesce(p_tax,0) + coalesce(p_tip,0) + coalesce(p_fees,0);

  insert into public.orders as o (
    channel, location_id, customer_id, customer_name, customer_phone, customer_email,
    subtotal, tax, tip, fees, total, status, type, notes, address
  ) values (
    'web', v_location_id, v_customer_id,
    p_customer->>'name', p_customer->>'phone', p_customer->>'email',
    coalesce(p_subtotal,0), coalesce(p_tax,0), coalesce(p_tip,0), coalesce(p_fees,0),
    v_total, 'new', coalesce(p_type,'pickup')::public.order_type, p_notes, p_address
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

  return query select v_order_id, v_short_id;
end $$;

grant execute on function public.place_order(text,jsonb,text,jsonb,numeric,numeric,numeric,numeric,text,text) to anon, authenticated;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.locations          enable row level security;
alter table public.menu_categories    enable row level security;
alter table public.menu_items         enable row level security;
alter table public.customers          enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;
alter table public.order_status_events enable row level security;
alter table public.catering_requests  enable row level security;
alter table public.profiles           enable row level security;
alter table public.user_roles         enable row level security;

-- Public read: menu + locations (storefront needs these unauthenticated)
drop policy if exists "public read locations" on public.locations;
create policy "public read locations" on public.locations for select using (true);

drop policy if exists "public read categories" on public.menu_categories;
create policy "public read categories" on public.menu_categories for select using (true);

drop policy if exists "public read menu items" on public.menu_items;
create policy "public read menu items" on public.menu_items for select using (true);

-- Staff manage menu/locations
drop policy if exists "staff write locations" on public.locations;
create policy "staff write locations" on public.locations for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff write categories" on public.menu_categories;
create policy "staff write categories" on public.menu_categories for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff write menu items" on public.menu_items;
create policy "staff write menu items" on public.menu_items for all
  using (public.is_staff()) with check (public.is_staff());

-- Customers: staff read; inserts happen via place_order (definer)
drop policy if exists "staff read customers" on public.customers;
create policy "staff read customers" on public.customers for select using (public.is_staff());

-- Orders: staff read + update/manage. Inserts via place_order RPC (definer).
drop policy if exists "staff read orders" on public.orders;
create policy "staff read orders" on public.orders for select using (public.is_staff());
drop policy if exists "staff update orders" on public.orders;
create policy "staff update orders" on public.orders for update
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff read order items" on public.order_items;
create policy "staff read order items" on public.order_items for select using (public.is_staff());

drop policy if exists "staff manage status events" on public.order_status_events;
create policy "staff manage status events" on public.order_status_events for all
  using (public.is_staff()) with check (public.is_staff());

-- Catering: anyone can submit a request; staff read/manage
drop policy if exists "public submit catering" on public.catering_requests;
create policy "public submit catering" on public.catering_requests for insert with check (true);
drop policy if exists "staff read catering" on public.catering_requests;
create policy "staff read catering" on public.catering_requests for select using (public.is_staff());
drop policy if exists "staff update catering" on public.catering_requests;
create policy "staff update catering" on public.catering_requests for update
  using (public.is_staff()) with check (public.is_staff());

-- Profiles: self read; owners read all
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select
  using (id = auth.uid() or public.has_role(auth.uid(),'owner'));

-- Roles: self read; owners manage
drop policy if exists "read own roles" on public.user_roles;
create policy "read own roles" on public.user_roles for select
  using (user_id = auth.uid() or public.has_role(auth.uid(),'owner'));
drop policy if exists "owner manage roles" on public.user_roles;
create policy "owner manage roles" on public.user_roles for all
  using (public.has_role(auth.uid(),'owner')) with check (public.has_role(auth.uid(),'owner'));

-- =====================================================================
-- Realtime: stream order changes to the admin live feed
-- =====================================================================
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.order_items;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.order_status_events;
exception when duplicate_object then null; end $$;

-- =====================================================================
-- SEED DATA  (locations + menu) — from existing site mock data
-- =====================================================================
insert into public.locations (slug, name, address, city, phone, hours) values
  ('vernon','Vernon','123 Main St, Vernon, CT 06066','Vernon','(860) 555-1001','11am - 9pm'),
  ('south-windsor','South Windsor','456 Oak Ave, South Windsor, CT 06074','South Windsor','(860) 555-1002','11am - 9pm'),
  ('windsor-locks','Windsor Locks','789 Elm St, Windsor Locks, CT 06096','Windsor Locks','(860) 555-1003','11am - 9pm'),
  ('bristol','Bristol','321 Pine Rd, Bristol, CT 06010','Bristol','(860) 555-1004','11am - 9pm'),
  ('rocky-hill','Rocky Hill','654 Cedar Ln, Rocky Hill, CT 06067','Rocky Hill','(860) 555-1005','11am - 9pm'),
  ('enfield','Enfield','987 Maple Dr, Enfield, CT 06082','Enfield','(860) 555-1006','11am - 9pm')
on conflict (slug) do nothing;

insert into public.menu_categories (slug, name, description, sort_order) values
  ('patties','Jamaican Patties','Flaky, golden pastries filled with savory goodness',1),
  ('chicken','Chicken','Authentic Jamaican chicken dishes',2),
  ('oxtail','Oxtail','Slow-cooked, fall-off-the-bone tender',3),
  ('curry-goat','Curry Goat','Traditional Jamaican curry goat',4),
  ('seafood','Seafood','Fresh catches prepared island style',5),
  ('steak','Steak & Pork','Hearty meat dishes',6),
  ('sides','Sides','Perfect accompaniments',7),
  ('drinks','Drinks','Refreshing Caribbean beverages',8)
on conflict (slug) do nothing;

insert into public.menu_items (slug, category_id, name, description, base_price, image, spice_level, sort_order)
select v.slug, c.id, v.name, v.description, v.price, v.image, v.spice::public.spice_level, v.ord
from (values
  ('beef-patty','patties','Beef Patty','Classic Jamaican beef patty with seasoned ground beef',3.99,'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80','medium',1),
  ('chicken-patty','patties','Chicken Patty','Tender chicken filling with Caribbean spices',3.99,'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80','mild',2),
  ('veggie-patty','patties','Veggie Patty','Seasoned vegetables in a flaky crust',3.49,'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80','mild',3),
  ('coco-bread','patties','Coco Bread','Soft, slightly sweet Jamaican bread',1.99,'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80','mild',4),
  ('jerk-chicken','chicken','Jerk Chicken','Authentic jerk chicken marinated in our signature blend of Jamaican spices',14.99,'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&q=80','hot',1),
  ('curry-chicken','chicken','Curry Chicken','Tender chicken slow-cooked in rich Jamaican curry',13.99,'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80','medium',2),
  ('brown-stew-chicken','chicken','Brown Stew Chicken','Classic Jamaican brown stew chicken in savory gravy',13.99,'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&q=80','mild',3),
  ('fried-chicken','chicken','Fried Chicken','Crispy fried chicken seasoned with island spices',12.99,'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&q=80','mild',4),
  ('oxtail-dinner','oxtail','Oxtail Dinner','Tender, slow-cooked oxtail in rich brown gravy with butter beans',18.99,'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80','mild',1),
  ('oxtail-large','oxtail','Oxtail (Large)','Extra portion of our famous oxtail with all the fixings',24.99,'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80','mild',2),
  ('curry-goat-dinner','curry-goat','Curry Goat Dinner','Traditional Jamaican curry goat, seasoned and slow-cooked to perfection',17.99,'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80','medium',1),
  ('curry-goat-large','curry-goat','Curry Goat (Large)','Extra portion of our authentic curry goat',23.99,'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80','medium',2),
  ('escovitch-fish','seafood','Escovitch Fish','Crispy fried fish topped with pickled vegetables and scotch bonnet peppers',15.99,'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&q=80','hot',1),
  ('jerk-shrimp','seafood','Jerk Shrimp','Succulent shrimp marinated in jerk seasoning',16.99,'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80','hot',2),
  ('fish-chips','seafood','Fish & Chips','Crispy battered fish served with fries',13.99,'https://images.unsplash.com/photo-1579208030886-b937da0925dc?w=400&q=80','mild',3),
  ('pepper-steak','steak','Pepper Steak','Tender steak strips with bell peppers in savory brown sauce',16.99,'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80','mild',1),
  ('jerk-pork','steak','Jerk Pork','Slow-roasted pork marinated in authentic jerk spices',15.99,'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80','hot',2),
  ('rice-peas','sides','Rice & Peas','Traditional Jamaican rice cooked with coconut milk and kidney beans',4.99,'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=400&q=80','mild',1),
  ('fried-plantains','sides','Fried Plantains','Sweet, caramelized fried plantains',4.99,'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400&q=80','mild',2),
  ('cabbage','sides','Steamed Cabbage','Seasoned steamed cabbage with carrots',3.99,'https://images.unsplash.com/photo-1515543904279-3c4e0b3c8dd9?w=400&q=80','mild',3),
  ('festival','sides','Festival','Sweet fried dumplings',2.99,'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80','mild',4),
  ('sorrel','drinks','Sorrel','Traditional Jamaican hibiscus drink',3.99,'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80','mild',1),
  ('ginger-beer','drinks','Ginger Beer','Spicy Jamaican ginger beer',2.99,'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&q=80','medium',2),
  ('ting','drinks','Ting','Jamaican grapefruit soda',2.49,'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=400&q=80','mild',3)
) as v(slug, cat_slug, name, description, price, image, spice, ord)
join public.menu_categories c on c.slug = v.cat_slug
on conflict (slug) do nothing;

-- =====================================================================
-- DONE. Next: create an owner user in Auth, then:
--   insert into public.user_roles (user_id, role)
--   values ('<auth-user-uuid>', 'owner');
-- =====================================================================

-- #####################################################################
-- ###  0002_wallet_loyalty_reviews.sql
-- #####################################################################

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

-- a customer reading the line items of their own orders
drop policy if exists "customer reads own order items" on public.order_items;
create policy "customer reads own order items" on public.order_items for select
  using (order_id in (
    select o.id from public.orders o
    join public.customers c on c.id = o.customer_id
    where c.auth_user_id = auth.uid()
  ));

-- #####################################################################
-- ###  0003_full_menu.sql
-- #####################################################################

-- 0003_full_menu.sql
-- Full menu import from Jamaican_Kitchen_Online_Menu.xlsx:
-- 15 categories, 142 items, 19 modifier groups, 69 options, item->group links.
-- Images intentionally left blank (no guessed stock photos) -- admin uploads real
-- product photos via the Menu page; see 0004_menu_photo_storage.sql for the bucket.
-- Replaces the starter seed from 0001. Idempotent upserts.

begin;

-- ---- Modifier definition tables (menu-level) ----
create table if not exists public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  required boolean not null default false,
  min_select int not null default 0,
  max_select int not null default 1,
  multi_different boolean not null default false,
  multi_same boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.modifier_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.modifier_groups(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0,
  sort_order int not null default 0,
  unique (group_id, name)
);
alter table public.menu_items add column if not exists modifier_groups text[] not null default '{}';

alter table public.modifier_groups  enable row level security;
alter table public.modifier_options enable row level security;
drop policy if exists "public read modifier_groups" on public.modifier_groups;
create policy "public read modifier_groups" on public.modifier_groups for select using (true);
drop policy if exists "staff write modifier_groups" on public.modifier_groups;
create policy "staff write modifier_groups" on public.modifier_groups for all
  using (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'staff'))
  with check (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'staff'));
drop policy if exists "public read modifier_options" on public.modifier_options;
create policy "public read modifier_options" on public.modifier_options for select using (true);
drop policy if exists "staff write modifier_options" on public.modifier_options;
create policy "staff write modifier_options" on public.modifier_options for all
  using (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'staff'))
  with check (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'staff'));

-- ---- Seed modifier groups ----
insert into public.modifier_groups (slug,name,required,min_select,max_select,multi_different,multi_same,sort_order) values
  ('d-g-flavor-choice','D&G Flavor Choice',true,1,1,false,false,1),
  ('add-cheese','Add Cheese',false,0,1,false,false,2),
  ('dipping-sauce','Dipping Sauce',false,0,10,false,true,3),
  ('drink-choice','Drink Choice',true,1,1,false,false,4),
  ('extra-sauce','Extra Sauce',false,0,10,false,true,5),
  ('grace-flavor-choice','Grace Flavor Choice',true,1,1,false,false,6),
  ('gravy-option','Gravy Option',false,0,1,false,false,7),
  ('jerk-sauce-choice','Jerk Sauce Choice',true,1,1,false,false,8),
  ('choose-your-sauce','Choose Your Sauce',false,0,2,true,false,9),
  ('ketchup-option','Ketchup Option',false,0,1,false,false,10),
  ('supligen-flavor','Supligen Flavor',true,1,1,false,false,11),
  ('premium-sauce-upgrade','Premium Sauce Upgrade',false,0,1,false,false,12),
  ('sandwich-toppings','Sandwich Toppings',false,0,1,true,false,13),
  ('side-selection','Side Selection',true,1,1,false,false,14),
  ('breakfast-side-selection','Breakfast Side Selection',true,1,1,false,false,15),
  ('add-veg-patty','Add Veg Patty',false,0,10,true,true,16),
  ('wing-flavor','Wing Flavor',false,0,1,false,false,17),
  ('fries-sauce-choice','Fries Sauce Choice',false,0,1,false,false,18),
  ('sandwich-add-ons','Sandwich Add-Ons',false,0,1,false,false,19)
on conflict (slug) do update set
  name=excluded.name, required=excluded.required, min_select=excluded.min_select,
  max_select=excluded.max_select, multi_different=excluded.multi_different,
  multi_same=excluded.multi_same, sort_order=excluded.sort_order;

-- ---- Seed modifier options ----
insert into public.modifier_options (group_id,name,price,sort_order)
  select id,'Kola Champagne',0.0,1 from public.modifier_groups where slug='d-g-flavor-choice'
union all
  select id,'Pineapple Soda',0.0,2 from public.modifier_groups where slug='d-g-flavor-choice'
union all
  select id,'Ginger Beer',0.0,3 from public.modifier_groups where slug='d-g-flavor-choice'
union all
  select id,'Cream Soda',0.0,4 from public.modifier_groups where slug='d-g-flavor-choice'
union all
  select id,'Pineapple Ginger',0.0,5 from public.modifier_groups where slug='d-g-flavor-choice'
union all
  select id,'Cheese',1.0,1 from public.modifier_groups where slug='add-cheese'
union all
  select id,'Oxtail Dipping Sauce (2 oz)',0.99,1 from public.modifier_groups where slug='dipping-sauce'
union all
  select id,'Curry Goat Dipping Sauce (2 oz)',0.99,2 from public.modifier_groups where slug='dipping-sauce'
union all
  select id,'Curry Chicken Dipping Sauce (2 oz)',0.99,3 from public.modifier_groups where slug='dipping-sauce'
union all
  select id,'Jerk Dipping Sauce (2 oz)',0.99,4 from public.modifier_groups where slug='dipping-sauce'
union all
  select id,'Brown stew chicken dipping sauce (2 oz)',0.99,5 from public.modifier_groups where slug='dipping-sauce'
union all
  select id,'Coke',0.0,1 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Diet Coke',0.0,2 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Gatorade Lemon-Lime',0.0,3 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Gatorade Orange',0.0,4 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Gatorade Fruit Punch',0.0,5 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Gatorade Cool',0.0,6 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Sprite',0.0,7 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Snapple Apple',0.0,8 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Snapple fruit punch',0.0,9 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Snapple Kiwi Strawberry',0.0,10 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Side Sauce (2 oz)',0.99,1 from public.modifier_groups where slug='extra-sauce'
union all
  select id,'Pineapple Ginger',0.0,1 from public.modifier_groups where slug='grace-flavor-choice'
union all
  select id,'Island Mango',0.0,2 from public.modifier_groups where slug='grace-flavor-choice'
union all
  select id,'Mango Carrot',0.0,3 from public.modifier_groups where slug='grace-flavor-choice'
union all
  select id,'Reggae Medley',0.0,4 from public.modifier_groups where slug='grace-flavor-choice'
union all
  select id,'Curry Goat Gravy',0.0,1 from public.modifier_groups where slug='gravy-option'
union all
  select id,'Oxtail Gravy',0.0,2 from public.modifier_groups where slug='gravy-option'
union all
  select id,'Stew Chicken Gravy',0.0,3 from public.modifier_groups where slug='gravy-option'
union all
  select id,'Curry Chicken Gravy',0.0,4 from public.modifier_groups where slug='gravy-option'
union all
  select id,'Jerk Sauce',0.0,5 from public.modifier_groups where slug='gravy-option'
union all
  select id,'Pepper Steak Gravy',0.0,6 from public.modifier_groups where slug='gravy-option'
union all
  select id,'Jerk Sauce On It',0.0,1 from public.modifier_groups where slug='jerk-sauce-choice'
union all
  select id,'No Jerk Sauce',0.0,2 from public.modifier_groups where slug='jerk-sauce-choice'
union all
  select id,'Jerk Sauce On The Side',0.0,3 from public.modifier_groups where slug='jerk-sauce-choice'
union all
  select id,'Sweet & Spicy ketchup',0.0,1 from public.modifier_groups where slug='choose-your-sauce'
union all
  select id,'Regular ketchup',0.0,2 from public.modifier_groups where slug='choose-your-sauce'
union all
  select id,'Tartar Sauce',0.0,3 from public.modifier_groups where slug='choose-your-sauce'
union all
  select id,'Chipotle Mayo',0.0,4 from public.modifier_groups where slug='choose-your-sauce'
union all
  select id,'Spicy Ketchup',0.0,1 from public.modifier_groups where slug='ketchup-option'
union all
  select id,'Sweet & Spicy Ketchup',0.0,2 from public.modifier_groups where slug='ketchup-option'
union all
  select id,'Supligen Peanut',0.0,1 from public.modifier_groups where slug='supligen-flavor'
union all
  select id,'Supligen vanilla',0.0,2 from public.modifier_groups where slug='supligen-flavor'
union all
  select id,'Oxtail Sauce (2 oz)',0.99,1 from public.modifier_groups where slug='premium-sauce-upgrade'
union all
  select id,'Curry Goat Sauce (2 oz)',0.99,2 from public.modifier_groups where slug='premium-sauce-upgrade'
union all
  select id,'Curry Chicken Sauce (2 oz)',0.99,3 from public.modifier_groups where slug='premium-sauce-upgrade'
union all
  select id,'Chipotle Mayo',0.0,1 from public.modifier_groups where slug='sandwich-toppings'
union all
  select id,'Coleslaw',0.0,2 from public.modifier_groups where slug='sandwich-toppings'
union all
  select id,'Extra Cheese',1.0,3 from public.modifier_groups where slug='sandwich-toppings'
union all
  select id,'Rice and Peas and cabbage',0.0,1 from public.modifier_groups where slug='side-selection'
union all
  select id,'White Rice and cabbage',0.0,2 from public.modifier_groups where slug='side-selection'
union all
  select id,'White Rice',0.0,3 from public.modifier_groups where slug='side-selection'
union all
  select id,'Rice and peas',0.0,4 from public.modifier_groups where slug='side-selection'
union all
  select id,'Steamed Cabbage only',0.0,5 from public.modifier_groups where slug='side-selection'
union all
  select id,'Festival (3 pieces)',0.0,1 from public.modifier_groups where slug='breakfast-side-selection'
union all
  select id,'White Rice & Cabbage',0.0,2 from public.modifier_groups where slug='breakfast-side-selection'
union all
  select id,'Rice and Peas & Steamed Cabbage',0.0,3 from public.modifier_groups where slug='breakfast-side-selection'
union all
  select id,'White Rice',0.0,4 from public.modifier_groups where slug='breakfast-side-selection'
union all
  select id,'Rice and peas',0.0,5 from public.modifier_groups where slug='breakfast-side-selection'
union all
  select id,'Steamed cabbage only',0.0,6 from public.modifier_groups where slug='breakfast-side-selection'
union all
  select id,'Spinach Patty',3.9,1 from public.modifier_groups where slug='add-veg-patty'
union all
  select id,'Vegetable Patty',3.9,2 from public.modifier_groups where slug='add-veg-patty'
union all
  select id,'BBQ',0.0,1 from public.modifier_groups where slug='wing-flavor'
union all
  select id,'Jerk(spicy)',0.0,2 from public.modifier_groups where slug='wing-flavor'
union all
  select id,'Sweet & Spicy Ketchup',0.0,1 from public.modifier_groups where slug='fries-sauce-choice'
union all
  select id,'Ketchup',0.0,2 from public.modifier_groups where slug='fries-sauce-choice'
union all
  select id,'Chipotle Mayo',0.0,3 from public.modifier_groups where slug='fries-sauce-choice'
union all
  select id,'Plantain (2 pcs)',2.0,1 from public.modifier_groups where slug='sandwich-add-ons'
union all
  select id,'Side of Jerk Sauce',0.99,2 from public.modifier_groups where slug='sandwich-add-ons'
on conflict (group_id,name) do update set price=excluded.price, sort_order=excluded.sort_order;

-- ---- Categories ----
insert into public.menu_categories (slug,name,description,sort_order) values
  ('chicken','Chicken','Authentic Jamaican chicken — jerk, curry, stew & fried',1),
  ('oxtails','Oxtails','Slow-braised, fall-off-the-bone tender',2),
  ('goat-curry','Goat Curry','Traditional Jamaican curry goat',3),
  ('pork','Pork','Smoky, spicy jerk pork',4),
  ('seafood','Seafood','Fresh catches prepared island style',5),
  ('steak','Steak','Tender pepper steak in savory sauce',6),
  ('vegetarian-meals','Vegetarian Meals','Hearty plant-based island plates',7),
  ('patties','Patties','Flaky, golden pastries filled with savory goodness',8),
  ('side-orders','Side Orders','Perfect accompaniments',9),
  ('sandwiches-wraps','Sandwiches & Wraps','Island-style sandwiches on coco bread',10),
  ('breakfast','Breakfast','Jamaican breakfast classics',11),
  ('soups','Soups','Comforting, hearty island soups',12),
  ('drinks','Drinks','Refreshing Caribbean beverages',13),
  ('desserts','Desserts','Sweet island treats',14),
  ('gift-shop','Gift Shop','Take a taste of the island home',15)
on conflict (slug) do update set name=excluded.name, description=excluded.description, sort_order=excluded.sort_order;

-- ---- Menu items (image left blank -- upload real photos via admin) ----
insert into public.menu_items (slug,category_id,name,description,base_price,image,spice_level,sort_order,modifier_groups)
  select 'half-lb-curried-chicken',(select id from public.menu_categories where slug='chicken'),'1/2 lb. Curried Chicken','Tender chicken simmered in rich Jamaican curry with herbs, garlic, and spices—flavorful, hearty, and a true island favorite.',8.99,null,'medium'::public.spice_level,1,array['extra-sauce']::text[]
union all
  select 'half-lb-jerk-chicken',(select id from public.menu_categories where slug='chicken'),'1/2 lb. Jerk Chicken','Tender, smoky chicken marinated in authentic Jamaican spices, then jerked to perfection—bold, fiery, and bursting with island flavor in every bite.',9.59,null,'hot'::public.spice_level,2,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade']::text[]
union all
  select 'half-lb-stew-chicken',(select id from public.menu_categories where slug='chicken'),'1/2 lb. Stew Chicken','Tender chicken pieces slow-simmered in a savory brown gravy with onions, bell peppers, garlic, and thyme—rich, comforting, and packed with deep island flavor.',8.99,null,'mild'::public.spice_level,3,array['extra-sauce']::text[]
union all
  select '1-lb-curried-chicken',(select id from public.menu_categories where slug='chicken'),'1 lb. Curried Chicken','Tender chicken simmered in rich Jamaican curry with herbs, garlic, and spices—flavorful, hearty, and a true island favorite.',13.99,null,'medium'::public.spice_level,4,array['extra-sauce']::text[]
union all
  select '1-lb-jerk-chicken',(select id from public.menu_categories where slug='chicken'),'1 lb. Jerk Chicken','Tender, smoky chicken marinated in authentic Jamaican spices, then jerked to perfection—bold, fiery, and bursting with island flavor in every bite.',14.59,null,'hot'::public.spice_level,5,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade']::text[]
union all
  select '1-lb-stew-chicken',(select id from public.menu_categories where slug='chicken'),'1 lb. Stew Chicken','Tender chicken pieces slow-simmered in a savory brown gravy with onions, bell peppers, garlic, and thyme—rich, comforting, and packed with deep island flavor.',13.99,null,'mild'::public.spice_level,6,array['extra-sauce']::text[]
union all
  select 'boneless-curry-chicken-lg',(select id from public.menu_categories where slug='chicken'),'Boneless Curry Chicken - LG','Tender boneless chicken strips slow-cooked in aromatic curry with herbs and spices, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',15.3,null,'medium'::public.spice_level,7,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-curry-chicken-med',(select id from public.menu_categories where slug='chicken'),'Boneless Curry Chicken - MED','Tender boneless chicken strips slow-cooked in aromatic curry with herbs and spices, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',12.8,null,'medium'::public.spice_level,8,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-curry-chicken-sm',(select id from public.menu_categories where slug='chicken'),'Boneless Curry Chicken - SM','Tender boneless chicken strips slow-cooked in aromatic curry with herbs and spices, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',10.8,null,'medium'::public.spice_level,9,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-honey-bbq-chicken-lg',(select id from public.menu_categories where slug='chicken'),'Boneless Honey BBQ Chicken - LG','Tender boneless chicken strips coated in our sweet and smoky honey BBQ sauce, seasoned with Jamaican herbs and spices for a rich island flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',16.59,null,'mild'::public.spice_level,10,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-honey-bbq-chicken-med',(select id from public.menu_categories where slug='chicken'),'Boneless Honey BBQ Chicken - MED','Tender boneless chicken strips coated in our sweet and smoky honey BBQ sauce, seasoned with Jamaican herbs and spices for a rich island flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',13.99,null,'mild'::public.spice_level,11,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-honey-bbq-chicken-sm',(select id from public.menu_categories where slug='chicken'),'Boneless Honey BBQ Chicken - SM','Tender boneless chicken strips coated in our sweet and smoky honey BBQ sauce, seasoned with Jamaican herbs and spices for a rich island flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',11.99,null,'mild'::public.spice_level,12,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-stew-chicken-lg',(select id from public.menu_categories where slug='chicken'),'Boneless Stew Chicken - LG','Tender boneless chicken strips simmered in rich gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',15.3,null,'mild'::public.spice_level,13,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-stew-chicken-med',(select id from public.menu_categories where slug='chicken'),'Boneless Stew Chicken - MED','Tender boneless chicken strips simmered in rich gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',12.8,null,'mild'::public.spice_level,14,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-stew-chicken-sm',(select id from public.menu_categories where slug='chicken'),'Boneless Stew Chicken - SM','Tender boneless chicken strips simmered in rich gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',10.8,null,'mild'::public.spice_level,15,array['side-selection','extra-sauce']::text[]
union all
  select 'curry-chicken-lg',(select id from public.menu_categories where slug='chicken'),'Curry Chicken - LG','Tender chicken slow-cooked in aromatic curry with herbs and spices, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',15.79,null,'medium'::public.spice_level,16,array['side-selection','extra-sauce']::text[]
union all
  select 'curry-chicken-med',(select id from public.menu_categories where slug='chicken'),'Curry Chicken - MED','Tender chicken slow-cooked in aromatic curry with herbs and spices, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',13.49,null,'medium'::public.spice_level,17,array['side-selection','extra-sauce']::text[]
union all
  select 'curry-chicken-sm',(select id from public.menu_categories where slug='chicken'),'Curry Chicken - SM','Tender chicken slow-cooked in aromatic curry with herbs and spices, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',10.99,null,'medium'::public.spice_level,18,array['side-selection','extra-sauce']::text[]
union all
  select 'fried-chicken-12-pieces',(select id from public.menu_categories where slug='chicken'),'Fried Chicken 12 Pieces','Golden, crunchy, and seasoned to the bone—this juicy fried chicken delivers big flavor and island-style comfort in every bite',28.99,null,'mild'::public.spice_level,19,array['ketchup-option','gravy-option']::text[]
union all
  select 'fried-chicken-3-pieces',(select id from public.menu_categories where slug='chicken'),'Fried Chicken 3 Pieces','Golden, crunchy, and seasoned to the bone—this juicy fried chicken delivers big flavor and island-style comfort in every bite',8.99,null,'mild'::public.spice_level,20,array['ketchup-option','gravy-option']::text[]
union all
  select 'fried-chicken-6-pieces',(select id from public.menu_categories where slug='chicken'),'Fried Chicken 6 Pieces','Golden, crunchy, and seasoned to the bone—this juicy fried chicken delivers big flavor and island-style comfort in every bite',15.99,null,'mild'::public.spice_level,21,array['ketchup-option','gravy-option']::text[]
union all
  select 'fried-chicken-lg',(select id from public.menu_categories where slug='chicken'),'Fried Chicken - LG','Crispy, golden fried chicken seasoned with our Jamaican blend, delivering a satisfying crunch and juicy finish in every bite. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',16.59,null,'mild'::public.spice_level,22,array['side-selection','gravy-option']::text[]
union all
  select 'fried-chicken-med',(select id from public.menu_categories where slug='chicken'),'Fried Chicken - MED','Crispy, golden fried chicken seasoned with our Jamaican blend, delivering a satisfying crunch and juicy finish in every bite. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',13.99,null,'mild'::public.spice_level,23,array['side-selection','gravy-option']::text[]
union all
  select 'fried-chicken-sm',(select id from public.menu_categories where slug='chicken'),'Fried Chicken - SM','Crispy, golden fried chicken seasoned with our Jamaican blend, delivering a satisfying crunch and juicy finish in every bite. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',11.99,null,'mild'::public.spice_level,24,array['side-selection','gravy-option']::text[]
union all
  select 'jamaican-wings-lg',(select id from public.menu_categories where slug='chicken'),'Jamaican Wings - LG','A customer favorite—our signature jerk wings, marinated in bold Jamaican spices and oven-roasted for a rich, smoky flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',16.59,null,'hot'::public.spice_level,25,array['side-selection','premium-sauce-upgrade','extra-sauce','wing-flavor']::text[]
union all
  select 'jamaican-wings-med',(select id from public.menu_categories where slug='chicken'),'Jamaican Wings - MED','A customer favorite—our signature jerk wings, marinated in bold Jamaican spices and oven-roasted for a rich, smoky flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',13.99,null,'hot'::public.spice_level,26,array['side-selection','premium-sauce-upgrade','extra-sauce','wing-flavor']::text[]
union all
  select 'jamaican-wings-sm',(select id from public.menu_categories where slug='chicken'),'Jamaican Wings - SM','A customer favorite—our signature jerk wings, marinated in bold Jamaican spices and oven-roasted for a rich, smoky flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',11.99,null,'hot'::public.spice_level,27,array['side-selection','premium-sauce-upgrade','extra-sauce','wing-flavor']::text[]
union all
  select 'jerk-chicken-lg',(select id from public.menu_categories where slug='chicken'),'Jerk Chicken - LG','Our signature jerk chicken is marinated in bold Jamaican spices and slow-roasted for a rich, smoky flavor. Served with a scoop of rice & peas.',16.59,null,'hot'::public.spice_level,28,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade','side-selection']::text[]
union all
  select 'jerk-chicken-med',(select id from public.menu_categories where slug='chicken'),'Jerk Chicken - MED','Our signature jerk chicken is marinated in bold Jamaican spices and slow-roasted for a rich, smoky flavor. Served with a scoop of rice & peas.',13.99,null,'hot'::public.spice_level,29,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade','side-selection']::text[]
union all
  select 'jerk-chicken-sm',(select id from public.menu_categories where slug='chicken'),'Jerk Chicken - SM','Our signature jerk chicken is marinated in bold Jamaican spices and slow-roasted for a rich, smoky flavor. Served with a scoop of rice & peas.',11.99,null,'hot'::public.spice_level,30,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade','side-selection']::text[]
union all
  select 'stew-chicken-lg',(select id from public.menu_categories where slug='chicken'),'Stew Chicken - LG','Tender chicken simmered in rich gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',15.79,null,'mild'::public.spice_level,31,array['side-selection','extra-sauce']::text[]
union all
  select 'stew-chicken-med',(select id from public.menu_categories where slug='chicken'),'Stew Chicken - MED','Tender chicken simmered in rich gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',13.49,null,'mild'::public.spice_level,32,array['side-selection','extra-sauce']::text[]
union all
  select 'stew-chicken-sm',(select id from public.menu_categories where slug='chicken'),'Stew Chicken - SM','Tender chicken simmered in rich gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',10.99,null,'mild'::public.spice_level,33,array['side-selection','extra-sauce']::text[]
union all
  select '3-wings',(select id from public.menu_categories where slug='chicken'),'3 Wings','Smoky, spicy, and perfectly grilled—these jerk-seasoned wings are bold, juicy, and packed with authentic Jamaican flavor in every bite.',7.99,null,'hot'::public.spice_level,34,array['extra-sauce','wing-flavor']::text[]
union all
  select 'wings-12-by-the-dozen',(select id from public.menu_categories where slug='chicken'),'Wings 12 (By the Dozen)','Smoky, spicy, and perfectly grilled—these jerk-seasoned wings are bold, juicy, and packed with authentic Jamaican flavor in every bite.',18.99,null,'hot'::public.spice_level,35,array['extra-sauce','wing-flavor']::text[]
union all
  select 'wings-6',(select id from public.menu_categories where slug='chicken'),'Wings 6','Smoky, spicy, and perfectly grilled—these jerk-seasoned wings are bold, juicy, and packed with authentic Jamaican flavor in every bite.',12.99,null,'hot'::public.spice_level,36,array['extra-sauce','wing-flavor']::text[]
union all
  select 'half-lb-oxtail',(select id from public.menu_categories where slug='oxtails'),'1/2 lb. Oxtail','Fall off the bone slow-braised in a rich, savory gravy, paired with creamy butter beans—heartwarming, comforting, and full of deep island flavor.',12.99,null,'mild'::public.spice_level,1,array['extra-sauce']::text[]
union all
  select '1-lb-oxtail',(select id from public.menu_categories where slug='oxtails'),'1 lb. Oxtail','Fall off the bone slow-braised in a rich, savory gravy, paired with creamy butter beans—heartwarming, comforting, and full of deep island flavor.',19.99,null,'mild'::public.spice_level,2,array['extra-sauce']::text[]
union all
  select 'oxtail-lg',(select id from public.menu_categories where slug='oxtails'),'Oxtail - LG','Slow-braised oxtail simmered in savory gravy with butter beans, seasoned with our Jamaican blend for a deep, bold taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',26.99,null,'mild'::public.spice_level,3,array['side-selection','extra-sauce']::text[]
union all
  select 'oxtail-med',(select id from public.menu_categories where slug='oxtails'),'Oxtail - MED','Slow-braised oxtail simmered in savory gravy with butter beans, seasoned with our Jamaican blend for a deep, bold taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',22.49,null,'mild'::public.spice_level,4,array['side-selection','extra-sauce']::text[]
union all
  select 'half-lb-curry-goat',(select id from public.menu_categories where slug='goat-curry'),'1/2 lb. Curry Goat','Tender, slow-cooked goat simmered in rich Jamaican curry with herbs, garlic, and spices—bold, savory, and full of deep island flavor in every bite.',11.29,null,'medium'::public.spice_level,1,array['extra-sauce']::text[]
union all
  select '1-lb-curry-goat',(select id from public.menu_categories where slug='goat-curry'),'1 lb. Curry Goat','Tender, slow-cooked goat simmered in rich Jamaican curry with herbs, garlic, and spices—bold, savory, and full of deep island flavor in every bite.',16.99,null,'medium'::public.spice_level,2,array['extra-sauce']::text[]
union all
  select 'curry-goat-med',(select id from public.menu_categories where slug='goat-curry'),'Curry Goat - MED','Tender goat slow-cooked in aromatic curry, seasoned with our Jamaican blend for a bold, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',17.99,null,'medium'::public.spice_level,3,array['side-selection','extra-sauce']::text[]
union all
  select 'curry-goat-lg',(select id from public.menu_categories where slug='goat-curry'),'Curry Goat - LG','Tender goat slow-cooked in aromatic curry, seasoned with our Jamaican blend for a bold, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',21.99,null,'medium'::public.spice_level,4,array['side-selection','extra-sauce']::text[]
union all
  select 'half-lb-jerk-pork',(select id from public.menu_categories where slug='pork'),'1/2 lb. Jerk Pork','Tender, juicy pork cubes marinated in authentic jerk seasoning and grilled to smoky perfection—spicy, flavorful, and full of island fire.',9.59,null,'hot'::public.spice_level,1,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade']::text[]
union all
  select '1-lb-jerk-pork',(select id from public.menu_categories where slug='pork'),'1 lb. Jerk Pork','Tender, juicy pork cubes marinated in authentic jerk seasoning and grilled to smoky perfection—spicy, flavorful, and full of island fire.',14.59,null,'hot'::public.spice_level,2,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade']::text[]
union all
  select 'jerk-pork-lg',(select id from public.menu_categories where slug='pork'),'Jerk Pork - LG','A customer favourite—tender, slow-cooked pork marinated in bold Jamaican spices, delivering rich flavour with a signature kick. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',16.59,null,'hot'::public.spice_level,3,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade','side-selection']::text[]
union all
  select 'jerk-pork-med',(select id from public.menu_categories where slug='pork'),'Jerk Pork - MED','A customer favourite—tender, slow-cooked pork marinated in bold Jamaican spices, delivering rich flavour with a signature kick. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',13.99,null,'hot'::public.spice_level,4,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade','side-selection']::text[]
union all
  select 'jerk-pork-sm',(select id from public.menu_categories where slug='pork'),'Jerk Pork - SM','A customer favourite—tender, slow-cooked pork marinated in bold Jamaican spices, delivering rich flavour with a signature kick. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',11.99,null,'hot'::public.spice_level,5,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade','side-selection']::text[]
union all
  select 'brown-stew-red-snapper-fish-three-quarter-1lbs',(select id from public.menu_categories where slug='seafood'),'Brown Stew Red Snapper Fish 3/4-1lbs','Whole red snapper simmered in a rich brown stew sauce with onions, peppers, herbs, and Jamaican spices for a bold, savory island flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',25.99,null,'mild'::public.spice_level,1,array['side-selection']::text[]
union all
  select 'escovitch-red-snapper-fish-three-quarter-1-lb',(select id from public.menu_categories where slug='seafood'),'Escovitch Red Snapper Fish 3/4-1 lb','Crispy fried red snapper topped with our signature escovitch blend of tangy pickled onions, carrots, and peppers for a zesty, bold Jamaican flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',25.99,null,'medium'::public.spice_level,2,array['side-selection']::text[]
union all
  select 'steamed-red-snapper-fish-three-quarter-1lbs',(select id from public.menu_categories where slug='seafood'),'Steamed Red Snapper Fish - 3/4-1lbs','Whole red snapper steamed with onions, peppers, pumpkin, carrots, fresh herbs, Jamaican spices, and rich coconut milk for authentic island flavor.',25.99,null,'mild'::public.spice_level,3,array['side-selection']::text[]
union all
  select 'brown-stew-shrimp-lg',(select id from public.menu_categories where slug='seafood'),'Brown Stew Shrimp - LG','Simmered in rich brown stew gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',19.99,null,'mild'::public.spice_level,4,array['side-selection']::text[]
union all
  select 'brown-stew-shrimp-med',(select id from public.menu_categories where slug='seafood'),'Brown Stew Shrimp - MED','Simmered in rich brown stew gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',16.99,null,'mild'::public.spice_level,5,array['side-selection']::text[]
union all
  select 'brown-stew-shrimp-sm',(select id from public.menu_categories where slug='seafood'),'Brown Stew Shrimp - SM','Simmered in rich brown stew gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',12.99,null,'mild'::public.spice_level,6,array['side-selection']::text[]
union all
  select 'curried-shrimp-sm',(select id from public.menu_categories where slug='seafood'),'Curried Shrimp - SM','Simmered in aromatic curry, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',12.99,null,'medium'::public.spice_level,7,array['side-selection']::text[]
union all
  select 'curry-shrimp-lg',(select id from public.menu_categories where slug='seafood'),'Curry Shrimp - LG','Simmered in aromatic curry, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',19.99,null,'medium'::public.spice_level,8,array['side-selection']::text[]
union all
  select 'curry-shrimp-med',(select id from public.menu_categories where slug='seafood'),'Curry Shrimp - MED','Simmered in aromatic curry, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',16.99,null,'medium'::public.spice_level,9,array['side-selection']::text[]
union all
  select 'jerk-shrimp-lg',(select id from public.menu_categories where slug='seafood'),'Jerk Shrimp - LG','Juicy shrimp seasoned with bold Jamaican jerk spices, cooked to perfection for a rich, smoky flavor with a signature island kick. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',19.99,null,'hot'::public.spice_level,10,array['side-selection']::text[]
union all
  select 'jerk-shrimp-med',(select id from public.menu_categories where slug='seafood'),'Jerk Shrimp - MED','Juicy shrimp seasoned with bold Jamaican jerk spices, cooked to perfection for a rich, smoky flavor with a signature island kick. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',16.99,null,'hot'::public.spice_level,11,array['side-selection']::text[]
union all
  select 'jerk-shrimp-sm',(select id from public.menu_categories where slug='seafood'),'Jerk Shrimp - SM','Juicy shrimp seasoned with bold Jamaican jerk spices, cooked to perfection for a rich, smoky flavor with a signature island kick. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',12.99,null,'hot'::public.spice_level,12,array['side-selection']::text[]
union all
  select 'sweet-chilli-fried-shrimp-lg',(select id from public.menu_categories where slug='seafood'),'Sweet Chilli Fried Shrimp - LG','Crispy fried shrimp tossed in our sweet chili sauce, delivering the perfect balance of sweetness and mild heat. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',19.99,null,'medium'::public.spice_level,13,array['side-selection']::text[]
union all
  select 'sweet-chilli-fried-shrimp-med',(select id from public.menu_categories where slug='seafood'),'Sweet Chilli Fried Shrimp - MED','Crispy fried shrimp tossed in our sweet chili sauce, delivering the perfect balance of sweetness and mild heat. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',16.99,null,'medium'::public.spice_level,14,array['side-selection']::text[]
union all
  select 'sweet-chilli-fried-shrimp-sm',(select id from public.menu_categories where slug='seafood'),'Sweet Chilli Fried Shrimp - SM','Crispy fried shrimp tossed in our sweet chili sauce, delivering the perfect balance of sweetness and mild heat. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',12.99,null,'medium'::public.spice_level,15,array['side-selection']::text[]
union all
  select 'half-lb-pepper-steak',(select id from public.menu_categories where slug='steak'),'1/2 lb. Pepper Steak','Tender beef strips with vibrant bell peppers in a savory sauce.',11.29,null,'medium'::public.spice_level,1,'{}'::text[]
union all
  select '1-lb-pepper-steak',(select id from public.menu_categories where slug='steak'),'1 lb. Pepper Steak','Tender beef strips with vibrant bell peppers in a savory sauce.',16.99,null,'medium'::public.spice_level,2,'{}'::text[]
union all
  select 'pepper-steak-lg',(select id from public.menu_categories where slug='steak'),'Pepper Steak - LG','Tender steak strips sautéed with onions and peppers in a savory sauce, seasoned with our Jamaican blend for a bold, satisfying taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',21.99,null,'medium'::public.spice_level,3,array['side-selection']::text[]
union all
  select 'pepper-steak-med',(select id from public.menu_categories where slug='steak'),'Pepper Steak - MED','Tender steak strips sautéed with onions and peppers in a savory sauce, seasoned with our Jamaican blend for a bold, satisfying taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',17.99,null,'medium'::public.spice_level,4,array['side-selection']::text[]
union all
  select 'half-lb-curry-chickpeas',(select id from public.menu_categories where slug='vegetarian-meals'),'1/2 lb. Curry Chickpeas','Tender chickpeas simmered in a fragrant curry sauce with herbs and spices—hearty, vegan-friendly, and packed with bold Jamaican flavor.',5.0,null,'medium'::public.spice_level,1,'{}'::text[]
union all
  select '1-lb-curry-chickpeas',(select id from public.menu_categories where slug='vegetarian-meals'),'1 lb. Curry Chickpeas','Tender chickpeas simmered in a fragrant curry sauce with herbs and spices—hearty, vegan-friendly, and packed with bold Jamaican flavor.',8.0,null,'medium'::public.spice_level,2,'{}'::text[]
union all
  select 'curried-chick-peas-lg',(select id from public.menu_categories where slug='vegetarian-meals'),'Curried Chick Peas - LG','Tender chickpeas simmered in coconut curry with pumpkin, carrots, potatoes, butter beans, onions, and peppers for a hearty island classic. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',14.49,null,'medium'::public.spice_level,3,array['side-selection','add-veg-patty']::text[]
union all
  select 'curried-chick-peas-med',(select id from public.menu_categories where slug='vegetarian-meals'),'Curried Chick Peas - MED','Tender chickpeas simmered in coconut curry with pumpkin, carrots, potatoes, butter beans, onions, and peppers for a hearty island classic. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',12.29,null,'medium'::public.spice_level,4,array['side-selection','add-veg-patty']::text[]
union all
  select 'curried-chick-peas-sm',(select id from public.menu_categories where slug='vegetarian-meals'),'Curried Chick Peas - SM','Tender chickpeas simmered in coconut curry with pumpkin, carrots, potatoes, butter beans, onions, and peppers for a hearty island classic. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',10.29,null,'medium'::public.spice_level,5,array['side-selection','add-veg-patty']::text[]
union all
  select 'rice-peas-cabbage-lg',(select id from public.menu_categories where slug='vegetarian-meals'),'Rice & Peas & CABBAGE - LG','Perfectly seasoned rice & peas served with fresh steamed cabbage and carrots, lightly tossed in island herbs and spices for a classic Jamaican side',10.99,null,'mild'::public.spice_level,6,array['add-veg-patty']::text[]
union all
  select 'rice-peas-cabbage-med',(select id from public.menu_categories where slug='vegetarian-meals'),'Rice & Peas & Cabbage - MED','Perfectly seasoned rice & peas served with fresh steamed cabbage and carrots, lightly tossed in island herbs and spices for a classic Jamaican side',8.49,null,'mild'::public.spice_level,7,array['add-veg-patty']::text[]
union all
  select 'rice-peas-cabbage-sm',(select id from public.menu_categories where slug='vegetarian-meals'),'Rice & Peas & CABBAGE - SM','Perfectly seasoned rice & peas served with fresh steamed cabbage and carrots, lightly tossed in island herbs and spices for a classic Jamaican side',6.99,null,'mild'::public.spice_level,8,array['add-veg-patty']::text[]
union all
  select 'rice-peas-lg',(select id from public.menu_categories where slug='vegetarian-meals'),'Rice & Peas - LG','Our signature Jamaican rice & peas, simmered in coconut milk with thyme, Scallion, and traditional island spices for a rich, aromatic flavor.',8.99,null,'mild'::public.spice_level,9,array['add-veg-patty']::text[]
union all
  select 'rice-peas-med',(select id from public.menu_categories where slug='vegetarian-meals'),'Rice & Peas - MED','Our signature Jamaican rice & peas, simmered in coconut milk with thyme, Scallion, and traditional island spices for a rich, aromatic flavor.',6.99,null,'mild'::public.spice_level,10,array['add-veg-patty']::text[]
union all
  select 'rice-peas-sm',(select id from public.menu_categories where slug='vegetarian-meals'),'Rice & Peas - SM','Our signature Jamaican rice & peas, simmered in coconut milk with thyme, Scallion, and traditional island spices for a rich, aromatic flavor.',5.49,null,'mild'::public.spice_level,11,array['add-veg-patty']::text[]
union all
  select 'steamed-cabbage-sm',(select id from public.menu_categories where slug='vegetarian-meals'),'Steamed CABBAGE - SM','Fresh cabbage and carrots lightly steamed and seasoned with island herbs and spices for a simple, flavorful Jamaican side.',5.49,null,'mild'::public.spice_level,12,array['add-veg-patty']::text[]
union all
  select 'steamed-cabbage-lg',(select id from public.menu_categories where slug='vegetarian-meals'),'Steamed CABBAGE - LG','Fresh cabbage and carrots lightly steamed and seasoned with island herbs and spices for a simple, flavorful Jamaican side.',8.99,null,'mild'::public.spice_level,13,array['add-veg-patty']::text[]
union all
  select 'steamed-cabbage-med',(select id from public.menu_categories where slug='vegetarian-meals'),'Steamed CABBAGE - MED','Fresh cabbage and carrots lightly steamed and seasoned with island herbs and spices for a simple, flavorful Jamaican side.',6.99,null,'mild'::public.spice_level,14,array['add-veg-patty']::text[]
union all
  select 'sweet-sour-tofu-lg',(select id from public.menu_categories where slug='vegetarian-meals'),'Sweet + Sour Tofu - LG','Crispy golden tofu tossed in a sweet & sour pineapple glaze with sautéed onions and green peppers for a bold, balanced Jamaican flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',14.49,null,'mild'::public.spice_level,15,array['side-selection','add-veg-patty']::text[]
union all
  select 'sweet-sour-tofu-med',(select id from public.menu_categories where slug='vegetarian-meals'),'Sweet + Sour Tofu - MED','Crispy golden tofu tossed in a sweet & sour pineapple glaze with sautéed onions and green peppers for a bold, balanced Jamaican flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',12.29,null,'mild'::public.spice_level,16,array['side-selection','add-veg-patty']::text[]
union all
  select 'sweet-sour-tofu-sm',(select id from public.menu_categories where slug='vegetarian-meals'),'Sweet + Sour Tofu - SM','Crispy golden tofu tossed in a sweet & sour pineapple glaze with sautéed onions and green peppers for a bold, balanced Jamaican flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',10.29,null,'mild'::public.spice_level,17,array['side-selection','add-veg-patty']::text[]
union all
  select 'white-rice-cabbage-lg',(select id from public.menu_categories where slug='vegetarian-meals'),'White Rice & Cabbage - LG','Fluffy white rice served with our lightly steamed cabbage and carrots, seasoned with simple island herbs and spices for a clean, comforting classic.',10.99,null,'mild'::public.spice_level,18,array['add-veg-patty']::text[]
union all
  select 'white-rice-cabbage-med',(select id from public.menu_categories where slug='vegetarian-meals'),'White Rice & CABBAGE - MED','Fluffy white rice served with our lightly steamed cabbage and carrots, seasoned with simple island herbs and spices for a clean, comforting classic.',8.49,null,'mild'::public.spice_level,19,array['add-veg-patty']::text[]
union all
  select 'white-rice-cabbage-sm',(select id from public.menu_categories where slug='vegetarian-meals'),'White Rice & Cabbage - SM','Fluffy white rice served with our lightly steamed cabbage and carrots, seasoned with simple island herbs and spices for a clean, comforting classic.',6.99,null,'mild'::public.spice_level,20,array['add-veg-patty']::text[]
union all
  select 'white-rice-lg',(select id from public.menu_categories where slug='vegetarian-meals'),'White Rice - LG','Perfectly steamed white rice with a light, fluffy texture—simple, satisfying, and the perfect complement to any meal.',8.99,null,'mild'::public.spice_level,21,array['add-veg-patty']::text[]
union all
  select 'white-rice-med',(select id from public.menu_categories where slug='vegetarian-meals'),'White Rice - MED','Perfectly steamed white rice with a light, fluffy texture—simple, satisfying, and the perfect complement to any meal.',6.99,null,'mild'::public.spice_level,22,array['add-veg-patty']::text[]
union all
  select 'white-rice-sm',(select id from public.menu_categories where slug='vegetarian-meals'),'White Rice - SM','Perfectly steamed white rice with a light, fluffy texture—simple, satisfying, and the perfect complement to any meal.',5.49,null,'mild'::public.spice_level,23,array['add-veg-patty']::text[]
union all
  select 'beef-patty-mild',(select id from public.menu_categories where slug='patties'),'Beef Patty Mild','Flaky crust filled with perfectly seasoned ground beef—savory, juicy, and packed with flavor without the heat.',3.9,null,'mild'::public.spice_level,1,array['dipping-sauce']::text[]
union all
  select 'beef-patty-spicy',(select id from public.menu_categories where slug='patties'),'Beef Patty Spicy','Bold and fiery ground beef wrapped in a flaky crust—packed with island spices for a delicious kick in every bite.',3.9,null,'hot'::public.spice_level,2,array['dipping-sauce']::text[]
union all
  select 'cheesy-beef-mild',(select id from public.menu_categories where slug='patties'),'Cheesy Beef Mild','Flaky crust filled with gently seasoned ground beef and melted cheese—smooth, savory, and perfect for those who like rich flavor without the heat.',4.49,null,'mild'::public.spice_level,3,array['dipping-sauce']::text[]
union all
  select 'cheesy-beef-spicy',(select id from public.menu_categories where slug='patties'),'Cheesy Beef Spicy','Flaky crust filled with gently seasoned ground beef and melted cheese—smooth, savory, and perfect for those who like rich flavor without the heat.',4.49,null,'hot'::public.spice_level,4,array['dipping-sauce']::text[]
union all
  select 'chicken-patty',(select id from public.menu_categories where slug='patties'),'Chicken Patty','Tender curry-spiced chicken wrapped in a flaky crust—bold, aromatic, and bursting with rich Jamaican flavor in every bite.',3.9,null,'medium'::public.spice_level,5,array['dipping-sauce','add-cheese']::text[]
union all
  select 'coco-bread',(select id from public.menu_categories where slug='patties'),'Coco Bread','Soft, slightly sweet, and buttery—this delightful Jamaican bread is perfect on its own or wrapped around a patty for the ultimate bite.',2.6,null,'mild'::public.spice_level,6,'{}'::text[]
union all
  select 'coco-bread-n-cheese',(select id from public.menu_categories where slug='patties'),'Coco Bread N Cheese','Warm, fluffy coco bread layered with thick slices of creamy cheese—a soft, savory-sweet combo that melts in your mouth with every bite.',3.69,null,'mild'::public.spice_level,7,'{}'::text[]
union all
  select 'jerk-patty',(select id from public.menu_categories where slug='patties'),'Jerk Patty','Flaky, golden pastry filled with tender chicken seasoned in our signature Jamaican jerk blend—featuring bold spices, smoky heat, and a hint of island sweetness. Baked to perfection for a crisp, buttery crust and a juicy, flavorful center',3.9,null,'hot'::public.spice_level,8,array['dipping-sauce','add-cheese']::text[]
union all
  select 'spinach-patty-vegetarian',(select id from public.menu_categories where slug='patties'),'Spinach Patty - Vegetarian','Flaky crust filled with seasoned spinach and aromatic herbs—savory, wholesome, and bursting with vibrant island flavor in every bite.',3.9,null,'mild'::public.spice_level,9,array['dipping-sauce','add-cheese']::text[]
union all
  select 'veggie-patty',(select id from public.menu_categories where slug='patties'),'Veggie Patty','A flaky crust filled with seasoned vegetables and aromatic herbs—wholesome, savory, and packed with plant-powered island flavor in every bite.',3.9,null,'mild'::public.spice_level,10,array['dipping-sauce','add-cheese']::text[]
union all
  select 'coleslaw',(select id from public.menu_categories where slug='side-orders'),'Coleslaw','Crisp cabbage and carrots tossed in a creamy, tangy dressing—cool, refreshing, and the perfect side to balance bold island flavors.',4.49,null,'mild'::public.spice_level,1,'{}'::text[]
union all
  select 'cup-sauce',(select id from public.menu_categories where slug='side-orders'),'Cup Sauce','A bold, smoky blend of scotch bonnet peppers, herbs, and spices. Perfect for dipping, marinating, or adding heat to any dish.',3.0,null,'hot'::public.spice_level,2,'{}'::text[]
union all
  select 'fries',(select id from public.menu_categories where slug='side-orders'),'Fries','Crispy, golden, and perfectly salted—classic fries that make the perfect sidekick to any meal.',4.49,null,'mild'::public.spice_level,3,array['fries-sauce-choice']::text[]
union all
  select 'jerk-chicken-mac-n-cheese',(select id from public.menu_categories where slug='side-orders'),'Jerk Chicken Mac N Cheese','Creamy, cheesy macaroni with a bold twist—blended with spicy jerk seasoning for a smoky, flavorful kick in every bite.',10.99,null,'hot'::public.spice_level,4,'{}'::text[]
union all
  select 'jk-jerk-sauce',(select id from public.menu_categories where slug='side-orders'),'Jk Jerk Sauce','A bold, smoky blend of scotch bonnet peppers, herbs, and spices. Perfect for dipping, marinating, or adding heat to any dish.',4.0,null,'hot'::public.spice_level,5,'{}'::text[]
union all
  select 'sweet-plantains-3',(select id from public.menu_categories where slug='side-orders'),'Sweet Plantains 3','Ripe plantains sliced and caramelized to golden perfection—soft, sweet, and bursting with rich, tropical flavor in every bite.',2.0,null,'mild'::public.spice_level,6,'{}'::text[]
union all
  select 'sweet-plantains-6',(select id from public.menu_categories where slug='side-orders'),'Sweet Plantains 6','Ripe plantains sliced and caramelized to golden perfection—soft, sweet, and bursting with rich, tropical flavor in every bite.',3.99,null,'mild'::public.spice_level,7,'{}'::text[]
union all
  select 'crispy-chicken-sandwich',(select id from public.menu_categories where slug='sandwiches-wraps'),'Crispy Chicken Sandwich','Crispy, golden-fried chicken served on soft Jamaican coco bread with fresh lettuce, tomato, and creamy mayo for a satisfying, flavorful bite.',10.99,null,'mild'::public.spice_level,1,'{}'::text[]
union all
  select 'extra-cheese',(select id from public.menu_categories where slug='sandwiches-wraps'),'Extra cheese','Rich, bold, and unmistakably Jamaican—this firm, flavorful cheddar-style cheese is perfect with hard dough bread or tucked into a warm patty.',1.0,null,'mild'::public.spice_level,2,'{}'::text[]
union all
  select 'fish-chips',(select id from public.menu_categories where slug='sandwiches-wraps'),'Fish + Chips','crispy, golden-fried fish served with thick-cut fries—hot, hearty, and perfectly seasoned for a satisfying island-style take on a classic favorite.',13.59,null,'mild'::public.spice_level,3,array['choose-your-sauce']::text[]
union all
  select 'fish-sandwich',(select id from public.menu_categories where slug='sandwiches-wraps'),'Fish Sandwich','Crispy fried fish served on soft, buttery coco bread with melted cheese and tangy tartar sauce—simple, rich, and bursting with island comfort.',11.49,null,'mild'::public.spice_level,4,array['sandwich-toppings']::text[]
union all
  select 'jerk-chicken-sandwich',(select id from public.menu_categories where slug='sandwiches-wraps'),'Jerk Chicken Sandwich','Spicy, smoky jerk chicken stacked on soft, buttery coco bread with creamy coleslaw and zesty chipotle mayo—bold, juicy, and packed with island heat and flavor.',10.99,null,'hot'::public.spice_level,5,array['sandwich-toppings','sandwich-add-ons']::text[]
union all
  select 'jerk-pork-sandwich',(select id from public.menu_categories where slug='sandwiches-wraps'),'Jerk Pork Sandwich','Savory minced jerk pork piled high on soft, buttery coco bread with a drizzle of smoky chipotle mayo—spicy, juicy, and bursting with island flavor in every bite.',10.99,null,'hot'::public.spice_level,6,array['sandwich-toppings','sandwich-add-ons']::text[]
union all
  select 'ackee-saltfish-med',(select id from public.menu_categories where slug='breakfast'),'Ackee & Saltfish - MED','Creamy ackee gently sautéed with tender flaked saltfish, onions, peppers, and aromatic herbs—savory, comforting, and Jamaica''s beloved national dish. Served in a medium container.',16.99,null,'mild'::public.spice_level,1,array['breakfast-side-selection']::text[]
union all
  select 'callaloo-salt-fish-med',(select id from public.menu_categories where slug='breakfast'),'Callaloo & Salt Fish - MED','Tender callaloo leaves sautéed with flaky saltfish, garlic, onions, and a hint of thyme—hearty, savory, and brimming with authentic island flavor, served in a medium container for a satisfying portion.',12.99,null,'mild'::public.spice_level,2,array['breakfast-side-selection']::text[]
union all
  select 'carrot-dumpling-3',(select id from public.menu_categories where slug='breakfast'),'Carrot Dumpling 3','Crispy on the outside, soft on the inside—these golden dumplings are made with grated carrot for sweetness in every bite.',4.49,null,'mild'::public.spice_level,3,'{}'::text[]
union all
  select 'festival-3',(select id from public.menu_categories where slug='breakfast'),'Festival 3','Golden, crispy on the outside and soft on the inside—these sweet, doughy Jamaican fried festivals are the perfect companion to jerk meats, fried fish, or just enjoyed on their own. Island comfort in every bite.',4.49,null,'hot'::public.spice_level,4,'{}'::text[]
union all
  select 'porridge-lg',(select id from public.menu_categories where slug='breakfast'),'Porridge - LG','A smooth, creamy Jamaican breakfast porridge made with fine cornmeal, warm spices, and a touch of sweetness. A comforting island favorite served hot.',10.89,null,'mild'::public.spice_level,5,'{}'::text[]
union all
  select 'sm-porridge',(select id from public.menu_categories where slug='breakfast'),'Sm Porridge','A smooth, creamy Jamaican breakfast porridge made with fine cornmeal, warm spices, and a touch of sweetness. A comforting island favorite served hot.',8.0,null,'mild'::public.spice_level,6,'{}'::text[]
union all
  select 'side-callaloo-salt-fish',(select id from public.menu_categories where slug='breakfast'),'Side - Callaloo & Salt Fish','Tender callaloo leaves sautéed with flaky saltfish, garlic, onions, and a hint of thyme—hearty, savory, and brimming with authentic island flavor.',7.0,null,'mild'::public.spice_level,7,'{}'::text[]
union all
  select 'large-soup',(select id from public.menu_categories where slug='soups'),'Large Soup','Simmered with tender chicken, green banana and white yam, hearty vegetables, and soft dumplings—comforting, flavorful, and packed with island goodness.',10.89,null,'mild'::public.spice_level,1,'{}'::text[]
union all
  select 'small-soup',(select id from public.menu_categories where slug='soups'),'Small Soup','Simmered with tender chicken, green banana and white yam, hearty vegetables, and soft dumplings—comforting, flavorful, and packed with island goodness.',8.0,null,'mild'::public.spice_level,2,'{}'::text[]
union all
  select 'bottled-drink',(select id from public.menu_categories where slug='drinks'),'Bottled Drink','Chilled and fizzy favorites straight from the U.S.—including Coke, Sprite, Gatorade, Snapple, and more. Classic, refreshing, and perfect with any meal.',3.2,null,'mild'::public.spice_level,1,array['drink-choice']::text[]
union all
  select 'd-g',(select id from public.menu_categories where slug='drinks'),'D&G','Bursting with bold Caribbean flavor, these classic Jamaican sodas—like Kola Champagne, Pineapple, and Ginger Beer—bring sweet, fizzy refreshment in every sip.',3.6,null,'medium'::public.spice_level,2,array['d-g-flavor-choice']::text[]
union all
  select 'grace-bottled-juice',(select id from public.menu_categories where slug='drinks'),'Grace Bottled Juice','Smooth, refreshing tropical juices—bursting with real fruit flavor in every sip. It''s pure island goodness in a bottle.',3.6,null,'mild'::public.spice_level,3,array['grace-flavor-choice']::text[]
union all
  select 'irish-moss',(select id from public.menu_categories where slug='drinks'),'Irish Moss','A thick, creamy Jamaican drink made with sea moss, milk, spices, and a touch of sweetness—smooth, energizing, and packed with traditional island goodness.',3.6,null,'mild'::public.spice_level,4,'{}'::text[]
union all
  select 'lemonade-16oz',(select id from public.menu_categories where slug='drinks'),'Lemonade 16oz','Refreshing, tangy, cool, crisp and perfectly balanced for a bright island-style thirst quencher.',2.6,null,'mild'::public.spice_level,5,'{}'::text[]
union all
  select 'mango-punch-16oz',(select id from public.menu_categories where slug='drinks'),'Mango Punch 16oz','Vibrant mango bliss—smooth, sweet, and bursting with sunny island flavor in every sip.',3.99,null,'mild'::public.spice_level,6,'{}'::text[]
union all
  select 'sorrel-16oz',(select id from public.menu_categories where slug='drinks'),'Sorrel 16oz','Bright, tangy hibiscus tea steeped with ginger, cinnamon, and cloves—refreshing, vividly colored, and bursting with festive island spice.',4.2,null,'medium'::public.spice_level,7,'{}'::text[]
union all
  select 'sorrel-gallon',(select id from public.menu_categories where slug='drinks'),'Sorrel Gallon','Bright, tangy hibiscus tea steeped with ginger, cinnamon, and cloves—refreshing, vividly colored, and bursting with festive island spice.',30.0,null,'medium'::public.spice_level,8,'{}'::text[]
union all
  select 'supligen',(select id from public.menu_categories where slug='drinks'),'Supligen','Creamy, nutrient-packed malt drink fortified with vitamins and minerals—rich, smooth, and energizing for a wholesome island-style boost.',3.6,null,'mild'::public.spice_level,9,array['supligen-flavor']::text[]
union all
  select 'ting',(select id from public.menu_categories where slug='drinks'),'Ting','Bright, bubbly, and bursting with real Jamaican grapefruit flavor—Ting is a crisp, tangy soda with just the right balance of sweet and citrusy zing. Refreshing and bold, it''s the island''s iconic drink in a bottle.',3.6,null,'mild'::public.spice_level,10,'{}'::text[]
union all
  select 'water',(select id from public.menu_categories where slug='drinks'),'Water','Cool Refreshing Poland Spring Water.',2.0,null,'mild'::public.spice_level,11,'{}'::text[]
union all
  select 'half-cheese',(select id from public.menu_categories where slug='desserts'),'1/2 Cheese','Rich, bold, and unmistakably Jamaican—this firm, flavorful cheddar-style cheese is perfect with hard dough bread or tucked into a warm patty.',16.5,null,'mild'::public.spice_level,1,'{}'::text[]
union all
  select '1-4-cheese',(select id from public.menu_categories where slug='desserts'),'1/4 Cheese','Rich, bold, and unmistakably Jamaican—this firm, flavorful cheddar-style cheese is perfect with hard dough bread or tucked into a warm patty.',10.5,null,'mild'::public.spice_level,2,'{}'::text[]
union all
  select 'bun-cheese',(select id from public.menu_categories where slug='desserts'),'Bun + Cheese','Spiced bun with raisins paired with a slice of cheddar cheese.',4.49,null,'mild'::public.spice_level,3,'{}'::text[]
union all
  select 'carrot-cake',(select id from public.menu_categories where slug='desserts'),'Carrot Cake','Moist and warmly spiced, this classic carrot cake is packed with fresh grated carrots and rich flavor in every bite—simple, sweet, and satisfying.',3.99,null,'mild'::public.spice_level,4,'{}'::text[]
union all
  select 'cheese-slice',(select id from public.menu_categories where slug='desserts'),'Cheese Slice','Rich, bold, and unmistakably Jamaican—this firm, flavorful cheddar-style cheese is perfect with hard dough bread or tucked into a warm patty.',2.49,null,'mild'::public.spice_level,5,'{}'::text[]
union all
  select 'rum-cake',(select id from public.menu_categories where slug='desserts'),'Rum Cake','Moist, buttery sponge soaked in rich Caribbean rum and finished with a glossy caramel glaze—decadent, boozy, and utterly irresistible.',4.29,null,'mild'::public.spice_level,6,'{}'::text[]
union all
  select '100-blue-mountain-coffee-4oz',(select id from public.menu_categories where slug='gift-shop'),'100% Blue Mountain Coffee 4oz','Enjoy a premium 4-oz pack of authentic Blue Mountain coffee — smooth, bold, and perfect for gifting or savoring at home.',14.99,null,'mild'::public.spice_level,1,'{}'::text[]
union all
  select 'cd',(select id from public.menu_categories where slug='gift-shop'),'CD','Founder, Owner, and Operator Phorein expresses his journey through the sweet sounds of reggae music.',10.0,null,'mild'::public.spice_level,2,'{}'::text[]
on conflict (slug) do update set
  category_id=excluded.category_id, name=excluded.name, description=excluded.description,
  base_price=excluded.base_price, spice_level=excluded.spice_level,
  sort_order=excluded.sort_order, modifier_groups=excluded.modifier_groups, available=true;
-- NOTE: image is NOT overwritten on conflict -- re-running this migration must never
-- clobber a photo that's since been uploaded through the admin.

-- Hide legacy starter items/categories not in the new menu (keep rows for order-history FKs).
update public.menu_items set available=false where slug not in ('half-lb-curried-chicken','half-lb-jerk-chicken','half-lb-stew-chicken','1-lb-curried-chicken','1-lb-jerk-chicken','1-lb-stew-chicken','boneless-curry-chicken-lg','boneless-curry-chicken-med','boneless-curry-chicken-sm','boneless-honey-bbq-chicken-lg','boneless-honey-bbq-chicken-med','boneless-honey-bbq-chicken-sm','boneless-stew-chicken-lg','boneless-stew-chicken-med','boneless-stew-chicken-sm','curry-chicken-lg','curry-chicken-med','curry-chicken-sm','fried-chicken-12-pieces','fried-chicken-3-pieces','fried-chicken-6-pieces','fried-chicken-lg','fried-chicken-med','fried-chicken-sm','jamaican-wings-lg','jamaican-wings-med','jamaican-wings-sm','jerk-chicken-lg','jerk-chicken-med','jerk-chicken-sm','stew-chicken-lg','stew-chicken-med','stew-chicken-sm','3-wings','wings-12-by-the-dozen','wings-6','half-lb-oxtail','1-lb-oxtail','oxtail-lg','oxtail-med','half-lb-curry-goat','1-lb-curry-goat','curry-goat-med','curry-goat-lg','half-lb-jerk-pork','1-lb-jerk-pork','jerk-pork-lg','jerk-pork-med','jerk-pork-sm','brown-stew-red-snapper-fish-three-quarter-1lbs','escovitch-red-snapper-fish-three-quarter-1-lb','steamed-red-snapper-fish-three-quarter-1lbs','brown-stew-shrimp-lg','brown-stew-shrimp-med','brown-stew-shrimp-sm','curried-shrimp-sm','curry-shrimp-lg','curry-shrimp-med','jerk-shrimp-lg','jerk-shrimp-med','jerk-shrimp-sm','sweet-chilli-fried-shrimp-lg','sweet-chilli-fried-shrimp-med','sweet-chilli-fried-shrimp-sm','half-lb-pepper-steak','1-lb-pepper-steak','pepper-steak-lg','pepper-steak-med','half-lb-curry-chickpeas','1-lb-curry-chickpeas','curried-chick-peas-lg','curried-chick-peas-med','curried-chick-peas-sm','rice-peas-cabbage-lg','rice-peas-cabbage-med','rice-peas-cabbage-sm','rice-peas-lg','rice-peas-med','rice-peas-sm','steamed-cabbage-sm','steamed-cabbage-lg','steamed-cabbage-med','sweet-sour-tofu-lg','sweet-sour-tofu-med','sweet-sour-tofu-sm','white-rice-cabbage-lg','white-rice-cabbage-med','white-rice-cabbage-sm','white-rice-lg','white-rice-med','white-rice-sm','beef-patty-mild','beef-patty-spicy','cheesy-beef-mild','cheesy-beef-spicy','chicken-patty','coco-bread','coco-bread-n-cheese','jerk-patty','spinach-patty-vegetarian','veggie-patty','coleslaw','cup-sauce','fries','jerk-chicken-mac-n-cheese','jk-jerk-sauce','sweet-plantains-3','sweet-plantains-6','crispy-chicken-sandwich','extra-cheese','fish-chips','fish-sandwich','jerk-chicken-sandwich','jerk-pork-sandwich','ackee-saltfish-med','callaloo-salt-fish-med','carrot-dumpling-3','festival-3','porridge-lg','sm-porridge','side-callaloo-salt-fish','large-soup','small-soup','bottled-drink','d-g','grace-bottled-juice','irish-moss','lemonade-16oz','mango-punch-16oz','sorrel-16oz','sorrel-gallon','supligen','ting','water','half-cheese','1-4-cheese','bun-cheese','carrot-cake','cheese-slice','rum-cake','100-blue-mountain-coffee-4oz','cd');
update public.menu_categories set active=false where slug not in ('chicken','oxtails','goat-curry','pork','seafood','steak','vegetarian-meals','patties','side-orders','sandwiches-wraps','breakfast','soups','drinks','desserts','gift-shop');
update public.menu_categories set active=true where slug in ('chicken','oxtails','goat-curry','pork','seafood','steak','vegetarian-meals','patties','side-orders','sandwiches-wraps','breakfast','soups','drinks','desserts','gift-shop');

commit;
-- #####################################################################
-- ###  0004_menu_photo_storage.sql
-- #####################################################################

-- 0004_menu_photo_storage.sql
-- Storage bucket for real menu-item photos, uploaded from the admin Menu page
-- (replaces guessed stock photos with actual product shots the owner takes).
-- Public read (storefront + admin both display them), staff-only write.
begin;

insert into storage.buckets (id, name, public)
values ('menu-photos', 'menu-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read menu photos" on storage.objects;
create policy "public read menu photos" on storage.objects
  for select using (bucket_id = 'menu-photos');

drop policy if exists "staff upload menu photos" on storage.objects;
create policy "staff upload menu photos" on storage.objects
  for insert with check (
    bucket_id = 'menu-photos'
    and (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'staff'))
  );

drop policy if exists "staff update menu photos" on storage.objects;
create policy "staff update menu photos" on storage.objects
  for update using (
    bucket_id = 'menu-photos'
    and (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'staff'))
  );

drop policy if exists "staff delete menu photos" on storage.objects;
create policy "staff delete menu photos" on storage.objects
  for delete using (
    bucket_id = 'menu-photos'
    and (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'staff'))
  );

commit;

-- #####################################################################
-- ###  OWNER LOGIN  (run AFTER the migrations above succeed)
-- #####################################################################
-- Auth users can't be created by plain SQL. Do this:
--   1. Supabase → Authentication → Users → "Add user" →
--        email: bconclubx@gmail.com  (set a password, tick auto-confirm)
--   2. Copy that new user's UUID.
--   3. Run the insert below with that UUID to grant the owner role:
--
-- insert into public.user_roles (user_id, role)
-- values ('<paste-auth-user-uuid-here>', 'owner')
-- on conflict (user_id, role) do nothing;
--
-- (A profile row is auto-created by the on_auth_user_created trigger.)
