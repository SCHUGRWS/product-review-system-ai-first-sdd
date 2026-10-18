-- product_review_stats(ids) (migration 20261018165000): the app's review count
-- and average per product, for the catalog cards. Run with `pnpm db:test`;
-- everything runs in a transaction that is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into public.accounts (id, first_name, last_name, email, password, salt)
values
  ('stats_acc_1', 'Ada', 'Lovelace', 'stats-1@example.com', 'x', 'x'),
  ('stats_acc_2', 'Alan', 'Turing', 'stats-2@example.com', 'x', 'x'),
  ('stats_acc_3', 'Grace', 'Hopper', 'stats-3@example.com', 'x', 'x');

insert into public.products
  (id, asin, title, url, image_url, price_cents, category_slug, category_name)
values
  ('stats_prod_1', 'STATS00001', 'Reviewed', 'https://www.amazon.com.br/dp/STATS00001',
   'https://m.media-amazon.com/images/I/a.jpg', 1000, 'kitchen', 'Cozinha'),
  ('stats_prod_2', 'STATS00002', 'Not reviewed', 'https://www.amazon.com.br/dp/STATS00002',
   'https://m.media-amazon.com/images/I/b.jpg', 1000, 'kitchen', 'Cozinha'),
  ('stats_prod_3', 'STATS00003', 'Reviewed, not asked', 'https://www.amazon.com.br/dp/STATS00003',
   'https://m.media-amazon.com/images/I/c.jpg', 1000, 'kitchen', 'Cozinha');

insert into public.feedbacks (id, account_id, product_id, product_name, rating, comment)
values
  ('stats_fb_1', 'stats_acc_1', 'stats_prod_1', 'Reviewed', 5, 'Great product, works well.'),
  ('stats_fb_2', 'stats_acc_2', 'stats_prod_1', 'Reviewed', 4, 'Good product, works well.'),
  ('stats_fb_3', 'stats_acc_3', 'stats_prod_1', 'Reviewed', 2, 'Weak product, broke fast.'),
  ('stats_fb_4', 'stats_acc_1', 'stats_prod_3', 'Reviewed, not asked', 1, 'Not what I expected.');

select results_eq(
  $$select product_id, review_count, average
    from public.product_review_stats(array['stats_prod_1', 'stats_prod_2'])$$,
  $$values ('stats_prod_1'::text, 3::bigint, 3.67::numeric)$$,
  'count and average (2 decimals) of the asked products; none for a product without reviews'
);

select is(
  (select count(*) from public.product_review_stats(array[]::text[])),
  0::bigint,
  'no ids, no rows'
);

select ok(
  not has_function_privilege('anon', 'public.product_review_stats(text[])', 'execute'),
  'anon cannot call it'
);

select ok(
  not has_function_privilege('authenticated', 'public.product_review_stats(text[])', 'execute'),
  'authenticated cannot call it'
);

select * from finish();
rollback;
