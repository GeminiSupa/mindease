-- ════════════════════════════════════════════════════════════
-- MINDEASE — Schema Migration
-- HOW TO RUN: Paste BLOCK 1 first and click Run.
--             Then paste BLOCK 2 and click Run.
-- ════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────
-- BLOCK 1 — Tables & Columns
-- Paste this entire block and click Run. Wait for success.
-- ────────────────────────────────────────────────────────────

-- 1a. Therapist enhancements
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS city              text          DEFAULT 'Online';
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS is_verified       boolean       NOT NULL DEFAULT false;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS rating            numeric(3,2)  DEFAULT NULL;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS review_count      integer       NOT NULL DEFAULT 0;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS appointment_count integer       NOT NULL DEFAULT 0;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS admin_notes       text;

-- 1b. Leads enhancements
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS name               text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS therapist_interest text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted          boolean   NOT NULL DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_at       timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS page_url           text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes              text;

-- 1c. Drop and recreate reviews table (no real data yet — safe reset)
DROP TABLE IF EXISTS public.reviews CASCADE;

CREATE TABLE public.reviews (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  therapist_id uuid        NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
  client_name  text        NOT NULL,
  rating       integer     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body         text,
  is_approved  boolean     NOT NULL DEFAULT false,
  approved_at  timestamptz,
  approved_by  uuid        REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
