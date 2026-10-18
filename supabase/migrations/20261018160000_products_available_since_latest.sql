-- "Available" now means seen in the latest import, not in the last 3 days
-- (plans/03-product-reviews/deploy-adjustments.md, item 3). With manual
-- imports the catalog must not empty itself a few days after the last run:
-- a product is available when its last_seen_at falls within 3 days before the
-- most recent last_seen_at in the table. An empty table has no available
-- products. getProductById keeps reading public.products directly.

-- Lists, category pages and search read this view. security_invoker makes it
-- follow the caller's rights on public.products (RLS on, no policies), so only
-- the server (service role) sees rows. max(last_seen_at) uses
-- products_last_seen_idx.
create view public.available_products
with (security_invoker = true)
as
  select *
  from public.products
  where last_seen_at > (select max(last_seen_at) from public.products) - interval '3 days';

revoke all on public.available_products from public, anon, authenticated;

-- Category counts follow the same rule; the cutoff parameter is gone.
drop function public.list_product_categories(timestamptz);

create function public.list_product_categories()
returns table (slug text, name text, count bigint)
language sql
stable
set search_path = ''
as $$
  select category_slug, max(category_name), count(*)
  from public.available_products
  group by category_slug
  order by count(*) desc, category_slug;
$$;

-- Only the server (service role) uses this function.
revoke execute on function public.list_product_categories()
  from public, anon, authenticated;
