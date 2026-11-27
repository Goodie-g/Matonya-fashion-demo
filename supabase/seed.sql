-- ============================================================
-- Matonya — demo seed data (run AFTER schema.sql)
--
-- Loads a complete demo store:
--   • 8 categories and 20 Tanzanian fashion products
--   • a full color × size variant matrix with SKUs and stock
--   • 7 demo accounts (1 admin, 1 demo customer, 5 shoppers)
--   • 16 orders across every status, with payments and stock history
--   • expenses and inventory movements for the admin dashboard
--
-- Demo logins:
--   admin@matonya.co.tz / Matonya2026!   (admin)
--   demo@matonya.co.tz  / Matonya2026!   (customer)
--
-- The script is safe to run once. If products already exist it
-- skips everything, so it can also be pasted again harmlessly.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- Helper: creates a product, its images, and one variant per
-- color × size combination. SKU: PREFIX-COLORCODE-SIZE.
create or replace function public.seed_product(
  p_name        text,
  p_slug        text,
  p_category    text,      -- category slug
  p_base_price  numeric,   -- TZS
  p_compare_at  numeric,
  p_tags        text[],
  p_colors      text[],
  p_sizes       text[],
  p_images      text[],
  p_description text,
  p_features    text[],
  p_sku_prefix  text,
  p_stock       integer default 45,
  p_days_old    integer default 45
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id bigint;
  v_color      text;
  v_size       text;
  v_i          integer := 0;
  v_url        text;
  v_stock      integer;
begin
  select id into v_product_id from public.products where slug = p_slug;
  if v_product_id is not null then
    return v_product_id;
  end if;

  insert into public.products (
    name, slug, description, features, category_id,
    base_price, compare_at_price, tags,
    rating, review_count, is_active, created_at
  ) values (
    p_name, p_slug, p_description, p_features,
    (select id from public.categories where slug = p_category),
    p_base_price, p_compare_at, p_tags,
    round((40 + abs(hashtext(p_slug) % 10))::numeric / 10, 1), -- 4.0–4.9
    80 + abs(hashtext(p_slug) % 900),
    true,
    now() - (p_days_old || ' days')::interval
  )
  returning id into v_product_id;

  foreach v_url in array p_images loop
    insert into public.product_images (product_id, image_url, position)
    values (v_product_id, v_url, v_i);
    v_i := v_i + 1;
  end loop;

  foreach v_color in array p_colors loop
    foreach v_size in array p_sizes loop
      -- Deterministic but varied stock per variant.
      v_stock := p_stock + abs(hashtext(v_color || v_size || p_slug) % 10);
      insert into public.product_variants (
        product_id, sku, color, size, stock_quantity, low_stock_threshold
      ) values (
        v_product_id,
        p_sku_prefix || '-' ||
          upper(regexp_replace(substr(v_color, 1, 3), '[^A-Za-z]', '', 'g')) || '-' ||
          upper(regexp_replace(v_size, '[^A-Za-z0-9]', '', 'g')),
        v_color, v_size, v_stock, 5
      );
    end loop;
  end loop;

  return v_product_id;
end;
$$;

-- Helper: creates (or repairs) a demo auth user and its profile.
create or replace function public.seed_demo_user(
  p_id        uuid,
  p_email     text,
  p_password  text,
  p_full_name text,
  p_phone     text,
  p_role      text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if not exists (select 1 from auth.users where id = p_id) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, phone, phone_confirmed_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      p_id, 'authenticated', 'authenticated', p_email,
      extensions.crypt(p_password, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', p_full_name, 'phone', p_phone),
      now(), now(), p_phone, now(),
      '', '', '', ''
    );
  end if;

  if not exists (
    select 1 from auth.identities
    where provider_id = p_id::text and provider = 'email'
  ) then
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), p_id, p_id::text,
      jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
      'email', now(), now(), now()
    );
  end if;

  insert into public.profiles (id, full_name, email, phone, role)
  values (p_id, p_full_name, p_email, p_phone, p_role)
  on conflict (id) do update set
    full_name = excluded.full_name,
    email     = excluded.email,
    phone     = excluded.phone,
    role      = excluded.role;

  return p_id;
end;
$$;

-- Helper: records a stock change and keeps the variant in sync.
create or replace function public.seed_stock_movement(
  p_sku        text,
  p_change     integer,
  p_reason     text,
  p_note       text,
  p_created_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_variant record;
begin
  select id, stock_quantity into v_variant
  from public.product_variants where sku = p_sku;

  if not found then
    raise exception 'Seed variant not found: %', p_sku;
  end if;
  if v_variant.stock_quantity + p_change < 0 then
    raise exception 'Seed movement would make % negative', p_sku;
  end if;

  update public.product_variants
     set stock_quantity = stock_quantity + p_change
   where id = v_variant.id;

  insert into public.inventory_movements (variant_id, change, reason, note, created_at)
  values (v_variant.id, p_change, p_reason, p_note, p_created_at);
end;
$$;

-- Helper: sets a variant to a specific stock level and records the delta.
create or replace function public.seed_set_stock(
  p_sku    text,
  p_target integer,
  p_note   text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_variant record;
  v_delta   integer;
begin
  select id, stock_quantity into v_variant
  from public.product_variants where sku = p_sku;

  if not found then
    raise exception 'Seed variant not found: %', p_sku;
  end if;

  v_delta := p_target - v_variant.stock_quantity;
  if v_delta = 0 then
    return;
  end if;

  update public.product_variants
     set stock_quantity = p_target
   where id = v_variant.id;

  insert into public.inventory_movements (variant_id, change, reason, note, created_at)
  values (v_variant.id, v_delta, 'adjustment', p_note, now());
end;
$$;

-- Helper: inserts a complete demo order with items, payment and
-- (optionally) stock deduction + inventory movement history.
create or replace function public.seed_demo_order(
  p_user_id        uuid,
  p_customer_name  text,
  p_phone          text,
  p_email          text,
  p_region         text,
  p_city           text,
  p_address        text,
  p_status         text,
  p_payment_method text,
  p_payment_status text,
  p_created_at     timestamptz,
  p_items          jsonb,
  p_affects_stock  boolean default true
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id bigint;
  v_number   text;
  v_item     jsonb;
  v_variant  record;
  v_qty      integer;
  v_subtotal numeric(12, 2) := 0;
  v_delivery numeric(12, 2);
  v_total    numeric(12, 2);
begin
  -- Validate items and compute the subtotal from database prices.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;

    select pv.id, pv.sku, pv.color, pv.size, pv.stock_quantity, pv.product_id,
           p.name as product_name,
           coalesce(pv.price, p.base_price) as unit_price
      into v_variant
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
     where p.slug = v_item ->> 'slug'
       and pv.color = v_item ->> 'color'
       and pv.size = v_item ->> 'size';

    if not found then
      raise exception 'Seed item not found: % / % / %',
        v_item ->> 'slug', v_item ->> 'color', v_item ->> 'size';
    end if;
    if p_affects_stock and v_variant.stock_quantity < v_qty then
      raise exception 'Not enough seed stock for %', v_variant.sku;
    end if;

    v_subtotal := v_subtotal + v_variant.unit_price * v_qty;
  end loop;

  v_delivery := case
    when v_subtotal >= 150000 then 0
    when p_region = 'Dar es Salaam' then 5000
    else 10000
  end;
  v_total := v_subtotal + v_delivery;
  v_number := 'MT-' || lpad(nextval('public.order_number_seq')::text, 5, '0');

  insert into public.orders (
    order_number, user_id, customer_name, phone, email,
    region, city, address, status, payment_method, payment_status,
    subtotal, delivery_fee, total, created_at, updated_at
  ) values (
    v_number, p_user_id, p_customer_name, p_phone, nullif(p_email, ''),
    p_region, p_city, p_address, p_status, p_payment_method, p_payment_status,
    v_subtotal, v_delivery, v_total, p_created_at, p_created_at
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;

    select pv.id, pv.sku, pv.color, pv.size, pv.product_id,
           p.name as product_name,
           coalesce(pv.price, p.base_price) as unit_price
      into v_variant
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
     where p.slug = v_item ->> 'slug'
       and pv.color = v_item ->> 'color'
       and pv.size = v_item ->> 'size';

    insert into public.order_items (
      order_id, product_id, variant_id, product_name,
      variant_label, sku, quantity, unit_price, line_total
    ) values (
      v_order_id, v_variant.product_id, v_variant.id, v_variant.product_name,
      v_variant.color || ' / ' || v_variant.size, v_variant.sku,
      v_qty, v_variant.unit_price, v_variant.unit_price * v_qty
    );

    if p_affects_stock then
      update public.product_variants
         set stock_quantity = stock_quantity - v_qty
       where id = v_variant.id;

      insert into public.inventory_movements (
        variant_id, change, reason, order_id, note, created_at
      ) values (
        v_variant.id, -v_qty, 'order', v_order_id,
        'Order ' || v_number, p_created_at
      );
    end if;
  end loop;

  insert into public.payments (
    order_id, provider, amount, status, reference, created_at
  ) values (
    v_order_id, p_payment_method, v_total,
    case p_payment_status
      when 'paid' then 'confirmed'
      when 'refunded' then 'refunded'
      else 'pending'
    end,
    case when p_payment_status in ('paid', 'refunded')
      then 'DEMO-' || v_number else null end,
    p_created_at
  );

  return v_order_id;
end;
$$;

-- ------------------------------------------------------------
-- Main seed routine
-- ------------------------------------------------------------
create or replace function public.seed_demo()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin   uuid := '00000000-0000-4000-8000-000000000001';
  v_demo    uuid := '00000000-0000-4000-8000-000000000002';
  v_amina   uuid := '00000000-0000-4000-8000-000000000003';
  v_joseph  uuid := '00000000-0000-4000-8000-000000000004';
  v_neema   uuid := '00000000-0000-4000-8000-000000000005';
  v_zawadi  uuid := '00000000-0000-4000-8000-000000000006';
  v_baraka  uuid := '00000000-0000-4000-8000-000000000007';
  v_password text := 'Matonya2026!';
begin
  if exists (select 1 from public.products limit 1) then
    raise notice 'Matonya demo seed skipped: products already exist.';
    return;
  end if;

  -- ----------------------------------------------------------
  -- Categories
  -- ----------------------------------------------------------
  insert into public.categories (name, slug) values
    ('T-Shirts',    'tshirts'),
    ('Shirts',      'shirts'),
    ('Kitenge',     'kitenge'),
    ('Trousers',    'trousers'),
    ('Shorts',      'shorts'),
    ('Outerwear',   'outerwear'),
    ('Footwear',    'footwear'),
    ('Bags',        'bags'),
    ('Accessories', 'accessories')
  on conflict (slug) do nothing;

  -- ----------------------------------------------------------
  -- Products
  -- ----------------------------------------------------------
  perform public.seed_product(
    'Premium Cotton T-Shirt', 'premium-cotton-tshirt', 'tshirts',
    28000, 38000, array['bestseller', 'sale'],
    array['White', 'Black', 'Olive'], array['S', 'M', 'L', 'XL', '2XL'],
    array[
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80'
    ],
    'Heavyweight 220gsm combed cotton, pre-shrunk and cut for the Dar es Salaam heat. The everyday tee done properly.',
    array[
      '100% combed cotton, 220gsm',
      'Pre-shrunk — holds its fit wash after wash',
      'Ribbed collar with reinforced stitching',
      'Cut and sewn in Dar es Salaam'
    ],
    'MT-TEE', 50, 55
  );

  perform public.seed_product(
    'Kitenge Print Shirt', 'kitenge-print-shirt', 'kitenge',
    65000, null, array['new', 'bestseller'],
    array['Safari Red', 'Ocean Blue', 'Forest Green'], array['S', 'M', 'L', 'XL', '2XL'],
    array[
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80'
    ],
    'Genuine kitenge fabric tailored into a sharp short-sleeve shirt. Bold Tanzanian prints with a modern, tailored cut.',
    array[
      'Authentic Tanzanian kitenge cotton',
      'Tailored fit with camp collar',
      'Coconut-shell buttons',
      'Each print is a limited run'
    ],
    'MT-KIT', 42, 3
  );

  perform public.seed_product(
    'Linen Safari Shirt', 'linen-safari-shirt', 'shirts',
    58000, null, array['new'],
    array['Sand', 'White', 'Olive'], array['S', 'M', 'L', 'XL', '2XL'],
    array[
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80'
    ],
    'Breathable European linen in a relaxed safari silhouette. Built for coastal humidity and upcountry sun alike.',
    array[
      '100% European flax linen',
      'Garment-washed for softness from day one',
      'Two chest pockets with button flaps',
      'Relaxed fit — size down for a tailored look'
    ],
    'MT-SAF', 48, 5
  );

  perform public.seed_product(
    'Slim Chino Trousers', 'slim-chino-trousers', 'trousers',
    45000, 55000, array['sale'],
    array['Khaki', 'Navy', 'Black'], array['30', '32', '34', '36', '38'],
    array[
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80'
    ],
    'A clean slim chino in stretch twill. Office-ready in Dodoma, weekend-ready in Arusha.',
    array[
      '97% cotton, 3% elastane twill',
      'Slim fit with tapered leg',
      'YKK zip fly with button closure',
      'Machine washable'
    ],
    'MT-CHI', 46, 40
  );

  perform public.seed_product(
    'Denim Trucker Jacket', 'denim-trucker-jacket', 'outerwear',
    85000, null, array['bestseller'],
    array['Indigo', 'Black'], array['S', 'M', 'L', 'XL', '2XL'],
    array[
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=80',
      'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=800&q=80'
    ],
    'A 12oz rigid denim trucker that breaks in beautifully. The layer for cool Njombe evenings and early-morning daladala rides.',
    array[
      '12oz rigid cotton denim',
      'Classic trucker fit with button front',
      'Two chest pockets, two welt pockets',
      'Gets better with every wear'
    ],
    'MT-DEN', 38, 50
  );

  perform public.seed_product(
    'Lightweight Hoodie', 'lightweight-hoodie', 'outerwear',
    60000, null, array['new'],
    array['Charcoal', 'Navy'], array['S', 'M', 'L', 'XL', '2XL'],
    array[
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
      'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=800&q=80'
    ],
    'French terry hoodie in a mid-weight knit — warm enough for Kilimanjaro mornings, light enough for the coast.',
    array[
      '80% cotton, 20% recycled polyester',
      'French terry loopback interior',
      'Double-lined hood with drawcord',
      'Kangaroo pocket'
    ],
    'MT-HOD', 44, 8
  );

  perform public.seed_product(
    'Maasai Shuka Throw', 'maasai-shuka-throw', 'accessories',
    35000, null, array['bestseller'],
    array['Red Check', 'Blue Check'], array['One Size'],
    array[
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6f/Rubega_%28_a_maasai_cloth%29.jpg/960px-Rubega_%28_a_maasai_cloth%29.jpg',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Masaai_blankets_at_the_Maasai_market._Nairobi_Kenya.jpg/960px-Masaai_blankets_at_the_Maasai_market._Nairobi_Kenya.jpg'
    ],
    'The iconic Maasai shuka, woven soft and sized as a home throw or travel wrap. A piece of Tanzania, wherever you are.',
    array[
      'Traditional Maasai check weave',
      'Soft brushed acrylic-cotton blend',
      '180cm × 130cm',
      'Hand wash cold'
    ],
    'MT-SHU', 40, 35
  );

  perform public.seed_product(
    'Kanga Beach Wrap', 'kanga-beach-wrap', 'kitenge',
    18000, 25000, array['sale'],
    array['Coral', 'Turquoise', 'Sunset'], array['One Size'],
    array[
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/88/Kanga_leso_Kenya_01.jpg/960px-Kanga_leso_Kenya_01.jpg',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/A_woman_carries_objects_on_the_beaches_of_Zanzibar.jpg/960px-A_woman_carries_objects_on_the_beaches_of_Zanzibar.jpg'
    ],
    'Classic Zanzibar kanga with a printed jina message. Beach wrap, head scarf, picnic cloth — the most versatile thing you own.',
    array[
      '100% lightweight cotton',
      'Traditional printed border and jina',
      '160cm × 110cm',
      'Softens with every wash'
    ],
    'MT-KAN', 52, 30
  );

  perform public.seed_product(
    'Leather Sandals', 'leather-sandals', 'footwear',
    42000, null, array['new', 'bestseller'],
    array['Tan', 'Dark Brown'], array['40', '41', '42', '43', '44', '45'],
    array[
      'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&q=80'
    ],
    'Hand-stitched full-grain leather sandals from a Mwanza workshop. Moulds to your foot within a week.',
    array[
      'Full-grain Tanzanian leather',
      'Hand-stitched sole',
      'Cushioned leather footbed',
      'Made to order in Mwanza'
    ],
    'MT-SND', 30, 12
  );

  perform public.seed_product(
    'Merino Knit Polo', 'merino-knit-polo', 'shirts',
    52000, 68000, array['bestseller', 'sale'],
    array['White', 'Navy', 'Forest'], array['S', 'M', 'L', 'XL', '2XL'],
    array[
      'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80',
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80'
    ],
    'A knitted polo that dresses up or down — sharp enough for the office, relaxed enough for a Saturday at Coco Beach.',
    array[
      'Fine-gauge cotton-merino knit',
      'Three-button placket',
      'Ribbed collar and cuffs',
      'Machine washable cold'
    ],
    'MT-POL', 45, 25
  );

  perform public.seed_product(
    'Kikoi Throw', 'kikoi-throw', 'kitenge',
    32000, null, array['new'],
    array['Sand', 'Navy', 'Rust', 'Ocean'],
    array['130 x 180 cm', '150 x 200 cm'],
    array[
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Colorful_Kikoi_Shukas.jpg/960px-Colorful_Kikoi_Shukas.jpg',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/KIKOI_AND_WRAP.JPG/960px-KIKOI_AND_WRAP.JPG'
    ],
    'Handwoven kikoi cloth from the East African coast, finished with a hand-knotted fringe. A throw for the sofa, a wrap for the beach, a blanket for Sunday afternoons.',
    array[
      'Handwoven cotton kikoi',
      'Hand-knotted fringe',
      '130 x 180 cm or 150 x 200 cm',
      'Machine wash cold, line dry'
    ],
    'MT-KIK', 38, 6
  );

  perform public.seed_product(
    'Canvas Weekender Bag', 'canvas-weekender-bag', 'bags',
    78000, 95000, array['bestseller'],
    array['Olive', 'Black'], array['One Size'],
    array[
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80'
    ],
    'A 40-litre waxed-canvas weekender with leather handles and a separate shoe pocket. Dar to Zanzibar in one bag.',
    array[
      '18oz waxed cotton canvas',
      'Full-grain leather handles',
      'Separate ventilated shoe pocket',
      'Fits cabin baggage'
    ],
    'MT-BAG', 25, 20
  );

  perform public.seed_product(
    'Woven Leather Belt', 'woven-leather-belt', 'accessories',
    26000, null, array['new'],
    array['Tan', 'Dark Brown'], array['S', 'M', 'L'],
    array[
      'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800&q=80'
    ],
    'A hand-woven full-grain leather belt, made to soften and darken with wear. Finished with a solid brass buckle.',
    array[
      'Full-grain Tanzanian leather',
      'Hand-woven braid',
      'Solid brass buckle',
      'Cut to length in the workshop'
    ],
    'MT-BEL', 40, 18
  );

  perform public.seed_product(
    'Dashiki Print Shirt', 'dashiki-print-shirt', 'kitenge',
    62000, 75000, array['new', 'sale'],
    array['Midnight', 'Sunset'], array['S', 'M', 'L', 'XL', '2XL'],
    array[
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80'
    ],
    'A modern dashiki cut from printed cotton. Statement enough for a wedding, easy enough for a Sunday.',
    array[
      'Printed cotton dashiki cloth',
      'Relaxed fit with split hem',
      'Embroidered neckline',
      'Limited print run'
    ],
    'MT-DAS', 36, 4
  );

  perform public.seed_product(
    'Linen Wide-Leg Trousers', 'linen-wide-leg-trousers', 'trousers',
    55000, null, array['new'],
    array['Sand', 'White'], array['30', '32', '34', '36', '38'],
    array[
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80'
    ],
    'Relaxed wide-leg trousers in washed linen. The coolest thing you can wear to a Dar lunch in November.',
    array[
      '100% washed linen',
      'High-rise wide leg',
      'Side pockets and back welt pocket',
      'Elasticated back waist'
    ],
    'MT-WID', 34, 9
  );

  perform public.seed_product(
    'Beaded Maasai Cuff', 'beaded-maasai-cuff', 'accessories',
    15000, null, array['bestseller'],
    array['Red', 'Blue'], array['One Size'],
    array[
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/37/Bracelet_11-o.lau-F180.LA1029.jpg/960px-Bracelet_11-o.lau-F180.LA1029.jpg'
    ],
    'A hand-beaded glass cuff, made by Maasai artisans in small batches. Wide enough to be noticed, light enough to forget you have it on.',
    array[
      'Hand-beaded glass beads',
      'Wide 6 cm cuff',
      'Leather-lined interior',
      'Fair-trade artisan made'
    ],
    'MT-BRA', 60, 32
  );

  perform public.seed_product(
    'Cotton Kaftan', 'cotton-kaftan', 'shirts',
    48000, null, array['new'],
    array['White', 'Sand'], array['S', 'M', 'L', 'XL'],
    array[
      'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800&q=80',
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80'
    ],
    'A breezy cotton kaftan with hand-finished embroidery. Throw it on after a swim or wear it out to dinner.',
    array[
      'Lightweight cotton voile',
      'Hand-finished neckline embroidery',
      'Relaxed one-size-friendly cut',
      'Machine wash cold'
    ],
    'MT-KAF', 42, 7
  );

  perform public.seed_product(
    'Suede Chelsea Boots', 'suede-chelsea-boots', 'footwear',
    120000, 145000, array['bestseller', 'sale'],
    array['Tan', 'Dark Brown'], array['40', '41', '42', '43', '44', '45'],
    array[
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80',
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=80'
    ],
    'Hand-finished suede Chelsea boots on a leather sole. Smart enough for the office, tough enough for Kariakoo.',
    array[
      'Italian suede upper',
      'Leather lining and sole',
      'Elastic side gussets',
      'Goodyear-welted construction'
    ],
    'MT-BOO', 22, 28
  );

  perform public.seed_product(
    'Rain Shell Jacket', 'rain-shell-jacket', 'outerwear',
    72000, 90000, array['sale'],
    array['Olive', 'Black'], array['S', 'M', 'L', 'XL', '2XL'],
    array[
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80'
    ],
    'A packable rain shell for the long rains. Taped seams, a deep hood and enough pockets for the whole day.',
    array[
      'Waterproof 10k/10k recycled shell',
      'Fully taped seams',
      'Packable into its own pocket',
      'Adjustable hood and hem'
    ],
    'MT-RAI', 30, 42
  );

  perform public.seed_product(
    'Graphic Tee — Tanzania', 'graphic-tee-tanzania', 'tshirts',
    30000, null, array['new'],
    array['White', 'Black'], array['S', 'M', 'L', 'XL', '2XL'],
    array[
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'
    ],
    'A soft-handle cotton tee with a screen-printed Tanzania mark. Designed in Dar, printed in Dar.',
    array[
      '100% ring-spun cotton, 180gsm',
      'Water-based screen print',
      'Relaxed unisex fit',
      'Printed in Dar es Salaam'
    ],
    'MT-GRA', 48, 2
  );

  perform public.seed_product(
    'Woven Tote Bag', 'woven-tote-bag', 'bags',
    45000, null, array['new'],
    array['Natural', 'Black'], array['One Size'],
    array[
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'
    ],
    'A roomy hand-woven tote in natural fibre with leather handles. Market run, beach run, everything run.',
    array[
      'Hand-woven natural fibre',
      'Full-grain leather handles',
      'Cotton lining with zip pocket',
      'Made by a women''s cooperative in Tanga'
    ],
    'MT-TOT', 26, 10
  );

  -- ----------------------------------------------------------
  -- Opening stock history
  -- ----------------------------------------------------------
  insert into public.inventory_movements (variant_id, change, reason, note, created_at)
  select pv.id, pv.stock_quantity, 'restock', 'Opening stock (demo seed)',
         now() - interval '65 days'
  from public.product_variants pv
  where not exists (
    select 1 from public.inventory_movements im
    where im.variant_id = pv.id and im.note = 'Opening stock (demo seed)'
  );

  -- ----------------------------------------------------------
  -- Demo accounts
  -- ----------------------------------------------------------
  perform public.seed_demo_user(v_admin, 'admin@matonya.co.tz', v_password,
    'Matonya Admin', '+255700000001', 'admin');
  perform public.seed_demo_user(v_demo, 'demo@matonya.co.tz', v_password,
    'Asha Matonya', '+255712345678', 'customer');
  perform public.seed_demo_user(v_amina, 'amina.kessy@example.com', v_password,
    'Amina Kessy', '+255754111222', 'customer');
  perform public.seed_demo_user(v_joseph, 'joseph.mwita@example.com', v_password,
    'Joseph Mwita', '+255713222333', 'customer');
  perform public.seed_demo_user(v_neema, 'neema.msuya@example.com', v_password,
    'Neema Msuya', '+255715333444', 'customer');
  perform public.seed_demo_user(v_zawadi, 'zawadi.ali@example.com', v_password,
    'Zawadi Ali', '+255777444555', 'customer');
  perform public.seed_demo_user(v_baraka, 'baraka.mushi@example.com', v_password,
    'Baraka Mushi', '+255786555666', 'customer');

  -- ----------------------------------------------------------
  -- Orders (spread across statuses and the last six weeks)
  -- ----------------------------------------------------------
  perform public.seed_demo_order(
    v_demo, 'Asha Matonya', '+255712345678', 'demo@matonya.co.tz',
    'Dar es Salaam', 'Mikocheni', '12 Mikocheni B, near Warioba',
    'delivered', 'mpesa', 'paid', now() - interval '41 days',
    '[{"slug":"premium-cotton-tshirt","color":"Black","size":"M","quantity":2},
      {"slug":"slim-chino-trousers","color":"Khaki","size":"32","quantity":1},
      {"slug":"leather-sandals","color":"Tan","size":"42","quantity":1}]'::jsonb
  );

  perform public.seed_demo_order(
    v_amina, 'Amina Kessy', '+255754111222', 'amina.kessy@example.com',
    'Arusha', 'Njiro', 'Njiro Road, Block C',
    'delivered', 'tigopesa', 'paid', now() - interval '35 days',
    '[{"slug":"kitenge-print-shirt","color":"Safari Red","size":"M","quantity":1},
      {"slug":"kanga-beach-wrap","color":"Coral","size":"One Size","quantity":2}]'::jsonb
  );

  perform public.seed_demo_order(
    v_joseph, 'Joseph Mwita', '+255713222333', 'joseph.mwita@example.com',
    'Mwanza', 'Nyamagana', 'Kenyatta Road, Nyamagana',
    'delivered', 'cod', 'paid', now() - interval '29 days',
    '[{"slug":"denim-trucker-jacket","color":"Indigo","size":"L","quantity":1},
      {"slug":"graphic-tee-tanzania","color":"White","size":"L","quantity":2}]'::jsonb
  );

  perform public.seed_demo_order(
    v_neema, 'Neema Msuya', '+255715333444', 'neema.msuya@example.com',
    'Dodoma', 'Area C', 'Area C, near Nyerere Square',
    'delivered', 'airtelmoney', 'paid', now() - interval '23 days',
    '[{"slug":"merino-knit-polo","color":"Navy","size":"M","quantity":1},
      {"slug":"woven-leather-belt","color":"Tan","size":"M","quantity":1}]'::jsonb
  );

  perform public.seed_demo_order(
    v_demo, 'Asha Matonya', '+255712345678', 'demo@matonya.co.tz',
    'Dar es Salaam', 'Mikocheni', '12 Mikocheni B, near Warioba',
    'delivered', 'mpesa', 'paid', now() - interval '17 days',
    '[{"slug":"linen-safari-shirt","color":"Sand","size":"L","quantity":1},
      {"slug":"kikoi-throw","color":"Ocean","size":"130 x 180 cm","quantity":1}]'::jsonb
  );

  perform public.seed_demo_order(
    v_zawadi, 'Zawadi Ali', '+255777444555', 'zawadi.ali@example.com',
    'Mjini Magharibi', 'Stone Town', 'Shangani, Stone Town',
    'cancelled', 'mpesa', 'refunded', now() - interval '13 days',
    '[{"slug":"suede-chelsea-boots","color":"Dark Brown","size":"42","quantity":1},
      {"slug":"rain-shell-jacket","color":"Olive","size":"M","quantity":1}]'::jsonb,
    false
  );

  perform public.seed_demo_order(
    v_baraka, 'Baraka Mushi', '+255786555666', 'baraka.mushi@example.com',
    'Dar es Salaam', 'Kinondoni', 'Mpakani Street, Kinondoni',
    'shipped', 'card', 'paid', now() - interval '11 days',
    '[{"slug":"canvas-weekender-bag","color":"Olive","size":"One Size","quantity":1},
      {"slug":"maasai-shuka-throw","color":"Red Check","size":"One Size","quantity":1}]'::jsonb
  );

  perform public.seed_demo_order(
    v_amina, 'Amina Kessy', '+255754111222', 'amina.kessy@example.com',
    'Arusha', 'Njiro', 'Njiro Road, Block C',
    'processing', 'tigopesa', 'paid', now() - interval '9 days',
    '[{"slug":"dashiki-print-shirt","color":"Midnight","size":"L","quantity":1},
      {"slug":"beaded-maasai-cuff","color":"Red","size":"One Size","quantity":2}]'::jsonb
  );

  perform public.seed_demo_order(
    null, 'Grace Mushi', '+255784777888', 'grace.mushi@example.com',
    'Morogoro', 'Morogoro Urban', 'Msamvu area, Morogoro',
    'delivered', 'cod', 'paid', now() - interval '7 days',
    '[{"slug":"cotton-kaftan","color":"White","size":"M","quantity":1},
      {"slug":"leather-sandals","color":"Dark Brown","size":"40","quantity":1}]'::jsonb
  );

  perform public.seed_demo_order(
    v_demo, 'Asha Matonya', '+255712345678', 'demo@matonya.co.tz',
    'Dar es Salaam', 'Mikocheni', '12 Mikocheni B, near Warioba',
    'pending', 'cod', 'unpaid', now() - interval '6 days',
    '[{"slug":"graphic-tee-tanzania","color":"Black","size":"M","quantity":1},
      {"slug":"premium-cotton-tshirt","color":"White","size":"L","quantity":1}]'::jsonb
  );

  perform public.seed_demo_order(
    v_joseph, 'Joseph Mwita', '+255713222333', 'joseph.mwita@example.com',
    'Mwanza', 'Nyamagana', 'Kenyatta Road, Nyamagana',
    'shipped', 'card', 'paid', now() - interval '5 days',
    '[{"slug":"denim-trucker-jacket","color":"Black","size":"M","quantity":1}]'::jsonb
  );

  perform public.seed_demo_order(
    v_neema, 'Neema Msuya', '+255715333444', 'neema.msuya@example.com',
    'Dodoma', 'Area C', 'Area C, near Nyerere Square',
    'processing', 'airtelmoney', 'paid', now() - interval '4 days',
    '[{"slug":"linen-wide-leg-trousers","color":"Sand","size":"32","quantity":1},
      {"slug":"merino-knit-polo","color":"White","size":"S","quantity":1}]'::jsonb
  );

  perform public.seed_demo_order(
    v_zawadi, 'Zawadi Ali', '+255777444555', 'zawadi.ali@example.com',
    'Unguja North', 'Nungwi', 'Nungwi beach road',
    'confirmed', 'cod', 'pending', now() - interval '3 days',
    '[{"slug":"kitenge-print-shirt","color":"Ocean Blue","size":"M","quantity":1},
      {"slug":"kanga-beach-wrap","color":"Turquoise","size":"One Size","quantity":1}]'::jsonb
  );

  perform public.seed_demo_order(
    null, 'Peter Mwakyusa', '+255789999000', 'peter.mwakyusa@example.com',
    'Mbeya', 'Mbeya City', 'Uyole, Mbeya',
    'pending', 'cod', 'unpaid', now() - interval '2 days',
    '[{"slug":"rain-shell-jacket","color":"Black","size":"L","quantity":1},
      {"slug":"lightweight-hoodie","color":"Charcoal","size":"L","quantity":1}]'::jsonb
  );

  perform public.seed_demo_order(
    v_baraka, 'Baraka Mushi', '+255786555666', 'baraka.mushi@example.com',
    'Dar es Salaam', 'Kinondoni', 'Mpakani Street, Kinondoni',
    'delivered', 'mpesa', 'paid', now() - interval '1 day',
    '[{"slug":"woven-leather-belt","color":"Dark Brown","size":"L","quantity":1},
      {"slug":"beaded-maasai-cuff","color":"Blue","size":"One Size","quantity":1},
      {"slug":"canvas-weekender-bag","color":"Black","size":"One Size","quantity":1}]'::jsonb
  );

  perform public.seed_demo_order(
    v_demo, 'Asha Matonya', '+255712345678', 'demo@matonya.co.tz',
    'Dar es Salaam', 'Mikocheni', '12 Mikocheni B, near Warioba',
    'confirmed', 'airtelmoney', 'pending', now() - interval '1 day',
    '[{"slug":"linen-safari-shirt","color":"White","size":"M","quantity":1}]'::jsonb
  );

  -- Remember each demo customer's last delivery address so checkout comes
  -- prefilled on first use (mirrors what place_order() does on real orders).
  update public.profiles p
     set default_region         = o.region,
         default_city           = o.city,
         default_address        = o.address,
         default_delivery_notes = o.delivery_notes
    from (
      select distinct on (user_id) user_id, region, city, address, delivery_notes
        from public.orders
       where user_id is not null
       order by user_id, created_at desc
    ) o
   where p.id = o.user_id;

  -- ----------------------------------------------------------
  -- Extra inventory history (restock, damage, return)
  -- ----------------------------------------------------------
  perform public.seed_stock_movement('MT-TEE-BLA-M', 12, 'restock',
    'Restock — Kariakoo supplier', now() - interval '21 days');
  perform public.seed_stock_movement('MT-DEN-IND-L', -2, 'damage',
    'Water damage in storage', now() - interval '10 days');
  perform public.seed_stock_movement('MT-KIT-SAF-M', 1, 'return',
    'Customer return — wrong size', now() - interval '8 days');
  perform public.seed_stock_movement('MT-SND-TAN-42', 8, 'restock',
    'Workshop restock — Mwanza', now() - interval '6 days');

  -- ----------------------------------------------------------
  -- Expenses
  -- ----------------------------------------------------------
  insert into public.expenses (category, description, amount, incurred_on) values
    ('Supplier',    'Kitenge fabric — Kariakoo market',          1250000, current_date - 45),
    ('Supplier',    'Full-grain leather — Mwanza workshop',       780000, current_date - 38),
    ('Packaging',   'Branded boxes and tissue paper',             145000, current_date - 30),
    ('Advertising', 'Instagram & TikTok ads — October',           320000, current_date - 28),
    ('Delivery',    'Courier fees — upcountry orders',            210000, current_date - 21),
    ('Rent',        'Workshop rent — Dar es Salaam',              600000, current_date - 18),
    ('Salaries',    'Tailoring team — October',                  1400000, current_date - 15),
    ('Advertising', 'Influencer collaboration — Dar',             250000, current_date - 12),
    ('Packaging',   'Garment bags and hang tags',                  95000, current_date - 9),
    ('Delivery',    'Boda delivery — Dar es Salaam',               85000, current_date - 6),
    ('Other',       'Pop-up stall — Slipway weekend market',      150000, current_date - 5),
    ('Supplier',    'Cotton jersey — 220gsm rolls',               540000, current_date - 3),
    ('Salaries',    'Workshop assistant — November',              450000, current_date - 2),
    ('Advertising', 'Google Shopping trial',                      120000, current_date - 1);

  -- ----------------------------------------------------------
  -- Deliberately low / sold-out variants so the admin low-stock
  -- alerts and out-of-stock states are visible in the demo.
  -- ----------------------------------------------------------
  perform public.seed_set_stock('MT-TEE-WHI-M', 3, 'Demo low-stock showcase');
  perform public.seed_set_stock('MT-DEN-IND-L', 3, 'Demo low-stock showcase');
  perform public.seed_set_stock('MT-KIT-SAF-M', 1, 'Demo low-stock showcase');
  perform public.seed_set_stock('MT-SND-TAN-42', 0, 'Demo low-stock showcase');

  raise notice 'Matonya demo seed loaded successfully.';
end;
$$;

select public.seed_demo();

-- Remove helper functions so they cannot be called from the API.
drop function if exists public.seed_demo();
drop function if exists public.seed_demo_order(uuid, text, text, text, text, text, text, text, text, text, timestamptz, jsonb, boolean);
drop function if exists public.seed_demo_user(uuid, text, text, text, text, text);
drop function if exists public.seed_set_stock(text, integer, text);
drop function if exists public.seed_stock_movement(text, integer, text, text, timestamptz);
drop function if exists public.seed_product(text, text, text, numeric, numeric, text[], text[], text[], text[], text, text[], text, integer, integer);
