-- Add verification fields to doctor_profiles
ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;

-- Admin policies for doctor_profiles
CREATE POLICY "Admins can view all doctor profiles"
ON public.doctor_profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any doctor profile"
ON public.doctor_profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for clinic_claims
CREATE POLICY "Admins can view all clinic claims"
ON public.clinic_claims
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update clinic claims"
ON public.clinic_claims
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));