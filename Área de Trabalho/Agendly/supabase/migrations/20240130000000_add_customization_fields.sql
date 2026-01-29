-- Adicionar campos de customização de marca
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS custom_colors JSONB DEFAULT '{
  "primary": "221.2 83.2% 53.3%",
  "secondary": "210 40% 96.1%",
  "accent": "210 40% 96.1%"
}'::jsonb;

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_businesses_custom_colors ON businesses USING gin(custom_colors);

-- Comentários
COMMENT ON COLUMN businesses.custom_colors IS 'Cores customizadas da marca em formato HSL (hue saturation lightness)';
COMMENT ON COLUMN businesses.logo_url IS 'URL do logo da empresa (Supabase Storage ou URL externa)';
