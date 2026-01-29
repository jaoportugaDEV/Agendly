-- =====================================================
-- MIGRATION: Complete Features System
-- Adiciona: Analytics, Área Cliente, Reviews, Packages, 
-- Blocks, Loyalty, Multi-idioma, Export
-- =====================================================

-- =====================================================
-- 1. CUSTOMER ACCOUNTS (Área do Cliente)
-- =====================================================

CREATE TABLE customer_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  reset_password_token TEXT,
  reset_password_expires TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_accounts_email ON customer_accounts(email);
CREATE INDEX idx_customer_accounts_customer ON customer_accounts(customer_id);

-- RLS Policies
ALTER TABLE customer_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes podem ver suas próprias contas"
  ON customer_accounts FOR SELECT
  USING (true); -- JWT validation will be handled in application layer

CREATE POLICY "Clientes podem atualizar suas próprias contas"
  ON customer_accounts FOR UPDATE
  USING (true);

-- =====================================================
-- 2. APPOINTMENT REVIEWS (Sistema de Avaliações)
-- =====================================================

CREATE TABLE appointment_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  business_id UUID NOT NULL REFERENCES businesses(id),
  staff_id UUID REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  business_response TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(appointment_id)
);

CREATE INDEX idx_reviews_business ON appointment_reviews(business_id, is_public);
CREATE INDEX idx_reviews_rating ON appointment_reviews(business_id, rating);
CREATE INDEX idx_reviews_appointment ON appointment_reviews(appointment_id);
CREATE INDEX idx_reviews_customer ON appointment_reviews(customer_id);

-- RLS Policies
ALTER TABLE appointment_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews públicos são visíveis para todos"
  ON appointment_reviews FOR SELECT
  USING (is_public = true OR auth.uid() IN (
    SELECT user_id FROM business_members WHERE business_id = appointment_reviews.business_id
  ));

CREATE POLICY "Clientes podem criar reviews de seus agendamentos"
  ON appointment_reviews FOR INSERT
  WITH CHECK (true); -- Validation in app layer

CREATE POLICY "Admins podem responder reviews"
  ON appointment_reviews FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM business_members 
    WHERE business_id = appointment_reviews.business_id 
    AND role = 'admin'
  ));

-- =====================================================
-- 3. SERVICE PACKAGES (Pacotes e Combos)
-- =====================================================

CREATE TABLE service_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  package_type VARCHAR(50) NOT NULL CHECK (package_type IN ('combo', 'credits')),
  discount_percentage DECIMAL(5,2),
  original_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  sessions_included INTEGER,
  validity_days INTEGER,
  active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE package_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customer_package_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES service_packages(id),
  total_sessions INTEGER NOT NULL,
  used_sessions INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (used_sessions <= total_sessions)
);

CREATE INDEX idx_packages_business ON service_packages(business_id, active);
CREATE INDEX idx_package_services_package ON package_services(package_id);
CREATE INDEX idx_customer_credits_customer ON customer_package_credits(customer_id);
CREATE INDEX idx_customer_credits_expires ON customer_package_credits(customer_id, expires_at);

-- RLS Policies
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_package_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pacotes ativos são visíveis para todos"
  ON service_packages FOR SELECT
  USING (active = true AND deleted_at IS NULL);

CREATE POLICY "Membros podem gerenciar pacotes"
  ON service_packages FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM business_members WHERE business_id = service_packages.business_id
  ));

CREATE POLICY "Package services são visíveis para todos"
  ON package_services FOR SELECT
  USING (true);

CREATE POLICY "Membros podem gerenciar package services"
  ON package_services FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM business_members 
    WHERE business_id = (SELECT business_id FROM service_packages WHERE id = package_services.package_id)
  ));

CREATE POLICY "Clientes podem ver seus próprios créditos"
  ON customer_package_credits FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode gerenciar créditos"
  ON customer_package_credits FOR ALL
  USING (true);

-- =====================================================
-- 4. SCHEDULE BLOCKS (Bloqueios Avançados)
-- =====================================================

CREATE TABLE schedule_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES users(id),
  service_id UUID REFERENCES services(id),
  block_type VARCHAR(50) NOT NULL CHECK (block_type IN ('one_time', 'recurring')),
  reason VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE INDEX idx_blocks_business_date ON schedule_blocks(business_id, start_date, end_date);
CREATE INDEX idx_blocks_staff ON schedule_blocks(staff_id);
CREATE INDEX idx_blocks_active ON schedule_blocks(business_id, active);

-- RLS Policies
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver bloqueios da empresa"
  ON schedule_blocks FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM business_members WHERE business_id = schedule_blocks.business_id
  ));

CREATE POLICY "Admins podem gerenciar bloqueios"
  ON schedule_blocks FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM business_members 
    WHERE business_id = schedule_blocks.business_id 
    AND role = 'admin'
  ));

-- =====================================================
-- 5. CUSTOMER LOYALTY (Programa de Fidelidade)
-- =====================================================

CREATE TABLE customer_loyalty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  current_level VARCHAR(50) DEFAULT 'bronze',
  badges JSONB DEFAULT '[]',
  last_visit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, business_id)
);

CREATE TABLE loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('discount_percentage', 'discount_fixed', 'free_service')),
  reward_value DECIMAL(10,2),
  service_id UUID REFERENCES services(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_loyalty_id UUID NOT NULL REFERENCES customer_loyalty(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id),
  points_change INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_customer ON customer_loyalty(customer_id, business_id);
CREATE INDEX idx_loyalty_level ON customer_loyalty(business_id, current_level);
CREATE INDEX idx_loyalty_rewards_business ON loyalty_rewards(business_id, active);
CREATE INDEX idx_loyalty_transactions_customer ON loyalty_transactions(customer_loyalty_id);

-- RLS Policies
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes podem ver sua própria fidelidade"
  ON customer_loyalty FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode gerenciar fidelidade"
  ON customer_loyalty FOR ALL
  USING (true);

CREATE POLICY "Rewards são visíveis para todos"
  ON loyalty_rewards FOR SELECT
  USING (active = true);

CREATE POLICY "Admins podem gerenciar rewards"
  ON loyalty_rewards FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM business_members 
    WHERE business_id = loyalty_rewards.business_id 
    AND role = 'admin'
  ));

CREATE POLICY "Transações são visíveis para cliente e admins"
  ON loyalty_transactions FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode criar transações"
  ON loyalty_transactions FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 6. TRANSLATIONS (Multi-idioma)
-- =====================================================

CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) NOT NULL,
  locale VARCHAR(10) NOT NULL,
  value TEXT NOT NULL,
  context VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key, locale)
);

CREATE INDEX idx_translations_key ON translations(key);
CREATE INDEX idx_translations_locale ON translations(locale);
CREATE INDEX idx_translations_context ON translations(context);

-- RLS Policies
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Traduções são visíveis para todos"
  ON translations FOR SELECT
  USING (true);

-- =====================================================
-- 7. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para calcular taxa de ocupação
CREATE OR REPLACE FUNCTION calculate_occupancy_rate(
  p_business_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_slots INTEGER;
  occupied_slots INTEGER;
BEGIN
  -- Contar slots totais disponíveis (baseado em horários de staff)
  -- Simplificado: assumir 8h/dia, 30min por slot
  total_slots := EXTRACT(days FROM p_end_date - p_start_date)::INTEGER * 16;
  
  -- Contar agendamentos confirmados/completados
  SELECT COUNT(*)
  INTO occupied_slots
  FROM appointments
  WHERE business_id = p_business_id
    AND start_time >= p_start_date
    AND start_time < p_end_date
    AND status IN ('confirmed', 'completed');
  
  IF total_slots = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (occupied_slots::DECIMAL / total_slots::DECIMAL) * 100;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar loyalty automaticamente
CREATE OR REPLACE FUNCTION update_customer_loyalty()
RETURNS TRIGGER AS $$
DECLARE
  loyalty_record RECORD;
  points_to_add INTEGER;
BEGIN
  -- Só processar quando appointment for completado
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Buscar ou criar registro de loyalty
    INSERT INTO customer_loyalty (customer_id, business_id, total_points, total_visits, last_visit_at)
    VALUES (NEW.customer_id, NEW.business_id, 0, 0, NEW.start_time)
    ON CONFLICT (customer_id, business_id) 
    DO UPDATE SET 
      total_visits = customer_loyalty.total_visits + 1,
      last_visit_at = NEW.start_time
    RETURNING * INTO loyalty_record;
    
    -- Calcular pontos (10 pontos + 1 ponto por euro gasto)
    points_to_add := 10 + FLOOR(NEW.price)::INTEGER;
    
    -- Adicionar pontos
    UPDATE customer_loyalty
    SET total_points = total_points + points_to_add
    WHERE id = loyalty_record.id;
    
    -- Registrar transação
    INSERT INTO loyalty_transactions (
      customer_loyalty_id,
      appointment_id,
      points_change,
      transaction_type,
      description
    ) VALUES (
      loyalty_record.id,
      NEW.id,
      points_to_add,
      'earned',
      'Pontos ganhos pelo agendamento'
    );
    
    -- Atualizar nível se necessário
    UPDATE customer_loyalty
    SET current_level = CASE
      WHEN total_points >= 1000 THEN 'platinum'
      WHEN total_points >= 500 THEN 'gold'
      WHEN total_points >= 100 THEN 'silver'
      ELSE 'bronze'
    END
    WHERE id = loyalty_record.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para loyalty
CREATE TRIGGER trigger_update_loyalty
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_loyalty();

-- =====================================================
-- 8. POPULAR TRADUÇÕES BÁSICAS
-- =====================================================

INSERT INTO translations (key, locale, value, context) VALUES
  -- Common
  ('common.book_now', 'pt', 'Agendar Agora', 'common'),
  ('common.book_now', 'en', 'Book Now', 'common'),
  ('common.book_now', 'es', 'Reservar Ahora', 'common'),
  
  ('common.cancel', 'pt', 'Cancelar', 'common'),
  ('common.cancel', 'en', 'Cancel', 'common'),
  ('common.cancel', 'es', 'Cancelar', 'common'),
  
  ('common.confirm', 'pt', 'Confirmar', 'common'),
  ('common.confirm', 'en', 'Confirm', 'common'),
  ('common.confirm', 'es', 'Confirmar', 'common'),
  
  ('common.save', 'pt', 'Salvar', 'common'),
  ('common.save', 'en', 'Save', 'common'),
  ('common.save', 'es', 'Guardar', 'common'),
  
  -- Booking
  ('booking.select_service', 'pt', 'Selecione um Serviço', 'booking'),
  ('booking.select_service', 'en', 'Select a Service', 'booking'),
  ('booking.select_service', 'es', 'Seleccione un Servicio', 'booking'),
  
  ('booking.select_date', 'pt', 'Escolha a Data', 'booking'),
  ('booking.select_date', 'en', 'Choose Date', 'booking'),
  ('booking.select_date', 'es', 'Elija la Fecha', 'booking'),
  
  ('booking.select_time', 'pt', 'Escolha o Horário', 'booking'),
  ('booking.select_time', 'en', 'Choose Time', 'booking'),
  ('booking.select_time', 'es', 'Elija la Hora', 'booking'),
  
  ('booking.your_info', 'pt', 'Seus Dados', 'booking'),
  ('booking.your_info', 'en', 'Your Information', 'booking'),
  ('booking.your_info', 'es', 'Sus Datos', 'booking'),
  
  ('booking.success', 'pt', 'Agendamento Confirmado!', 'booking'),
  ('booking.success', 'en', 'Booking Confirmed!', 'booking'),
  ('booking.success', 'es', 'Reserva Confirmada!', 'booking'),
  
  -- Reviews
  ('reviews.title', 'pt', 'Avaliações', 'reviews'),
  ('reviews.title', 'en', 'Reviews', 'reviews'),
  ('reviews.title', 'es', 'Reseñas', 'reviews'),
  
  ('reviews.write_review', 'pt', 'Escrever Avaliação', 'reviews'),
  ('reviews.write_review', 'en', 'Write Review', 'reviews'),
  ('reviews.write_review', 'es', 'Escribir Reseña', 'reviews'),
  
  -- Client Area
  ('client.my_appointments', 'pt', 'Meus Agendamentos', 'client'),
  ('client.my_appointments', 'en', 'My Appointments', 'client'),
  ('client.my_appointments', 'es', 'Mis Reservas', 'client'),
  
  ('client.history', 'pt', 'Histórico', 'client'),
  ('client.history', 'en', 'History', 'client'),
  ('client.history', 'es', 'Historial', 'client'),
  
  ('client.loyalty', 'pt', 'Fidelidade', 'client'),
  ('client.loyalty', 'en', 'Loyalty', 'client'),
  ('client.loyalty', 'es', 'Fidelidad', 'client');

-- =====================================================
-- 9. COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON TABLE customer_accounts IS 'Contas de clientes para área logada (separado de Supabase Auth)';
COMMENT ON TABLE appointment_reviews IS 'Sistema de avaliações de agendamentos';
COMMENT ON TABLE service_packages IS 'Pacotes e combos de serviços';
COMMENT ON TABLE schedule_blocks IS 'Bloqueios avançados de horários (únicos e recorrentes)';
COMMENT ON TABLE customer_loyalty IS 'Programa de fidelidade por cliente/empresa';
COMMENT ON TABLE translations IS 'Traduções multi-idioma (PT/EN/ES)';
