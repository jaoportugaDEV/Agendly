# 🔧 Correção do Erro de RLS ao Criar Empresa

## ❌ Erro
```
new row violates row-level security policy for table "businesses"
```

## 🔍 Causa
As políticas RLS tinham uma dependência circular: para criar o primeiro membro (admin) da empresa através do trigger, o usuário já precisaria ser admin, o que é impossível!

## ✅ Solução

Execute o seguinte SQL no **SQL Editor** do Supabase:

### Opção 1: Script Completo (Recomendado)

```sql
-- Fix RLS policies for business_members and business_subscriptions
-- This fixes the circular dependency issue when creating the first business

-- Drop and recreate the business_members INSERT policy
DROP POLICY IF EXISTS "Admins can add members" ON business_members;

CREATE POLICY "Admins can add members"
  ON business_members FOR INSERT
  WITH CHECK (
    is_business_admin(auth.uid(), business_id)
    OR auth.uid() = user_id  -- Allow users to be added to businesses (for initial admin)
  );

-- Add INSERT policy for business_subscriptions (was missing)
DROP POLICY IF EXISTS "Allow subscription creation" ON business_subscriptions;

CREATE POLICY "Allow subscription creation"
  ON business_subscriptions FOR INSERT
  WITH CHECK (true);
```

### Opção 2: Via Migration File

Se você estiver usando Supabase CLI:

```bash
# O arquivo já foi criado em: supabase/migrations/20240101000002_fix_rls_policies.sql
supabase db push
```

## 📝 Passo a Passo (Via Dashboard)

1. Acesse seu projeto no Supabase Dashboard
2. Vá em **SQL Editor** (no menu lateral)
3. Clique em **New query**
4. Cole o script SQL acima
5. Clique em **Run** ou pressione `Ctrl+Enter`

## ✅ Verificação

Após executar o script, tente novamente:

1. Acesse http://localhost:3000
2. Faça login
3. Vá para o onboarding
4. Preencha os dados da empresa
5. Clique em **Criar Empresa**

Agora deve funcionar! 🎉

## 🔐 O que foi Corrigido?

### Política `business_members` INSERT
**Antes:**
```sql
WITH CHECK (is_business_admin(auth.uid(), business_id))
```
❌ Problema: Usuário precisa ser admin para se tornar admin!

**Depois:**
```sql
WITH CHECK (
  is_business_admin(auth.uid(), business_id)
  OR auth.uid() = user_id
)
```
✅ Solução: Usuário pode ser adicionado como membro se for ele mesmo (para o primeiro admin)

### Política `business_subscriptions` INSERT
**Antes:**
- Não existia! ❌

**Depois:**
```sql
CREATE POLICY "Allow subscription creation"
  ON business_subscriptions FOR INSERT
  WITH CHECK (true);
```
✅ Solução: Permite criação de subscriptions (necessário para o trigger criar o trial)

## 🎯 Por que isso aconteceu?

As policies RLS foram criadas para garantir segurança máxima, mas criaram um "paradoxo do ovo e da galinha":

1. Usuário cria empresa → OK ✅
2. Trigger tenta criar `business_member` com role 'admin' → ERRO ❌
   - Policy requer que usuário já seja admin
   - Mas ele ainda não é admin!
3. Trigger tenta criar `business_subscription` → ERRO ❌
   - Não existia policy para INSERT

## 📚 Migrations Atualizadas

Os arquivos de migration foram atualizados:

- ✅ `supabase/migrations/20240101000001_rls_policies.sql` - Atualizado
- ✅ `supabase/migrations/20240101000002_fix_rls_policies.sql` - **NOVO**

Se você ainda não executou as migrations, execute todas em ordem:

```sql
-- 1. Schema inicial
-- (executar o conteúdo de 20240101000000_initial_schema.sql)

-- 2. RLS policies
-- (executar o conteúdo de 20240101000001_rls_policies.sql)

-- 3. Fix RLS
-- (executar o conteúdo de 20240101000002_fix_rls_policies.sql)
```

---

**Problema resolvido! 🚀**
