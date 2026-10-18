-- UI language chosen on the profile (/me), so it follows the user to other
-- devices (specs/i18n.md). Sign-in reads it, sets the prs_locale cookie and
-- redirects to /<locale>/home. Only the locales the app ships are accepted.
alter table public.accounts
  add column locale text not null default 'en'
  check (locale in ('en', 'pt-BR'));
