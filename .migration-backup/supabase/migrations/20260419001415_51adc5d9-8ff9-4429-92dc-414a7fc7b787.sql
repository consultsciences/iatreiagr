DROP POLICY IF EXISTS "Users can claim guest bookings by email" ON public.bookings;

CREATE POLICY "Users can claim guest bookings by email"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  user_id IS NULL
  AND patient_email = (auth.jwt() ->> 'email')
)
WITH CHECK (
  user_id = auth.uid()
);