-- Cached AI summaries of a product's reviews (specs/product-reviews.md).
-- One row per product and language; regenerated only when the number of
-- reviews grew by at least 10% since review_count. Failures are never stored.
create table public.product_feedback_summaries (
  product_id text not null
    references public.products (id) on delete cascade,
  locale text not null check (locale in ('en', 'pt-BR')),
  summary jsonb not null,                       -- { verdict, headline, summary, pros, cons }
  review_count integer not null check (review_count >= 0), -- reviews the summary was built from
  model text not null,                          -- e.g. 'openai/gpt-4.1-nano'
  generated_at timestamptz not null default now(),
  primary key (product_id, locale)
);

-- No policies: only the server (service role) can read or write summaries.
alter table public.product_feedback_summaries enable row level security;
