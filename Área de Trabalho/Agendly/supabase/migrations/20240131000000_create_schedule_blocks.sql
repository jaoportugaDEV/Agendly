-- Criar tabela de bloqueios de horário
CREATE TABLE IF NOT EXISTS schedule_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  color VARCHAR(7) DEFAULT '#ef4444',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(20), -- 'daily', 'weekly', 'monthly'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_business ON schedule_blocks(business_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_staff ON schedule_blocks(staff_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_time ON schedule_blocks(start_time, end_time);

-- RLS Policies
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view blocks from their businesses" ON schedule_blocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = schedule_blocks.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.active = true
    )
  );

CREATE POLICY "Admins can insert blocks" ON schedule_blocks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = schedule_blocks.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'admin'
      AND business_members.active = true
    )
  );

CREATE POLICY "Admins can update blocks" ON schedule_blocks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = schedule_blocks.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'admin'
      AND business_members.active = true
    )
  );

CREATE POLICY "Admins can delete blocks" ON schedule_blocks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = schedule_blocks.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'admin'
      AND business_members.active = true
    )
  );
