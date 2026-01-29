-- Criar tipo ENUM para tipo de promoção
CREATE TYPE promotion_type AS ENUM ('service', 'package');

-- Criar tipo ENUM para tipo de recorrência
CREATE TYPE recurrence_type AS ENUM ('recurring', 'date_range');

-- Criar tabela de promoções
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  promotion_type promotion_type NOT NULL,
  target_id UUID NOT NULL,
  promotional_price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) NOT NULL,
  weekdays INTEGER[] NOT NULL,
  recurrence_type recurrence_type NOT NULL DEFAULT 'recurring',
  start_date DATE,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_promotional_price CHECK (promotional_price > 0 AND promotional_price < original_price),
  CONSTRAINT valid_discount CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  CONSTRAINT valid_weekdays CHECK (array_length(weekdays, 1) > 0),
  CONSTRAINT valid_date_range CHECK (
    (recurrence_type = 'recurring' AND start_date IS NULL AND end_date IS NULL) OR
    (recurrence_type = 'date_range' AND start_date IS NOT NULL AND end_date IS NOT NULL AND end_date > start_date)
  )
);

-- Índices para performance
CREATE INDEX idx_promotions_business ON promotions(business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_promotions_active ON promotions(business_id, active) WHERE deleted_at IS NULL AND active = true;
CREATE INDEX idx_promotions_target ON promotions(target_id, promotion_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_promotions_weekdays ON promotions USING GIN (weekdays) WHERE deleted_at IS NULL;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar promoções
CREATE POLICY "Admins can manage promotions"
  ON promotions
  FOR ALL
  USING (is_business_admin(auth.uid(), business_id))
  WITH CHECK (is_business_admin(auth.uid(), business_id));

-- Membros podem visualizar promoções do negócio
CREATE POLICY "Members can view promotions"
  ON promotions
  FOR SELECT
  USING (
    is_business_member(auth.uid(), business_id)
    AND deleted_at IS NULL
  );

-- Público pode visualizar promoções ativas
CREATE POLICY "Public can view active promotions"
  ON promotions
  FOR SELECT
  USING (
    active = true 
    AND deleted_at IS NULL
    AND (
      recurrence_type = 'recurring' OR
      (recurrence_type = 'date_range' AND CURRENT_DATE BETWEEN start_date AND end_date)
    )
  );

-- Comentários para documentação
COMMENT ON TABLE promotions IS 'Armazena promoções de serviços e pacotes por dia da semana';
COMMENT ON COLUMN promotions.weekdays IS 'Array de dias da semana: 0=domingo, 1=segunda, ..., 6=sábado';
COMMENT ON COLUMN promotions.target_id IS 'ID do serviço ou pacote (dependendo do promotion_type)';
COMMENT ON COLUMN promotions.recurrence_type IS 'recurring = sempre nos dias especificados, date_range = apenas no período definido';
