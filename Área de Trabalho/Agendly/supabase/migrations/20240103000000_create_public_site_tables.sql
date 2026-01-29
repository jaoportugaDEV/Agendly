-- Migration: Create tables for public site functionality
-- business_public_profile: stores customizable public site information
-- business_gallery: stores gallery images for public site

-- 1. Create business_public_profile table
CREATE TABLE business_public_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE UNIQUE NOT NULL,
  short_description TEXT,
  full_description TEXT,
  hero_image_url TEXT,
  whatsapp VARCHAR(20),
  instagram VARCHAR(255),
  facebook VARCHAR(255),
  website VARCHAR(255),
  show_address BOOLEAN DEFAULT false,
  custom_cta_text VARCHAR(50) DEFAULT 'Agendar agora',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create business_gallery table
CREATE TABLE business_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption VARCHAR(200),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX idx_business_gallery_business ON business_gallery(business_id, display_order);
CREATE INDEX idx_business_public_profile_business ON business_public_profile(business_id);

-- 4. Enable RLS
ALTER TABLE business_public_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_gallery ENABLE ROW LEVEL SECURITY;

-- 5. Public read policies
CREATE POLICY "Public can read public profiles"
  ON business_public_profile FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE active = true AND deleted_at IS NULL
    )
  );

CREATE POLICY "Public can read gallery"
  ON business_gallery FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE active = true AND deleted_at IS NULL
    )
  );

-- 6. Admin write policies
CREATE POLICY "Admins can manage public profile"
  ON business_public_profile FOR ALL
  USING (is_business_admin(auth.uid(), business_id))
  WITH CHECK (is_business_admin(auth.uid(), business_id));

CREATE POLICY "Admins can manage gallery"
  ON business_gallery FOR ALL
  USING (is_business_admin(auth.uid(), business_id))
  WITH CHECK (is_business_admin(auth.uid(), business_id));

-- 7. Trigger for updated_at on business_public_profile
CREATE TRIGGER update_business_public_profile_updated_at
  BEFORE UPDATE ON business_public_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
