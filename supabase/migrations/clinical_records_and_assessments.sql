-- Clinical records, measurement-based care, and private document storage.
-- Run after mindease-admin-schema.sql and mindease-production-upgrade.sql.

create table if not exists public.clinical_cases (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid unique references public.appointments(id) on delete cascade,
  therapist_id uuid not null references public.therapists(id) on delete restrict,
  client_id uuid references auth.users(id) on delete set null,
  client_name text not null,
  client_email text,
  status text not null default 'active' check (status in ('active', 'paused', 'discharged', 'transferred')),
  presenting_concerns text,
  goals text,
  formulation text,
  treatment_plan text,
  risk_level text not null default 'not_assessed' check (risk_level in ('not_assessed', 'low', 'moderate', 'high', 'imminent')),
  risk_plan text,
  consent_recorded_at timestamptz,
  consent_scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_intakes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid unique not null references public.clinical_cases(id) on delete cascade,
  demographics jsonb not null default '{}'::jsonb,
  current_symptoms text,
  symptom_onset text,
  previous_treatment text,
  medical_history text,
  medications text,
  substance_use text,
  family_history text,
  social_context text,
  strengths_resources text,
  mental_status_exam jsonb not null default '{}'::jsonb,
  risk_assessment text,
  protective_factors text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.clinical_cases(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  author_id uuid not null references auth.users(id) on delete restrict,
  note_type text not null check (note_type in ('progress', 'psychotherapy', 'risk', 'consultation', 'discharge')),
  format text not null default 'DAP' check (format in ('DAP', 'SOAP', 'BIRP', 'free')),
  subjective text,
  objective text,
  assessment text,
  plan text,
  interventions text,
  client_response text,
  risk_level text check (risk_level is null or risk_level in ('low', 'moderate', 'high', 'imminent')),
  signed_at timestamptz,
  amended_from uuid references public.clinical_notes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessment_assignments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.clinical_cases(id) on delete cascade,
  therapist_id uuid not null references public.therapists(id) on delete restrict,
  instrument text not null check (instrument in ('PHQ-9', 'GAD-7')),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'sent' check (status in ('sent', 'completed', 'expired', 'revoked')),
  expires_at timestamptz not null default (now() + interval '14 days'),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_responses (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid unique not null references public.assessment_assignments(id) on delete cascade,
  answers jsonb not null,
  total_score integer not null,
  severity text not null,
  risk_flag boolean not null default false,
  client_acknowledged_disclaimer boolean not null default false,
  submitted_at timestamptz not null default now()
);

create table if not exists public.clinical_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.clinical_cases(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  file_size integer not null check (file_size > 0 and file_size <= 10485760),
  category text not null default 'other' check (category in ('intake', 'assessment', 'referral', 'medical', 'consent', 'homework', 'other')),
  created_at timestamptz not null default now()
);

alter table public.clinical_cases enable row level security;
alter table public.clinical_intakes enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.assessment_assignments enable row level security;
alter table public.assessment_responses enable row level security;
alter table public.clinical_documents enable row level security;

create index if not exists clinical_cases_therapist_idx on public.clinical_cases(therapist_id, updated_at desc);
create index if not exists clinical_notes_case_idx on public.clinical_notes(case_id, created_at desc);
create index if not exists assessment_assignments_case_idx on public.assessment_assignments(case_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mindease-clinical', 'mindease-clinical', false, 10485760,
  array['application/pdf','image/jpeg','image/png','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
