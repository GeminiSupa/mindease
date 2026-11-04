-- Consent-based self-test lead attribution and follow-up workflow.
alter table public.leads
  add column if not exists city text,
  add column if not exists inferred_city text,
  add column if not exists region text,
  add column if not exists country_code text,
  add column if not exists ip_prefix text,
  add column if not exists ip_hash text,
  add column if not exists referrer text,
  add column if not exists landing_page text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists browser_language text,
  add column if not exists timezone text,
  add column if not exists device_type text,
  add column if not exists consent_accepted boolean not null default false,
  add column if not exists consent_text text,
  add column if not exists privacy_version text,
  add column if not exists lead_status text not null default 'new'
    check (lead_status in ('new', 'contacted', 'qualified', 'booked', 'not_interested')),
  add column if not exists lead_score integer not null default 0
    check (lead_score between 0 and 100),
  add column if not exists last_contacted_at timestamptz;

create index if not exists leads_status_created_idx on public.leads(lead_status, created_at desc);
create index if not exists leads_campaign_idx on public.leads(utm_campaign, created_at desc);
create index if not exists leads_ip_hash_idx on public.leads(ip_hash);
