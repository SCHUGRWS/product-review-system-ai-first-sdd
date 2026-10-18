-- "Most reviewed here" row on /home (specs/home.md): available products ranked
-- by the number of reviews posted in the app, then by average rating, then by
-- the most recent review. Returns the numbers too, so the caller needs no
-- second stats query. Legacy feedback without a product never matches.
create function public.most_reviewed_products(max_count integer)
returns table (product_id text, review_count bigint, average numeric)
language sql
stable
set search_path = ''
as $$
  select f.product_id, count(*), round(avg(f.rating), 2)
  from public.feedbacks f
  join public.available_products p on p.id = f.product_id
  group by f.product_id
  order by count(*) desc, avg(f.rating) desc, max(f.created_at) desc
  limit greatest(max_count, 0);
$$;

-- Only the server (service role) uses this function.
revoke execute on function public.most_reviewed_products(integer)
  from public, anon, authenticated;
