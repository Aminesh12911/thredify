-- THREADIFY database schema (Supabase / PostgreSQL)
-- Run in the Supabase SQL editor. All data is fictional demo data.

create extension if not exists "pgcrypto";

-- Profiles extend auth.users (passwords are handled by Supabase Auth, never stored here)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  price_inr integer not null check (price_inr >= 0),
  category_id uuid references public.categories(id) on delete set null,
  style text not null,
  slogan text,
  colors jsonb not null default '[]',
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null check (size in ('S','M','L','XL','XXL')),
  stock integer not null default 0 check (stock >= 0),
  unique (product_id, size)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  line1 text not null,
  city text not null,
  state text not null,
  pin_code text not null check (pin_code ~ '^[1-9][0-9]{5}$'),
  is_default boolean not null default false
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  email text not null,
  phone text not null,
  ship_line1 text not null,
  ship_city text not null,
  ship_state text not null,
  ship_pin text not null,
  subtotal_inr integer not null,
  shipping_inr integer not null,
  discount_inr integer not null default 0,
  total_inr integer not null,
  coupon_code text,
  status text not null default 'placed'
    check (status in ('placed','processing','printing','shipped','delivered','cancelled')),
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  size text not null,
  color_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_inr integer not null
);

create table public.customizations (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  fit text not null,
  tshirt_color text not null,
  layers jsonb not null default '[]'
);

-- Test metadata only. Never store card numbers, CVV or credentials.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'sandbox-simulator',
  status text not null check (status in ('succeeded','failed')),
  test_reference text not null,
  method text not null default 'Sandbox',
  created_at timestamptz not null default now()
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  kind text not null default 'contact' check (kind in ('contact','custom_design')),
  status text not null default 'new' check (status in ('new','in_progress','closed')),
  created_at timestamptz not null default now()
);

-- Helper: is the current user an admin?
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Auto-create profile on signup (role is ALWAYS 'customer'; promote admins manually)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email) values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row level security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.customizations enable row level security;
alter table public.payments enable row level security;
alter table public.enquiries enable row level security;

create policy "catalogue readable" on public.categories for select using (true);
create policy "products readable" on public.products for select using (true);
create policy "inventory readable" on public.inventory for select using (true);
create policy "admin manages categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages inventory" on public.inventory for all using (public.is_admin()) with check (public.is_admin());

-- Users may read/update their own profile but cannot change their own role
create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "own profile update" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "own addresses" on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own orders read" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "admin updates orders" on public.orders for update using (public.is_admin());
create policy "own order items read" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "own customizations read" on public.customizations for select
  using (exists (select 1 from public.order_items i join public.orders o on o.id = i.order_id
                 where i.id = order_item_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "own payments read" on public.payments for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

-- Anyone may submit an enquiry; only admins read them
create policy "submit enquiry" on public.enquiries for insert with check (true);
create policy "admin reads enquiries" on public.enquiries for select using (public.is_admin());
create policy "admin updates enquiries" on public.enquiries for update using (public.is_admin());

-- Order creation and guest tracking go through server routes using the
-- service-role key, so no public insert policy exists on orders.

create index on public.orders (user_id);
create index on public.order_items (order_id);
create index on public.inventory (product_id);

-- ---------------------------------------------------------------------------
-- Atomic order creation. Called ONLY by the server (service_role) after the
-- request has been validated and re-priced. Anon/authenticated users cannot call it.
-- ---------------------------------------------------------------------------
create or replace function public.create_order(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_item_id uuid;
begin
  insert into public.orders (
    order_code, user_id, customer_name, email, phone,
    ship_line1, ship_city, ship_state, ship_pin,
    subtotal_inr, shipping_inr, discount_inr, total_inr, coupon_code
  ) values (
    p->>'order_code', nullif(p->>'user_id', '')::uuid, p->>'customer_name', p->>'email', p->>'phone',
    p->>'ship_line1', p->>'ship_city', p->>'ship_state', p->>'ship_pin',
    (p->>'subtotal_inr')::int, (p->>'shipping_inr')::int, (p->>'discount_inr')::int, (p->>'total_inr')::int,
    nullif(p->>'coupon_code', '')
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p->'items') loop
    -- Catalogue items consume stock. The conditional UPDATE takes a row lock, so two buyers
    -- can never both take the last unit; a shortfall aborts (and rolls back) the whole order.
    -- Custom designs (product_id null) are made to order and are not stock-tracked.
    if nullif(v_item->>'product_id', '') is not null then
      update public.inventory
         set stock = stock - (v_item->>'quantity')::int
       where product_id = (v_item->>'product_id')::uuid
         and size = v_item->>'size'
         and stock >= (v_item->>'quantity')::int;
      if not found then
        raise exception 'insufficient_stock' using errcode = 'TH001',
          detail = (v_item->>'name') || ' (' || (v_item->>'size') || ')';
      end if;
    end if;

    insert into public.order_items (order_id, product_id, name, size, color_name, quantity, unit_price_inr)
    values (
      v_order_id, nullif(v_item->>'product_id', '')::uuid, v_item->>'name', v_item->>'size',
      v_item->>'color_name', (v_item->>'quantity')::int, (v_item->>'unit_price_inr')::int
    ) returning id into v_item_id;

    if jsonb_typeof(v_item->'customization') = 'object' then
      insert into public.customizations (order_item_id, fit, tshirt_color, layers)
      values (v_item_id, v_item->'customization'->>'fit', v_item->'customization'->>'tshirt_color',
              coalesce(v_item->'customization'->'layers', '[]'::jsonb));
    end if;
  end loop;

  insert into public.payments (order_id, provider, status, test_reference, method)
  values (v_order_id, 'sandbox-simulator', 'succeeded', p->>'payment_reference', coalesce(p->>'payment_method', 'Sandbox'));

  return p->>'order_code';
end;
$$;

revoke all on function public.create_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to service_role;
