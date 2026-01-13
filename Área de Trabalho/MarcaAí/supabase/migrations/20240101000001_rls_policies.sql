-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS

-- Get user's business IDs
CREATE OR REPLACE FUNCTION get_user_businesses(user_uuid UUID)
RETURNS TABLE (business_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT bm.business_id
  FROM business_members bm
  WHERE bm.user_id = user_uuid
    AND bm.active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is business admin
CREATE OR REPLACE FUNCTION is_business_admin(user_uuid UUID, biz_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM business_members
    WHERE user_id = user_uuid
      AND business_id = biz_id
      AND role = 'admin'
      AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is business member (admin or staff)
CREATE OR REPLACE FUNCTION is_business_member(user_uuid UUID, biz_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM business_members
    WHERE user_id = user_uuid
      AND business_id = biz_id
      AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS TABLE POLICIES
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- BUSINESSES TABLE POLICIES
-- Users can read businesses they are members of
CREATE POLICY "Members can read their businesses"
  ON businesses FOR SELECT
  USING (
    id IN (SELECT get_user_businesses(auth.uid()))
    AND deleted_at IS NULL
  );

-- Users can create businesses (will become admin automatically via trigger)
CREATE POLICY "Authenticated users can create businesses"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can update their businesses
CREATE POLICY "Admins can update their businesses"
  ON businesses FOR UPDATE
  USING (is_business_admin(auth.uid(), id));

-- Only admins can soft delete their businesses
CREATE POLICY "Admins can delete their businesses"
  ON businesses FOR DELETE
  USING (is_business_admin(auth.uid(), id));

-- BUSINESS_MEMBERS TABLE POLICIES
-- Admins can read all members, staff can only read themselves
CREATE POLICY "Members can read business members"
  ON business_members FOR SELECT
  USING (
    is_business_admin(auth.uid(), business_id)
    OR user_id = auth.uid()
  );

-- Admins can add members OR system can add (for triggers)
CREATE POLICY "Admins can add members"
  ON business_members FOR INSERT
  WITH CHECK (
    is_business_admin(auth.uid(), business_id)
    OR auth.uid() = user_id  -- Allow users to be added to businesses (for initial admin)
  );

-- Admins can update members, staff can update themselves
CREATE POLICY "Members can update business members"
  ON business_members FOR UPDATE
  USING (
    is_business_admin(auth.uid(), business_id)
    OR (user_id = auth.uid() AND role = 'staff')
  );

-- Admins can remove members
CREATE POLICY "Admins can remove members"
  ON business_members FOR DELETE
  USING (is_business_admin(auth.uid(), business_id));

-- SERVICES TABLE POLICIES
-- Members can read services
CREATE POLICY "Members can read services"
  ON services FOR SELECT
  USING (
    is_business_member(auth.uid(), business_id)
    AND deleted_at IS NULL
  );

-- Public can read active services for booking page
CREATE POLICY "Public can read active services"
  ON services FOR SELECT
  USING (active = true AND deleted_at IS NULL);

-- Admins can manage services
CREATE POLICY "Admins can insert services"
  ON services FOR INSERT
  WITH CHECK (is_business_admin(auth.uid(), business_id));

CREATE POLICY "Admins can update services"
  ON services FOR UPDATE
  USING (is_business_admin(auth.uid(), business_id));

CREATE POLICY "Admins can delete services"
  ON services FOR DELETE
  USING (is_business_admin(auth.uid(), business_id));

-- STAFF_SCHEDULES TABLE POLICIES
-- Members can read schedules
CREATE POLICY "Members can read schedules"
  ON staff_schedules FOR SELECT
  USING (is_business_member(auth.uid(), business_id));

-- Admins can manage all schedules
CREATE POLICY "Admins can insert schedules"
  ON staff_schedules FOR INSERT
  WITH CHECK (is_business_admin(auth.uid(), business_id));

CREATE POLICY "Admins can update schedules"
  ON staff_schedules FOR UPDATE
  USING (is_business_admin(auth.uid(), business_id));

CREATE POLICY "Admins can delete schedules"
  ON staff_schedules FOR DELETE
  USING (is_business_admin(auth.uid(), business_id));

-- CUSTOMERS TABLE POLICIES
-- Members can read customers
CREATE POLICY "Members can read customers"
  ON customers FOR SELECT
  USING (
    is_business_member(auth.uid(), business_id)
    AND deleted_at IS NULL
  );

-- Members can create customers
CREATE POLICY "Members can insert customers"
  ON customers FOR INSERT
  WITH CHECK (is_business_member(auth.uid(), business_id));

-- Members can update customers
CREATE POLICY "Members can update customers"
  ON customers FOR UPDATE
  USING (is_business_member(auth.uid(), business_id));

-- Admins can delete customers
CREATE POLICY "Admins can delete customers"
  ON customers FOR DELETE
  USING (is_business_admin(auth.uid(), business_id));

-- APPOINTMENTS TABLE POLICIES
-- Admins can read all appointments, staff can read only their own
CREATE POLICY "Members can read appointments"
  ON appointments FOR SELECT
  USING (
    (is_business_admin(auth.uid(), business_id) OR staff_id = auth.uid())
    AND deleted_at IS NULL
  );

-- Members can create appointments
CREATE POLICY "Members can insert appointments"
  ON appointments FOR INSERT
  WITH CHECK (is_business_member(auth.uid(), business_id));

-- Admins can update all appointments, staff can update only their own
CREATE POLICY "Members can update appointments"
  ON appointments FOR UPDATE
  USING (
    is_business_admin(auth.uid(), business_id)
    OR staff_id = auth.uid()
  );

-- Admins can delete appointments, staff can cancel their own
CREATE POLICY "Members can delete appointments"
  ON appointments FOR DELETE
  USING (
    is_business_admin(auth.uid(), business_id)
    OR staff_id = auth.uid()
  );

-- SUBSCRIPTION_PLANS TABLE POLICIES
-- Everyone can read subscription plans (public)
CREATE POLICY "Anyone can read subscription plans"
  ON subscription_plans FOR SELECT
  USING (active = true);

-- BUSINESS_SUBSCRIPTIONS TABLE POLICIES
-- Admins can read their business subscription
CREATE POLICY "Admins can read their subscription"
  ON business_subscriptions FOR SELECT
  USING (is_business_admin(auth.uid(), business_id));

-- Allow subscription creation (for triggers)
CREATE POLICY "Allow subscription creation"
  ON business_subscriptions FOR INSERT
  WITH CHECK (true);

-- Function to create first business member as admin after business creation
CREATE OR REPLACE FUNCTION create_business_admin_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the creator as admin
  INSERT INTO business_members (business_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_business_created
  AFTER INSERT ON businesses
  FOR EACH ROW EXECUTE FUNCTION create_business_admin_member();

-- Function to create trial subscription after business creation
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER AS $$
DECLARE
  basic_plan_id UUID;
BEGIN
  -- Get the basic plan ID
  SELECT id INTO basic_plan_id
  FROM subscription_plans
  WHERE name = 'Básico'
  LIMIT 1;
  
  -- Create trial subscription
  INSERT INTO business_subscriptions (
    business_id,
    plan_id,
    status,
    trial_ends_at,
    current_period_start,
    current_period_end
  ) VALUES (
    NEW.id,
    basic_plan_id,
    'trialing',
    NOW() + INTERVAL '14 days',
    NOW(),
    NOW() + INTERVAL '14 days'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_business_created_trial
  AFTER INSERT ON businesses
  FOR EACH ROW EXECUTE FUNCTION create_trial_subscription();
