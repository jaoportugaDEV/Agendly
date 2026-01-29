-- Migration: Setup Supabase Storage for public site media
-- Creates bucket and RLS policies for business media uploads

-- 1. Create public bucket for business media
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-media', 'business-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Business admins can upload media
CREATE POLICY "Business admins can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'business-media' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses 
      WHERE is_business_admin(auth.uid(), id)
    )
  );

-- 3. Policy: Public can view business media
CREATE POLICY "Public can view business media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-media');

-- 4. Policy: Business admins can delete their media
CREATE POLICY "Business admins can delete media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'business-media' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses 
      WHERE is_business_admin(auth.uid(), id)
    )
  );

-- 5. Policy: Business admins can update their media
CREATE POLICY "Business admins can update media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'business-media' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses 
      WHERE is_business_admin(auth.uid(), id)
    )
  );
