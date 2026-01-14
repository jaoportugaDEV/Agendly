-- Adicionar campos para controle de ausências de staff
ALTER TABLE business_members
ADD COLUMN IF NOT EXISTS absence_reason TEXT,
ADD COLUMN IF NOT EXISTS absence_start_date DATE,
ADD COLUMN IF NOT EXISTS absence_end_date DATE,
ADD COLUMN IF NOT EXISTS absence_notes TEXT;

-- Comentários explicativos
COMMENT ON COLUMN business_members.absence_reason IS 'Motivo da ausência: ferias, folga, doenca, outro';
COMMENT ON COLUMN business_members.absence_start_date IS 'Data de início da ausência';
COMMENT ON COLUMN business_members.absence_end_date IS 'Data de fim da ausência (opcional para ausências indefinidas)';
COMMENT ON COLUMN business_members.absence_notes IS 'Observações adicionais sobre a ausência';
