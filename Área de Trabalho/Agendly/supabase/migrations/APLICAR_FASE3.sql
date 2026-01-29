-- ============================================
-- FASE 3 - AGENDAMENTO PÚBLICO
-- Execute este script completo no Supabase SQL Editor
-- ============================================

-- PARTE 1: Adicionar campo source aos appointments
-- ============================================

-- Create enum for appointment source
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_source') THEN
    CREATE TYPE appointment_source AS ENUM ('internal', 'public');
  END IF;
END $$;

-- Add source column to appointments table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'source'
  ) THEN
    ALTER TABLE appointments ADD COLUMN source appointment_source DEFAULT 'internal' NOT NULL;
  END IF;
END $$;

-- Create index for filtering by source
CREATE INDEX IF NOT EXISTS idx_appointments_source 
ON appointments(business_id, source) 
WHERE deleted_at IS NULL;

-- Update existing appointments to be 'internal'
UPDATE appointments SET source = 'internal' WHERE source IS NULL;

-- PARTE 2: Políticas RLS para Agendamento Público
-- ============================================

-- BUSINESSES - Public read access by slug
DROP POLICY IF EXISTS "Public can read businesses by slug" ON businesses;
CREATE POLICY "Public can read businesses by slug"
  ON businesses FOR SELECT
  USING (active = true AND deleted_at IS NULL);

-- BUSINESS_MEMBERS - Public read for staff info
DROP POLICY IF EXISTS "Public can read active staff" ON business_members;
CREATE POLICY "Public can read active staff"
  ON business_members FOR SELECT
  USING (active = true);

-- STAFF_SCHEDULES - Public read for availability
DROP POLICY IF EXISTS "Public can read staff schedules" ON staff_schedules;
CREATE POLICY "Public can read staff schedules"
  ON staff_schedules FOR SELECT
  USING (active = true);

-- CUSTOMERS - Public insert for booking
DROP POLICY IF EXISTS "Public can create customers for booking" ON customers;
CREATE POLICY "Public can create customers for booking"
  ON customers FOR INSERT
  WITH CHECK (true);

-- APPOINTMENTS - Public insert
DROP POLICY IF EXISTS "Public can create public appointments" ON appointments;
CREATE POLICY "Public can create public appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    source = 'public'
    AND business_id IN (
      SELECT id FROM businesses WHERE active = true AND deleted_at IS NULL
    )
  );

-- USERS - Public read for staff names
DROP POLICY IF EXISTS "Public can read staff user profiles" ON users;
CREATE POLICY "Public can read staff user profiles"
  ON users FOR SELECT
  USING (
    id IN (
      SELECT user_id 
      FROM business_members 
      WHERE active = true
    )
  );

-- ============================================
-- VERIFICAÇÕES
-- ============================================

-- Verificar se o campo source foi adicionado
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name = 'source';

-- Verificar políticas RLS criadas
SELECT 
  schemaname, 
  tablename, 
  policyname,
  cmd
FROM pg_policies
WHERE policyname LIKE '%Public%' OR policyname LIKE '%public%'
ORDER BY tablename, policyname;

-- Mostrar resumo
SELECT 
  'FASE 3 - Migrations aplicadas com sucesso!' as status,
  NOW() as aplicado_em;
