-- ============================================================
-- Matonya — Tanzanian fashion e-commerce schema (Supabase / PostgreSQL)
-- Run this file in the Supabase SQL Editor first, then seed.sql.
--
-- Business data lives here (products, variants, orders, inventory).
-- Marketing content (homepage hero, blog, banners) is intended for
-- a headless CMS (Sanity) in a later phase — not in this database.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES (extends Supabase auth.users)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  -- Last delivery address, saved by place_order() so the next checkout
  -- can be prefilled. Guests are remembered in localStorage instead.
  default_region          text,
  default_city            text,
  default_address         text,
  default_delivery_notes  text,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent signed-in users from promoting themselves to admin.
-- Service-role / SQL-editor changes (auth.uid() is null) are allowed,
-- which is how the demo admin account is created in seed.sql.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not exists (
       select 1 from public.profiles
       where id = auth.uid() and role = 'admin'
     ) then
    raise exception 'Only an admin can change roles';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_role_escalation_trigger on public.profiles;
create trigger prevent_role_escalation_trigger
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- Admin check used by RLS policies (security definer avoids recursive RLS).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- 2. CATALOG
-- ------------------------------------------------------------
create table if not exists public.categories (
  id          bigint generated always as identity primary key,
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id                bigint generated always as identity primary key,
  name              text not null,
  slug              text not null unique,
  description       text,
  features          text[] not null default '{}',
  category_id       bigint references public.categories (id) on delete set null,
  base_price        numeric(12, 2) not null check (base_price >= 0), -- TZS
  compare_at_price  numeric(12, 2) check (compare_at_price is null or compare_at_price >= base_price),
  tags              text[] not null default '{}', -- 'new', 'bestseller', 'sale'
  rating            numeric(2, 1) not null default 0,
  review_count      integer not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

create table if not exists public.product_variants (
  id                   bigint generated always as identity primary key,
  product_id           bigint not null references public.products (id) on delete cascade,
  sku                  text not null unique,
  color                text not null,
  size                 text not null,
  price                numeric(12, 2) check (price is null or price >= 0), -- falls back to base_price
  stock_quantity       integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold  integer not null default 5,
  created_at           timestamptz not null default now(),
  unique (product_id, color, size)
);

create table if not exists public.product_images (
  id          bigint generated always as identity primary key,
  product_id  bigint not null references public.products (id) on delete cascade,
  image_url   text not null, -- Supabase Storage path or external URL
  position    integer not null default 0
);

create index if not exists product_variants_product_idx on public.product_variants (product_id);
create index if not exists product_images_product_idx on public.product_images (product_id);
create index if not exists products_category_idx on public.products (category_id);

-- ------------------------------------------------------------
-- 3. ORDERS
-- ------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1000;

create table if not exists public.orders (
  id              bigint generated always as identity primary key,
  order_number    text not null unique,
  user_id         uuid references public.profiles (id) on delete set null, -- null = guest checkout
  customer_name   text not null,
  phone           text not null,
  email           text,
  region          text not null,
  city            text not null,
  address         text not null,
  delivery_notes  text,
  status          text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method  text not null default 'cod'
                  check (payment_method in ('cod', 'mpesa', 'tigopesa', 'airtelmoney', 'card')),
  payment_status  text not null default 'unpaid'
                  check (payment_status in ('unpaid', 'pending', 'paid', 'refunded')),
  subtotal        numeric(12, 2) not null,
  delivery_fee    numeric(12, 2) not null default 0,
  total           numeric(12, 2) not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.order_items (
  id            bigint generated always as identity primary key,
  order_id      bigint not null references public.orders (id) on delete cascade,
  product_id    bigint references public.products (id) on delete set null,
  variant_id    bigint references public.product_variants (id) on delete set null,
  product_name  text not null,        -- snapshot at time of purchase
  variant_label text not null,        -- e.g. "Black / M"
  sku           text not null,
  quantity      integer not null check (quantity > 0),
  unit_price    numeric(12, 2) not null,
  line_total    numeric(12, 2) not null
);

create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists order_items_order_idx on public.order_items (order_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- 4. INVENTORY
-- ------------------------------------------------------------
-- Stock levels live on product_variants; every change is explained
-- by a row here (order sale, restock, manual adjustment, damage...).
create table if not exists public.inventory_movements (
  id          bigint generated always as identity primary key,
  variant_id  bigint not null references public.product_variants (id) on delete cascade,
  change      integer not null, -- signed: + restock / - sale etc.
  reason      text not null check (reason in ('order', 'restock', 'adjustment', 'damage', 'return')),
  note        text,
  order_id    bigint references public.orders (id) on delete set null,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists inventory_movements_variant_idx on public.inventory_movements (variant_id);

-- ------------------------------------------------------------
-- 5. FINANCE (basic business tracking — not full accounting)
-- ------------------------------------------------------------
create table if not exists public.expenses (
  id          bigint generated always as identity primary key,
  category    text not null check (category in ('Packaging', 'Delivery', 'Advertising', 'Supplier', 'Rent', 'Salaries', 'Other')),
  description text not null,
  amount      numeric(12, 2) not null check (amount > 0),
  incurred_on date not null default current_date,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Payment records. The demo uses COD / manual mobile-money confirmation.
-- The `provider` + `reference` columns are the seam where a real
-- gateway (e.g. a Tanzanian mobile-money aggregator) plugs in later.
create table if not exists public.payments (
  id          bigint generated always as identity primary key,
  order_id    bigint not null references public.orders (id) on delete cascade,
  provider    text not null default 'manual', -- 'manual' | 'mpesa' | 'tigopesa' | 'airtelmoney' | 'card' | gateway name
  amount      numeric(12, 2) not null,
  status      text not null default 'pending' check (status in ('pending', 'confirmed', 'failed', 'refunded')),
  reference   text, -- provider transaction reference once a gateway exists
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. SERVER-SIDE FUNCTIONS (called via supabase.rpc from React)
-- ------------------------------------------------------------

-- place_order: the entire checkout in one transaction.
-- Prices and stock are read from the database (never trusted from the
-- client). Validates stock, creates order + items, decrements stock,
-- logs an inventory movement per item, and records a payment.
create or replace function public.place_order(
  p_customer_name  text,
  p_phone          text,
  p_email          text,
  p_region         text,
  p_city           text,
  p_address        text,
  p_delivery_notes text,
  p_payment_method text,
  p_items          jsonb -- [{ "variant_id": 1, "quantity": 2 }]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id   bigint;
  v_number     text;
  v_item       jsonb;
  v_variant    record;
  v_qty        integer;
  v_subtotal   numeric(12, 2) := 0;
  v_delivery   numeric(12, 2);
  v_total      numeric(12, 2);
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  -- Pass 1: validate stock and compute subtotal from authoritative prices.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 then
      raise exception 'Invalid quantity';
    end if;

    select pv.id, pv.sku, pv.stock_quantity,
           coalesce(pv.price, p.base_price) as unit_price
      into v_variant
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
     where pv.id = (v_item ->> 'variant_id')::bigint
       and p.is_active
     for update of pv;

    if not found then
      raise exception 'Product variant not found: %', v_item ->> 'variant_id';
    end if;
    if v_variant.stock_quantity < v_qty then
      raise exception 'Not enough stock for SKU % (only % left)', v_variant.sku, v_variant.stock_quantity;
    end if;

    v_subtotal := v_subtotal + v_variant.unit_price * v_qty;
  end loop;

  -- Delivery fee rules (Tanzania): free over TZS 150,000;
  -- TZS 5,000 in Dar es Salaam; TZS 10,000 upcountry / Zanzibar.
  v_delivery := case
    when v_subtotal >= 150000 then 0
    when p_region = 'Dar es Salaam' then 5000
    else 10000
  end;
  v_total := v_subtotal + v_delivery;

  v_number := 'MT-' || lpad(nextval('public.order_number_seq')::text, 5, '0');

  insert into public.orders (
    order_number, user_id, customer_name, phone, email,
    region, city, address, delivery_notes,
    payment_method, payment_status, subtotal, delivery_fee, total
  ) values (
    v_number, auth.uid(), p_customer_name, p_phone, nullif(p_email, ''),
    p_region, p_city, p_address, nullif(p_delivery_notes, ''),
    p_payment_method,
    case when p_payment_method = 'cod' then 'unpaid' else 'pending' end,
    v_subtotal, v_delivery, v_total
  )
  returning id into v_order_id;

  -- Remember the delivery details for signed-in customers so their next
  -- checkout comes prefilled (runs in the same transaction as the order).
  if auth.uid() is not null then
    update public.profiles
       set default_region         = p_region,
           default_city           = p_city,
           default_address        = p_address,
           default_delivery_notes = nullif(p_delivery_notes, '')
     where id = auth.uid();
  end if;

  -- Pass 2: order items + stock decrement + movement history.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;

    select pv.id, pv.sku, pv.color, pv.size, pv.product_id,
           p.name as product_name,
           coalesce(pv.price, p.base_price) as unit_price
      into v_variant
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
     where pv.id = (v_item ->> 'variant_id')::bigint;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name,
      variant_label, sku, quantity, unit_price, line_total
    ) values (
      v_order_id, v_variant.product_id, v_variant.id, v_variant.product_name,
      v_variant.color || ' / ' || v_variant.size, v_variant.sku,
      v_qty, v_variant.unit_price, v_variant.unit_price * v_qty
    );

    update public.product_variants
       set stock_quantity = stock_quantity - v_qty
     where id = v_variant.id;

    insert into public.inventory_movements (variant_id, change, reason, order_id, created_by)
    values (v_variant.id, -v_qty, 'order', v_order_id, auth.uid());
  end loop;

  insert into public.payments (order_id, provider, amount, status)
  values (v_order_id, p_payment_method, v_total, 'pending');

  return jsonb_build_object(
    'order_id',     v_order_id,
    'order_number', v_number,
    'subtotal',     v_subtotal,
    'delivery_fee', v_delivery,
    'total',        v_total
  );
end;
$$;

-- adjust_inventory: admin stock corrections (restock, damage, count fix).
-- Transactional: updates the variant and records the movement together.
create or replace function public.adjust_inventory(
  p_variant_id bigint,
  p_change     integer,
  p_reason     text,
  p_note       text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can adjust inventory';
  end if;
  if p_change = 0 then
    raise exception 'Change cannot be zero';
  end if;

  update public.product_variants
     set stock_quantity = stock_quantity + p_change
   where id = p_variant_id;

  if not found then
    raise exception 'Variant not found';
  end if;

  insert into public.inventory_movements (variant_id, change, reason, note, created_by)
  values (p_variant_id, p_change, p_reason, nullif(p_note, ''), auth.uid());
end;
$$;

grant execute on function public.place_order(text, text, text, text, text, text, text, text, jsonb)
  to anon, authenticated;
grant execute on function public.adjust_inventory(bigint, integer, text, text)
  to authenticated;

-- ------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- The database enforces permissions — never rely on hiding
-- buttons in React alone.
-- ------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_variants     enable row level security;
alter table public.product_images       enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.inventory_movements  enable row level security;
alter table public.expenses             enable row level security;
alter table public.payments             enable row level security;

-- profiles: users see/edit themselves; admins see everything.
drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- catalog: public can browse the storefront; only admins manage it.
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories
  for select using (true);
drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products public read active" on public.products;
create policy "products public read active" on public.products
  for select using (is_active or public.is_admin());
drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "variants public read" on public.product_variants;
create policy "variants public read" on public.product_variants
  for select using (true);
drop policy if exists "variants admin write" on public.product_variants;
create policy "variants admin write" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "images public read" on public.product_images;
create policy "images public read" on public.product_images
  for select using (true);
drop policy if exists "images admin write" on public.product_images;
create policy "images admin write" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- orders: customers read their own; admins read/update all.
-- No direct insert policy — orders are created only through place_order().
drop policy if exists "orders select own or admin" on public.orders;
create policy "orders select own or admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "orders admin delete" on public.orders;
create policy "orders admin delete" on public.orders
  for delete using (public.is_admin());

drop policy if exists "order items select own or admin" on public.order_items;
create policy "order items select own or admin" on public.order_items
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- inventory history & finance: admin only.
drop policy if exists "movements admin all" on public.inventory_movements;
create policy "movements admin all" on public.inventory_movements
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "expenses admin all" on public.expenses;
create policy "expenses admin all" on public.expenses
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "payments admin all" on public.payments;
create policy "payments admin all" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "payments select own order" on public.payments;
create policy "payments select own order" on public.payments
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- SETUP CHECKLIST (after running this file):
--   1. Run supabase/seed.sql to load the demo catalog, users and orders.
--   2. Demo logins (created by the seed):
--        admin@matonya.co.tz / Matonya2026!   (admin)
--        demo@matonya.co.tz  / Matonya2026!   (customer)
--   3. Product images: seed data uses external URLs so the demo
--      works immediately. For production, upload images to a
--      public Supabase Storage bucket (e.g. "product-images")
--      and store the public URLs in product_images.image_url.
-- ============================================================
