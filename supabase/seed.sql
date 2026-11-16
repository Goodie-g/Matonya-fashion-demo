-- ============================================================
-- Mizizi — seed data (run AFTER schema.sql)
-- A Tanzanian menswear catalog with TZS pricing.
-- Each product gets a full color × size variant matrix with SKUs
-- and deterministic stock levels.
-- ============================================================

insert into public.categories (name, slug) values
  ('T-Shirts',    'tshirts'),
  ('Shirts',      'shirts'),
  ('Kitenge',     'kitenge'),
  ('Trousers',    'trousers'),
  ('Outerwear',   'outerwear'),
  ('Accessories', 'accessories')
on conflict (slug) do nothing;

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
  p_stock       integer default 15
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
  insert into public.products (
    name, slug, description, features, category_id,
    base_price, compare_at_price, tags,
    rating, review_count, is_active
  ) values (
    p_name, p_slug, p_description, p_features,
    (select id from public.categories where slug = p_category),
    p_base_price, p_compare_at, p_tags,
        round((40 + abs(hashtext(p_slug) % 10))::numeric / 10, 1), -- 4.0–4.9
    80 + abs(hashtext(p_slug) % 900),
    true
  )
  returning id into v_product_id;

  foreach v_url in array p_images loop
    insert into public.product_images (product_id, image_url, position)
    values (v_product_id, v_url, v_i);
    v_i := v_i + 1;
  end loop;

  foreach v_color in array p_colors loop
    foreach v_size in array p_sizes loop
      -- Deterministic but varied stock (5–24) per variant.
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

-- ------------------------------------------------------------
-- Products
-- ------------------------------------------------------------
select public.seed_product(
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
  'MZ-TEE', 18
);

select public.seed_product(
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
  'MZ-KIT', 12
);

select public.seed_product(
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
  'MZ-SAF', 14
);

select public.seed_product(
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
  'MZ-CHI', 16
);

select public.seed_product(
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
  'MZ-DEN', 10
);

select public.seed_product(
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
  'MZ-HOD', 14
);

select public.seed_product(
  'Maasai Shuka Throw', 'maasai-shuka-throw', 'accessories',
  35000, null, array['bestseller'],
  array['Red Check', 'Blue Check'], array['One Size'],
  array[
    'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800&q=80'
  ],
  'The iconic Maasai shuka, woven soft and sized as a home throw or travel wrap. A piece of Tanzania, wherever you are.',
  array[
    'Traditional Maasai check weave',
    'Soft brushed acrylic-cotton blend',
    '180cm × 130cm',
    'Hand wash cold'
  ],
  'MZ-SHU', 20
);

select public.seed_product(
  'Kanga Beach Wrap', 'kanga-beach-wrap', 'kitenge',
  18000, 25000, array['sale'],
  array['Coral', 'Turquoise', 'Sunset'], array['One Size'],
  array[
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
  ],
  'Classic Zanzibar kanga with a printed jina message. Beach wrap, head scarf, picnic cloth — the most versatile thing you own.',
  array[
    '100% lightweight cotton',
    'Traditional printed border and jina',
    '160cm × 110cm',
    'Softens with every wash'
  ],
  'MZ-KAN', 22
);

select public.seed_product(
  'Leather Sandals', 'leather-sandals', 'accessories',
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
  'MZ-SND', 8
);

select public.seed_product(
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
  'MZ-POL', 12
);

-- A few deliberately low / sold-out variants so the admin
-- low-stock alerts and out-of-stock states are visible in the demo.
update public.product_variants set stock_quantity = 3
  where sku in ('MZ-TEE-WHT-M', 'MZ-DEN-IND-L');
update public.product_variants set stock_quantity = 1
  where sku = 'MZ-KIT-SAF-M';
update public.product_variants set stock_quantity = 0
  where sku = 'MZ-SND-TAN-42';

-- Record the seeded opening stock as inventory movements,
-- so the history explains how current levels came to be.
insert into public.inventory_movements (variant_id, change, reason, note)
select id, stock_quantity, 'restock', 'Opening stock (seed)'
from public.product_variants;

drop function public.seed_product(text, text, text, numeric, numeric, text[], text[], text[], text[], text, text[], text, integer);

-- Demo expenses so the finance summary has data.
insert into public.expenses (category, description, amount, incurred_on) values
  ('Supplier',    'Kitenge fabric — Kariakoo market',          850000, current_date - 21),
  ('Delivery',    'Courier fees — upcountry orders',           120000, current_date - 14),
  ('Advertising', 'Instagram & TikTok ads — September',        250000, current_date - 10),
  ('Packaging',   'Branded boxes and tissue paper',             95000, current_date - 7),
  ('Other',       'Pop-up stall — Slipway weekend market',     150000, current_date - 3);

-- Demo orders removed — place real orders through the storefront
-- checkout so stock levels and inventory history stay accurate.
