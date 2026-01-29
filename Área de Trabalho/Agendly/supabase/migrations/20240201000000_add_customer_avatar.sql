-- Adicionar campo avatar_url na tabela customers
-- Migration: 20240201000000_add_customer_avatar.sql
-- Descrição: Adiciona suporte para fotos de perfil de clientes

-- Adicionar campo avatar_url
ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comentário na coluna
COMMENT ON COLUMN customers.avatar_url IS 'URL da foto de perfil do cliente no Supabase Storage';

-- Índice para melhorar performance em queries que filtram por avatar
CREATE INDEX IF NOT EXISTS idx_customers_avatar_url ON customers(avatar_url) WHERE avatar_url IS NOT NULL;

-- Atualizar timestamp de updated_at quando avatar_url mudar
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar se trigger já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_customers_avatar_timestamp'
  ) THEN
    CREATE TRIGGER update_customers_avatar_timestamp
      BEFORE UPDATE OF avatar_url ON customers
      FOR EACH ROW
      EXECUTE FUNCTION update_customers_updated_at();
  END IF;
END $$;
