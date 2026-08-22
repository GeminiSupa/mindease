-- MindEase admin-managed public contact settings.
-- Run after supabase/mindease-production-upgrade.sql.

create table if not exists public.site_settings (
  id text primary key check (id = 'clinic'),
  whatsapp_number text not null check (whatsapp_number ~ '^\d{8,15}$'),
  display_phone text not null check (char_length(display_phone) between 8 and 30),
  contact_email text not null check (char_length(contact_email) <= 254),
  email_is_placeholder boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

revoke select on public.site_settings from anon, authenticated;
grant select (
  id,
  whatsapp_number,
  display_phone,
  contact_email,
  email_is_placeholder,
  updated_at
) on public.site_settings to anon, authenticated;

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read"
on public.site_settings for select
using (id = 'clinic');

drop policy if exists "site_settings_admin_insert" on public.site_settings;
create policy "site_settings_admin_insert"
on public.site_settings for insert
with check (public.is_mindease_admin());

drop policy if exists "site_settings_admin_update" on public.site_settings;
create policy "site_settings_admin_update"
on public.site_settings for update
using (public.is_mindease_admin())
with check (public.is_mindease_admin());

insert into public.site_settings (
  id,
  whatsapp_number,
  display_phone,
  contact_email,
  email_is_placeholder
)
values (
  'clinic',
  '923001234567',
  '+92 300 1234567',
  'hello@mindease.example',
  true
)
on conflict (id) do nothing;

-- Ensure PostgREST sees the new table immediately instead of waiting for its
-- schema cache to refresh on its own.
notify pgrst, 'reload schema';
