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

  insert into public.orders (
    channel, location_id, customer_id, customer_name, customer_phone, customer_email,
    subtotal, tax, tip, fees, total, status, type, notes, address
  ) values (
    'web', v_location_id, v_customer_id,
    p_customer->>'name', p_customer->>'phone', p_customer->>'email',
    coalesce(p_subtotal,0), coalesce(p_tax,0), coalesce(p_tip,0), coalesce(p_fees,0),
    v_total, 'new', coalesce(p_type,'pickup')::public.order_type, p_notes, p_address
  ) returning id, short_id into v_order_id, v_short_id;

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
