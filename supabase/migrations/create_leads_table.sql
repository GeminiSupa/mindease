-- Run this in your Supabase SQL editor to create the leads table
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

CREATE TABLE IF NOT EXISTS public.leads (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_method text NOT NULL,      -- 'email' or 'whatsapp'
  contact_value  text NOT NULL,      -- the actual email or phone number
  source         text DEFAULT 'directory_gate',
  created_at     timestamptz DEFAULT now()
);

-- Allow the service role to insert and read
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on leads"
  ON public.leads
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
