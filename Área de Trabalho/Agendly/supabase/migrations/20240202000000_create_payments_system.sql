-- Sistema de Pagamentos e Parcelas
-- Migration: 20240202000000_create_payments_system.sql
-- Descrição: Cria tabelas para gestão de pagamentos e parcelas de agendamentos

-- Enum para status de pagamento
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'installment', 'refunded', 'cancelled');

-- Enum para método de pagamento
CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'pix', 'transfer', 'other');

-- Tabela de pagamentos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Valores
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) NOT NULL,
  
  -- Pagamento
  payment_status payment_status DEFAULT 'pending',
  payment_method payment_method,
  is_installment BOOLEAN DEFAULT false,
  installment_count INTEGER,
  
  -- Datas
  paid_at TIMESTAMPTZ,
  due_date DATE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_payment_per_appointment UNIQUE(appointment_id),
  CONSTRAINT check_installment_count CHECK (
    (is_installment = false) OR 
    (is_installment = true AND installment_count >= 2 AND installment_count <= 12)
  )
);

-- Comentários
COMMENT ON TABLE payments IS 'Registro de pagamentos de agendamentos';
COMMENT ON COLUMN payments.total_amount IS 'Valor total do agendamento';
COMMENT ON COLUMN payments.paid_amount IS 'Valor já pago (calculado automaticamente para parcelas)';
COMMENT ON COLUMN payments.is_installment IS 'Indica se é pagamento parcelado';
COMMENT ON COLUMN payments.installment_count IS 'Número de parcelas (se parcelado)';

-- Tabela de parcelas
CREATE TABLE payment_installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Parcela
  installment_number INTEGER NOT NULL,
  installment_amount DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  due_date DATE NOT NULL,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_installment UNIQUE(payment_id, installment_number),
  CONSTRAINT check_installment_number CHECK (installment_number >= 1)
);

-- Comentários
COMMENT ON TABLE payment_installments IS 'Parcelas de pagamentos parcelados';
COMMENT ON COLUMN payment_installments.installment_number IS 'Número da parcela (1, 2, 3...)';
COMMENT ON COLUMN payment_installments.due_date IS 'Data de vencimento da parcela';

-- Índices para performance
CREATE INDEX idx_payments_business ON payments(business_id);
CREATE INDEX idx_payments_appointment ON payments(appointment_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_due_date ON payments(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_installments_payment ON payment_installments(payment_id);
CREATE INDEX idx_installments_business ON payment_installments(business_id);
CREATE INDEX idx_installments_status ON payment_installments(status);
CREATE INDEX idx_installments_due_date ON payment_installments(due_date);
CREATE INDEX idx_installments_pending ON payment_installments(business_id, status) WHERE status = 'pending';

-- Função para atualizar payment.paid_amount quando installments são pagas
CREATE OR REPLACE FUNCTION update_payment_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(10, 2);
  v_pending_count INTEGER;
BEGIN
  -- Recalcular total pago
  SELECT COALESCE(SUM(installment_amount), 0), COUNT(*) FILTER (WHERE status != 'paid')
  INTO v_total_paid, v_pending_count
  FROM payment_installments
  WHERE payment_id = NEW.payment_id;
  
  -- Atualizar payment
  UPDATE payments
  SET 
    paid_amount = v_total_paid,
    payment_status = CASE
      WHEN v_pending_count = 0 THEN 'paid'::payment_status
      ELSE 'installment'::payment_status
    END,
    paid_at = CASE
      WHEN v_pending_count = 0 THEN NOW()
      ELSE paid_at
    END,
    updated_at = NOW()
  WHERE id = NEW.payment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar quando status de parcela mudar
CREATE TRIGGER trigger_update_payment_amount
  AFTER UPDATE OF status ON payment_installments
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION update_payment_amount();

-- Trigger para atualizar quando parcela for paga pela primeira vez
CREATE TRIGGER trigger_update_payment_amount_insert
  AFTER INSERT ON payment_installments
  FOR EACH ROW
  WHEN (NEW.status = 'paid')
  EXECUTE FUNCTION update_payment_amount();

-- Função helper para verificar se há parcelas vencidas
CREATE OR REPLACE FUNCTION has_overdue_installments(p_appointment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM payment_installments
    WHERE appointment_id = p_appointment_id
      AND status = 'pending'
      AND due_date < CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Função helper para obter próxima parcela vencida
CREATE OR REPLACE FUNCTION get_next_installment_due(p_appointment_id UUID)
RETURNS DATE AS $$
BEGIN
  RETURN (
    SELECT due_date
    FROM payment_installments
    WHERE appointment_id = p_appointment_id
      AND status = 'pending'
    ORDER BY due_date ASC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;
