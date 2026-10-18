-- App-wide switches kept in the database, because Vercel functions do not
-- share memory (plans/03-product-reviews/deploy-adjustments.md, item 1).
-- Exactly one row (id = true). ai_disabled_until is the AI circuit breaker:
-- while it is in the future the server does not call the summary model
-- (set after an OpenAI quota, billing or invalid-key error).
create table public.app_flags (
  id boolean primary key default true check (id),
  ai_disabled_until timestamptz,                -- null or past: AI enabled
  ai_disabled_reason text,                      -- e.g. 'insufficient_quota'
  updated_at timestamptz not null default now()
);

insert into public.app_flags (id) values (true) on conflict (id) do nothing;

-- No policies: only the server (service role) can read or write the flags.
alter table public.app_flags enable row level security;
