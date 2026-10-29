-- MindEase: Dashboard & Profile Enhancement SQL Migration
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to run multiple times (idempotent)

-- 1. THERAPIST TABLE ENHANCEMENTS
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS city text DEFAULT 'Online';
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT NULL;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS appointment_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS admin_notes text;

-- 2. LEADS TABLE ENHANCEMENTS
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS therapist_interest text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted boolean NOT NULL DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS page_url text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes text;

-- 3. REVIEWS TABLE (new)
CREATE TABLE IF NOT EXISTS public.reviews (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  therapist_id    uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
  client_name     text NOT NULL,
  rating          integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body            text,
  is_approved     boolean NOT NULL DEFAULT false,
  approved_at     timestamptz,
  approved_by     uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies — using DROP + CREATE for idempotency
-- (avoids the DO $$ catalog-visibility bug with newly-created tables)
DROP POLICY IF EXISTS "Service role full access on reviews" ON public.reviews;
CREATE POLICY "Service role full access on reviews"
  ON public.reviews FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;
CREATE POLICY "Public can read approved reviews"
  ON public.reviews FOR SELECT
  USING (is_approved = true);

CREATE INDEX IF NOT EXISTS idx_reviews_therapist_id ON public.reviews(therapist_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(therapist_id, is_approved);

-- 4. RATING AUTO-UPDATE TRIGGER
CREATE OR REPLACE FUNCTION public.refresh_therapist_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.therapists
  SET
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.reviews
      WHERE therapist_id = COALESCE(NEW.therapist_id, OLD.therapist_id)
        AND is_approved = true
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE therapist_id = COALESCE(NEW.therapist_id, OLD.therapist_id)
        AND is_approved = true
    )
  WHERE id = COALESCE(NEW.therapist_id, OLD.therapist_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_therapist_rating ON public.reviews;
CREATE TRIGGER trg_refresh_therapist_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_therapist_rating();

-- 5. APPOINTMENT COUNT TRIGGER
CREATE OR REPLACE FUNCTION public.refresh_therapist_appointment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.therapists SET appointment_count = appointment_count + 1 WHERE id = NEW.therapist_id;
  END IF;
  IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    UPDATE public.therapists SET appointment_count = GREATEST(0, appointment_count - 1) WHERE id = NEW.therapist_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_appointment_count ON public.appointments;
CREATE TRIGGER trg_refresh_appointment_count
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.refresh_therapist_appointment_count();

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_therapists_city ON public.therapists(city) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_therapists_featured ON public.therapists(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_leads_converted ON public.leads(converted);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
