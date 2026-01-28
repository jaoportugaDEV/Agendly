-- Melhorias no sistema de bloqueios de horário

-- 1. Permitir bloqueios para "todos os funcionários" (staff_id NULL)
ALTER TABLE schedule_blocks 
ALTER COLUMN staff_id DROP NOT NULL;

-- 2. Adicionar campo para identificar se é para todos
ALTER TABLE schedule_blocks
ADD COLUMN IF NOT EXISTS applies_to_all BOOLEAN DEFAULT false;

-- 3. Adicionar índice para bloqueios que aplicam a todos
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_applies_to_all 
ON schedule_blocks(business_id, applies_to_all) 
WHERE applies_to_all = true;

-- 4. Atualizar RLS Policies para permitir staff criar bloqueios para si mesmo

-- Permitir staff inserir bloqueios apenas para si mesmo
CREATE POLICY "Staff can insert blocks for themselves" ON schedule_blocks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = schedule_blocks.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.active = true
      AND (
        -- Admin pode criar para qualquer um
        business_members.role = 'admin'
        OR 
        -- Staff só pode criar para si mesmo
        (business_members.role = 'staff' AND schedule_blocks.staff_id = auth.uid())
      )
    )
  );

-- Permitir staff atualizar seus próprios bloqueios
CREATE POLICY "Staff can update their own blocks" ON schedule_blocks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = schedule_blocks.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.active = true
      AND (
        -- Admin pode atualizar qualquer bloqueio
        business_members.role = 'admin'
        OR 
        -- Staff só pode atualizar seus próprios bloqueios
        (business_members.role = 'staff' AND schedule_blocks.staff_id = auth.uid())
      )
    )
  );

-- Permitir staff deletar seus próprios bloqueios
CREATE POLICY "Staff can delete their own blocks" ON schedule_blocks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = schedule_blocks.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.active = true
      AND (
        -- Admin pode deletar qualquer bloqueio
        business_members.role = 'admin'
        OR 
        -- Staff só pode deletar seus próprios bloqueios
        (business_members.role = 'staff' AND schedule_blocks.staff_id = auth.uid())
      )
    )
  );

-- Remover as políticas antigas mais restritivas (apenas admin)
DROP POLICY IF EXISTS "Admins can insert blocks" ON schedule_blocks;
DROP POLICY IF EXISTS "Admins can update blocks" ON schedule_blocks;
DROP POLICY IF EXISTS "Admins can delete blocks" ON schedule_blocks;

-- Comentários
COMMENT ON COLUMN schedule_blocks.applies_to_all IS 'Se true, este bloqueio aplica-se a todos os funcionários';
COMMENT ON COLUMN schedule_blocks.staff_id IS 'ID do funcionário específico, ou NULL se applies_to_all=true';
