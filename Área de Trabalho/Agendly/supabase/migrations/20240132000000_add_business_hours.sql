-- Adicionar campos de horário de funcionamento padrão à tabela businesses
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS default_opening_time TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS default_closing_time TIME DEFAULT '18:00:00',
ADD COLUMN IF NOT EXISTS custom_hours_enabled BOOLEAN DEFAULT false;

-- Criar tabela de horários personalizados por dia da semana
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT business_hours_unique UNIQUE (business_id, day_of_week),
  CONSTRAINT check_hours_valid CHECK (closing_time > opening_time OR is_closed = true)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_business_hours_business ON business_hours(business_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_day ON business_hours(day_of_week);

-- RLS Policies para business_hours
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública dos horários (para site público)
CREATE POLICY "Public can view business hours" ON business_hours
  FOR SELECT
  USING (true);

-- Apenas admins podem inserir horários
CREATE POLICY "Admins can insert business hours" ON business_hours
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = business_hours.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'admin'
      AND business_members.active = true
    )
  );

-- Apenas admins podem atualizar horários
CREATE POLICY "Admins can update business hours" ON business_hours
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = business_hours.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'admin'
      AND business_members.active = true
    )
  );

-- Apenas admins podem deletar horários
CREATE POLICY "Admins can delete business hours" ON business_hours
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = business_hours.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'admin'
      AND business_members.active = true
    )
  );

-- Comentários
COMMENT ON COLUMN businesses.default_opening_time IS 'Horário padrão de abertura do estabelecimento';
COMMENT ON COLUMN businesses.default_closing_time IS 'Horário padrão de fechamento do estabelecimento';
COMMENT ON COLUMN businesses.custom_hours_enabled IS 'Se true, usa horários personalizados por dia da semana';
COMMENT ON TABLE business_hours IS 'Horários de funcionamento personalizados por dia da semana';
