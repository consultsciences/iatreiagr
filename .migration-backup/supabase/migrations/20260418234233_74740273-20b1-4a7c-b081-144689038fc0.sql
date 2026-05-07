ALTER TABLE public.bookings
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Allow users to cancel their own active bookings, only if >24h away.
-- Slot is "HH:MM" text, combined with appointment_date to build the timestamp.
CREATE POLICY "Users can cancel own future bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND status = 'active'
  AND ((appointment_date::timestamp + appointment_slot::time) - now()) > interval '24 hours'
)
WITH CHECK (
  user_id = auth.uid()
  AND status = 'cancelled'
);