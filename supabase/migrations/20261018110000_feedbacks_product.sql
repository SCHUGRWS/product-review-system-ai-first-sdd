-- Feedback is now about a catalog product (specs/feedback.md, updated).
-- Rows from the first version keep product_id null and their typed product_name.

alter table public.feedbacks
  add column product_id text
    references public.products (id) on delete restrict;

-- product_name now holds the product title at review time (a snapshot), and
-- Amazon titles are longer than the old 2..120 limit.
alter table public.feedbacks
  drop constraint feedbacks_product_name_check;

alter table public.feedbacks
  add constraint feedbacks_product_name_check
    check (char_length(product_name) between 1 and 500);

-- One feedback per user per product (409 on repeat). Legacy rows are excluded.
create unique index feedbacks_account_product_key
  on public.feedbacks (account_id, product_id)
  where product_id is not null;

-- Lookups by product (FK checks, future product pages)
create index feedbacks_product_idx
  on public.feedbacks (product_id);
