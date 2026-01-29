-- Fix RLS policies for business_members and business_subscriptions
-- This fixes the circular dependency issue when creating the first business

-- Drop and recreate the business_members INSERT policy
DROP POLICY IF EXISTS "Admins can add members" ON business_members;

CREATE POLICY "Admins can add members"
  ON business_members FOR INSERT
  WITH CHECK (
    is_business_admin(auth.uid(), business_id)
    OR auth.uid() = user_id  -- Allow users to be added to businesses (for initial admin)
  );

-- Add INSERT policy for business_subscriptions (was missing)
CREATE POLICY "Allow subscription creation"
  ON business_subscriptions FOR INSERT
  WITH CHECK (true);
