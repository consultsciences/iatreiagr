CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmation_code TEXT NOT NULL UNIQUE,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  doctor_specialty TEXT NOT NULL,
  doctor_address TEXT,
  appointment_date DATE NOT NULL,
  appointment_slot TEXT NOT NULL,
  visit_type TEXT NOT NULL CHECK (visit_type IN ('in-person', 'telehealth')),
  price NUMERIC NOT NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_email ON public.bookings(patient_email);
CREATE INDEX idx_bookings_confirmation ON public.bookings(confirmation_code);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can view own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can claim guest bookings by email"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  user_id IS NULL
  AND patient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
)
WITH CHECK (user_id = auth.uid());