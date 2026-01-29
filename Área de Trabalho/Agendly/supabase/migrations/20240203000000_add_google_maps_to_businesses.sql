-- Adicionar campo para link do Google Maps e endereço manual
-- Migration: 20240203000000_add_google_maps_to_businesses.sql
-- Descrição: Adiciona campos google_maps_url e address na tabela business_public_profile para exibir mapa e endereço no site público

-- Adicionar campo para link do Google Maps na tabela de perfil público
ALTER TABLE business_public_profile 
ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- Adicionar campo para endereço manual (opcional, caso estabelecimento não esteja no Google)
ALTER TABLE business_public_profile 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Comentários explicativos
COMMENT ON COLUMN business_public_profile.google_maps_url IS 'URL do Google Maps para exibir localização no site público (opcional)';
COMMENT ON COLUMN business_public_profile.address IS 'Endereço manual do estabelecimento para exibir no site público (opcional)';
