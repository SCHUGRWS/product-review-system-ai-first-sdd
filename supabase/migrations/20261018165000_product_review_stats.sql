-- The app's own review numbers for the product cards (specs/product.md):
-- count and average rating per product, for every product of one list or grid
-- page in a single call. Products without reviews are left out (the caller
-- treats a missing id as 0 reviews). Legacy feedback without a product never
-- matches. Uses feedbacks_product_idx.
create function public.product_review_stats(ids text[])
returns table (product_id text, review_count bigint, average numeric)
language sql
stable
set search_path = ''
as $$
  select f.product_id, count(*), round(avg(f.rating), 2)
  from public.feedbacks f
  where f.product_id = any (ids)
  group by f.product_id;
$$;

-- Only the server (service role) uses this function.
revoke execute on function public.product_review_stats(text[])
  from public, anon, authenticated;
