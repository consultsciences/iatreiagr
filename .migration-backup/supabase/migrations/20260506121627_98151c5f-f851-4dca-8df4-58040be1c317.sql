
-- Listings table
CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('spaces','equipment','jobs','supplies','services')),
  title TEXT NOT NULL,
  description TEXT,
  city TEXT,
  region TEXT,
  price NUMERIC,
  price_unit TEXT,
  price_label TEXT,
  badge TEXT,
  meta TEXT,
  image_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  owner_id UUID,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  featured BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_category ON public.listings(category);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_featured ON public.listings(featured);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published listings are viewable by everyone"
  ON public.listings FOR SELECT
  USING (status = 'published' OR owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can create their own listings"
  ON public.listings FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners and admins can update listings"
  ON public.listings FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners and admins can delete listings"
  ON public.listings FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Inquiries table
CREATE TABLE public.inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_phone TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','replied','archived')),
  sender_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiries_listing ON public.inquiries(listing_id);
CREATE INDEX idx_inquiries_status ON public.inquiries(status);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an inquiry"
  ON public.inquiries FOR INSERT
  WITH CHECK (
    char_length(sender_name) BETWEEN 1 AND 120
    AND char_length(sender_email) BETWEEN 3 AND 255
    AND char_length(message) BETWEEN 1 AND 5000
  );

CREATE POLICY "Listing owners and admins can view inquiries"
  ON public.inquiries FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = inquiries.listing_id AND l.owner_id = auth.uid()
    )
  );

CREATE POLICY "Listing owners and admins can update inquiries"
  ON public.inquiries FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = inquiries.listing_id AND l.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = inquiries.listing_id AND l.owner_id = auth.uid()
    )
  );

CREATE TRIGGER trg_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
