-- Sistema de Despesas da Empresa
-- Migration: 20240202000001_create_expenses_system.sql
-- Descrição: Cria tabelas para gestão de despesas e categorias customizadas

-- Enum para tipo de despesa
CREATE TYPE expense_type AS ENUM (
  'utilities',      -- Água, Luz, Gás
  'rent',           -- Aluguel
  'salary',         -- Salários
  'products',       -- Produtos/Materiais
  'maintenance',    -- Manutenção
  'marketing',      -- Marketing
  'taxes',          -- Impostos
  'insurance',      -- Seguros
  'custom'          -- Customizado
);

-- Enum para frequência
CREATE TYPE expense_frequency AS ENUM ('once', 'monthly', 'yearly');

-- Tabela de categorias customizadas de despesas
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_category_name UNIQUE(business_id, name)
);

-- Comentários
COMMENT ON TABLE expense_categories IS 'Categorias customizadas de despesas por empresa';
COMMENT ON COLUMN expense_categories.color IS 'Cor em HEX para identificação visual';

-- Tabela de despesas
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Categoria
  expense_type expense_type NOT NULL,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  
  -- Valores
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL,
  
  -- Frequência e datas
  frequency expense_frequency DEFAULT 'once',
  expense_date DATE NOT NULL,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  
  -- Informações
  description TEXT NOT NULL,
  notes TEXT,
  receipt_url TEXT,
  
  -- Status
  is_paid BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE expenses IS 'Despesas da empresa';
COMMENT ON COLUMN expenses.expense_type IS 'Tipo de despesa (pré-definido ou custom)';
COMMENT ON COLUMN expenses.category_id IS 'Categoria customizada (apenas se expense_type = custom)';
COMMENT ON COLUMN expenses.frequency IS 'Frequência da despesa (única, mensal, anual)';
COMMENT ON COLUMN expenses.is_recurring IS 'Se é uma despesa recorrente';
COMMENT ON COLUMN expenses.receipt_url IS 'URL do comprovante no Supabase Storage';

-- Índices para performance
CREATE INDEX idx_expenses_business ON expenses(business_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_type ON expenses(expense_type);
CREATE INDEX idx_expenses_paid ON expenses(is_paid);
CREATE INDEX idx_expenses_category ON expenses(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_expenses_due_date ON expenses(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_expenses_recurring ON expenses(business_id, is_recurring) WHERE is_recurring = true;

CREATE INDEX idx_expense_categories_business ON expense_categories(business_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

CREATE TRIGGER trigger_expense_categories_updated_at
  BEFORE UPDATE ON expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

-- Função helper para obter total de despesas por período
CREATE OR REPLACE FUNCTION get_expenses_total(
  p_business_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_paid_only BOOLEAN DEFAULT true
)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(amount), 0)
    FROM expenses
    WHERE business_id = p_business_id
      AND expense_date BETWEEN p_start_date AND p_end_date
      AND (NOT p_paid_only OR is_paid = true)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Função helper para obter despesas por categoria
CREATE OR REPLACE FUNCTION get_expenses_by_category(
  p_business_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  expense_type expense_type,
  category_name VARCHAR(255),
  total DECIMAL(10, 2),
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.expense_type,
    COALESCE(ec.name, e.expense_type::VARCHAR(255)) as category_name,
    SUM(e.amount) as total,
    COUNT(*) as count
  FROM expenses e
  LEFT JOIN expense_categories ec ON e.category_id = ec.id
  WHERE e.business_id = p_business_id
    AND e.expense_date BETWEEN p_start_date AND p_end_date
    AND e.is_paid = true
  GROUP BY e.expense_type, ec.name
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql STABLE;
