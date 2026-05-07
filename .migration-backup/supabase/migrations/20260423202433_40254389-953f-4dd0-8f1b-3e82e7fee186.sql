-- Add subscription tier to doctor profiles for the onboarding wizard.
-- Allowed values: 'free', 'premium', 'pro'.
ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

ALTER TABLE public.doctor_profiles
  DROP CONSTRAINT IF EXISTS doctor_profiles_subscription_tier_check;

ALTER TABLE public.doctor_profiles
  ADD CONSTRAINT doctor_profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free','premium','pro'));