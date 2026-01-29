-- Políticas RLS para Sistema Financeiro
-- Migration: 20240202000002_financial_rls_policies.sql
-- Descrição: Define políticas de segurança para payments, installments, expenses

-- Habilitar RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA PAYMENTS
-- ============================================

-- Admins podem visualizar todos os pagamentos da empresa
CREATE POLICY "Business admins can view payments"
  ON payments FOR SELECT
  USING (is_business_admin(auth.uid(), business_id));

-- Admins e staff podem visualizar pagamentos relacionados aos seus agendamentos
CREATE POLICY "Staff can view own payments"
  ON payments FOR SELECT
  USING (
    is_business_member(auth.uid(), business_id) AND
    appointment_id IN (
      SELECT id FROM appointments 
      WHERE staff_id = auth.uid()
    )
  );

-- Apenas admins podem criar pagamentos
CREATE POLICY "Business admins can create payments"
  ON payments FOR INSERT
  WITH CHECK (is_business_admin(auth.uid(), business_id));

-- Apenas admins podem atualizar pagamentos
CREATE POLICY "Business admins can update payments"
  ON payments FOR UPDATE
  USING (is_business_admin(auth.uid(), business_id));

-- Apenas admins podem deletar pagamentos
CREATE POLICY "Business admins can delete payments"
  ON payments FOR DELETE
  USING (is_business_admin(auth.uid(), business_id));

-- ============================================
-- POLÍTICAS PARA PAYMENT_INSTALLMENTS
-- ============================================

-- Admins podem visualizar todas as parcelas
CREATE POLICY "Business admins can view installments"
  ON payment_installments FOR SELECT
  USING (is_business_admin(auth.uid(), business_id));

-- Staff pode visualizar parcelas dos seus agendamentos
CREATE POLICY "Staff can view own installments"
  ON payment_installments FOR SELECT
  USING (
    is_business_member(auth.uid(), business_id) AND
    appointment_id IN (
      SELECT id FROM appointments 
      WHERE staff_id = auth.uid()
    )
  );

-- Apenas admins podem criar parcelas (via trigger automático)
CREATE POLICY "Business admins can create installments"
  ON payment_installments FOR INSERT
  WITH CHECK (is_business_admin(auth.uid(), business_id));

-- Apenas admins podem atualizar parcelas
CREATE POLICY "Business admins can update installments"
  ON payment_installments FOR UPDATE
  USING (is_business_admin(auth.uid(), business_id));

-- Apenas admins podem deletar parcelas
CREATE POLICY "Business admins can delete installments"
  ON payment_installments FOR DELETE
  USING (is_business_admin(auth.uid(), business_id));

-- ============================================
-- POLÍTICAS PARA EXPENSES
-- ============================================

-- Admins podem visualizar todas as despesas
CREATE POLICY "Business admins can view expenses"
  ON expenses FOR SELECT
  USING (is_business_admin(auth.uid(), business_id));

-- Apenas admins podem criar despesas
CREATE POLICY "Business admins can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (is_business_admin(auth.uid(), business_id));

-- Apenas admins podem atualizar despesas
CREATE POLICY "Business admins can update expenses"
  ON expenses FOR UPDATE
  USING (is_business_admin(auth.uid(), business_id));

-- Apenas admins podem deletar despesas
CREATE POLICY "Business admins can delete expenses"
  ON expenses FOR DELETE
  USING (is_business_admin(auth.uid(), business_id));

-- ============================================
-- POLÍTICAS PARA EXPENSE_CATEGORIES
-- ============================================

-- Membros podem visualizar categorias da empresa
CREATE POLICY "Business members can view expense categories"
  ON expense_categories FOR SELECT
  USING (is_business_member(auth.uid(), business_id));

-- Apenas admins podem criar categorias
CREATE POLICY "Business admins can create expense categories"
  ON expense_categories FOR INSERT
  WITH CHECK (is_business_admin(auth.uid(), business_id));

-- Apenas admins podem atualizar categorias
CREATE POLICY "Business admins can update expense categories"
  ON expense_categories FOR UPDATE
  USING (is_business_admin(auth.uid(), business_id));

-- Apenas admins podem deletar categorias
CREATE POLICY "Business admins can delete expense categories"
  ON expense_categories FOR DELETE
  USING (is_business_admin(auth.uid(), business_id));
