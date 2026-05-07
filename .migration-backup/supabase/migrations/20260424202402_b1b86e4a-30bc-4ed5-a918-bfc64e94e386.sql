CREATE TABLE public.clinic_claim_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  decision text NOT NULL,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_clinic_claim_audit_log_claim_id ON public.clinic_claim_audit_log(claim_id);
CREATE INDEX idx_clinic_claim_audit_log_created_at ON public.clinic_claim_audit_log(created_at DESC);

ALTER TABLE public.clinic_claim_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.clinic_claim_audit_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert audit log entries"
ON public.clinic_claim_audit_log
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());
