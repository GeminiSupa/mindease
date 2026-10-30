-- Run once in the Supabase SQL editor before saving international therapist countries.
alter table public.therapists
  add column if not exists country_of_origin text not null default 'Pakistan',
  add column if not exists country_code text not null default 'PK';

update public.therapists
set country_of_origin = coalesce(nullif(country_of_origin, ''), 'Pakistan'),
    country_code = upper(coalesce(nullif(country_code, ''), 'PK'));

alter table public.therapists
  drop constraint if exists therapists_country_code_format;

alter table public.therapists
  add constraint therapists_country_code_format check (country_code ~ '^[A-Z]{2}$');
