-- Availability rule (migration 20261018160000): a product is available when
-- it was seen within 3 days before the latest import. Run with `pnpm db:test`
-- (supabase test db); everything runs in a transaction that is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

-- Start from an empty catalog (rolled back at the end)
delete from public.feedbacks;
delete from public.product_feedback_summaries;
delete from public.products;

select is(
  (select count(*) from public.available_products), 0::bigint,
  'an empty table has no available products'
);
select is(
  (select count(*) from public.list_product_categories()), 0::bigint,
  'an empty table has no categories'
);

insert into public.products
  (asin, title, url, image_url, price_cents, category_slug, category_name, last_seen_at)
values
  -- the latest import, 30 days ago
  ('B000000001', 'Latest import A', 'https://www.amazon.com.br/dp/B000000001',
   'https://m.media-amazon.com/images/I/a.jpg', 1000, 'kitchen', 'Cozinha', now() - interval '30 days'),
  ('B000000002', 'Latest import B', 'https://www.amazon.com.br/dp/B000000002',
   'https://m.media-amazon.com/images/I/b.jpg', 1000, 'tvs', 'TVs', now() - interval '30 days 1 hour'),
  -- seen shortly before the latest import (2 days earlier)
  ('B000000003', 'Two days before', 'https://www.amazon.com.br/dp/B000000003',
   'https://m.media-amazon.com/images/I/c.jpg', 1000, 'kitchen', 'Cozinha', now() - interval '32 days'),
  -- 4 days older than the latest import
  ('B000000004', 'Four days before', 'https://www.amazon.com.br/dp/B000000004',
   'https://m.media-amazon.com/images/I/d.jpg', 1000, 'garden', 'Jardim', now() - interval '34 days');

select results_eq(
  'select asin from public.available_products order by asin',
  $$values ('B000000001'::text), ('B000000002'), ('B000000003')$$,
  'products from a latest import 30 days ago are still available'
);
select ok(
  not exists (select 1 from public.available_products where asin = 'B000000004'),
  'products 4+ days older than the latest import are hidden'
);
select results_eq(
  'select slug, count from public.list_product_categories()',
  $$values ('kitchen'::text, 2::bigint), ('tvs', 1::bigint)$$,
  'category counts follow the same rule'
);

-- A new import moves the window forward
update public.products set last_seen_at = now() where asin = 'B000000004';
select results_eq(
  'select asin from public.available_products order by asin',
  $$values ('B000000004'::text)$$,
  'a newer import hides products it no longer lists'
);

-- The view and the function are for the server only
select ok(
  not has_table_privilege('anon', 'public.available_products', 'select')
  and not has_function_privilege('anon', 'public.list_product_categories()', 'execute'),
  'anon cannot read the view or call the function'
);

select * from finish();
rollback;
