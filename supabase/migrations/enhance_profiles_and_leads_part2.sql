-- ────────────────────────────────────────────────────────────
-- BLOCK 2 — Policies, Triggers & Indexes
-- Run ONLY after Block 1 succeeds.
-- ────────────────────────────────────────────────────────────

-- 2a. RLS Policies for reviews
DROP POLICY IF EXISTS "Service role full access on reviews"  ON public.reviews;
DROP POLICY IF EXISTS "Public can read approved reviews"     ON public.reviews;

CREATE POLICY "Service role full access on reviews"
  ON public.reviews FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK(auth.role() = 'service_role');

CREATE POLICY "Public can read approved reviews"
  ON public.reviews FOR SELECT
  USING (is_approved = true);

-- 2b. Indexes on reviews
CREATE INDEX IF NOT EXISTS idx_reviews_therapist_id ON public.reviews(therapist_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved     ON public.reviews(therapist_id, is_approved);

-- 2c. Rating auto-update trigger
CREATE OR REPLACE FUNCTION public.refresh_therapist_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.therapists
  SET
    rating = (
      SELECT ROUND(AVG(r.rating)::numeric, 2)
      FROM public.reviews r
      WHERE r.therapist_id = COALESCE(NEW.therapist_id, OLD.therapist_id)
        AND r.is_approved = true
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews r
      WHERE r.therapist_id = COALESCE(NEW.therapist_id, OLD.therapist_id)
        AND r.is_approved = true
    )
  WHERE id = COALESCE(NEW.therapist_id, OLD.therapist_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_therapist_rating ON public.reviews;
CREATE TRIGGER trg_refresh_therapist_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_therapist_rating();

-- 2d. Appointment count trigger
CREATE OR REPLACE FUNCTION public.refresh_therapist_appointment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    UPDATE public.therapists
    SET appointment_count = appointment_count + 1
    WHERE id = NEW.therapist_id;
  END IF;
  IF OLD.status = 'completed' AND NEW.status <> 'completed' THEN
    UPDATE public.therapists
    SET appointment_count = GREATEST(0, appointment_count - 1)
    WHERE id = NEW.therapist_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_appointment_count ON public.appointments;
CREATE TRIGGER trg_refresh_appointment_count
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.refresh_therapist_appointment_count();

-- 2e. Misc indexes
CREATE INDEX IF NOT EXISTS idx_therapists_city     ON public.therapists(city)      WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_therapists_featured ON public.therapists(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_leads_converted     ON public.leads(converted);
CREATE INDEX IF NOT EXISTS idx_leads_created_at    ON public.leads(created_at DESC);
