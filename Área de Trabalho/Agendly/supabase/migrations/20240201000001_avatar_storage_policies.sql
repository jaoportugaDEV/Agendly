-- Políticas RLS para upload de avatares
-- Migration: 20240201000001_avatar_storage_policies.sql
-- Descrição: Configura permissões de storage para avatares de usuários e clientes

-- Permitir usuários autenticados fazerem upload de seu próprio avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'business-media' AND
    (storage.foldername(name))[1] = 'profiles' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Permitir usuários autenticados atualizarem seu próprio avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'business-media' AND
    (storage.foldername(name))[1] = 'profiles' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Permitir usuários autenticados deletarem seu próprio avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'business-media' AND
    (storage.foldername(name))[1] = 'profiles' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Permitir clientes (via customer_accounts) fazerem upload de avatar
-- Nota: customer_accounts tem uma relação com customers através do customer_id
CREATE POLICY "Customers can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'business-media' AND
    (storage.foldername(name))[1] = 'profiles' AND
    (storage.foldername(name))[2] LIKE 'customer-%'
  );

-- Permitir clientes atualizarem seu próprio avatar
CREATE POLICY "Customers can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'business-media' AND
    (storage.foldername(name))[1] = 'profiles' AND
    (storage.foldername(name))[2] LIKE 'customer-%'
  );

-- Permitir clientes deletarem seu próprio avatar
CREATE POLICY "Customers can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'business-media' AND
    (storage.foldername(name))[1] = 'profiles' AND
    (storage.foldername(name))[2] LIKE 'customer-%'
  );

-- Permitir leitura pública de avatares (necessário para exibição)
-- Nota: a política "Public can view business media" já existe e cobre isso
-- mas vamos adicionar uma específica para profiles para maior clareza
CREATE POLICY "Public can view profile avatars"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'business-media' AND
    (storage.foldername(name))[1] = 'profiles'
  );
