# Guia de Configuração - Agendly

## 🚀 Setup Inicial Completo

Parabéns! A estrutura completa do Agendly foi criada. Agora você precisa configurar o Supabase para conectar o banco de dados.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (https://supabase.com)
- npm ou yarn

## 🔧 Configuração do Supabase

### 1. Criar Projeto no Supabase

1. Acesse https://supabase.com e faça login
2. Clique em "New Project"
3. Escolha um nome para o projeto
4. Defina uma senha forte para o banco de dados
5. Selecione a região mais próxima (recomendado: Europe West para Portugal, South America para Brasil)
6. Aguarde a criação do projeto (pode levar alguns minutos)

### 2. Executar as Migrations

Você tem duas opções:

#### Opção A: Via Supabase Dashboard (mais fácil)

1. No dashboard do Supabase, vá em **SQL Editor**
2. Copie o conteúdo de `supabase/migrations/20240101000000_initial_schema.sql`
3. Cole no editor SQL e clique em **Run**
4. Repita o processo com `supabase/migrations/20240101000001_rls_policies.sql`

#### Opção B: Via Supabase CLI (recomendado para produção)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Link ao projeto
supabase link --project-ref <SEU_PROJECT_REF>

# Executar migrations
supabase db push
```

### 3. Configurar Variáveis de Ambiente

1. No dashboard do Supabase, vá em **Settings** → **API**
2. Copie:
   - `Project URL`
   - `anon public` key

3. Crie o arquivo `.env.local` na raiz do projeto:

```bash
cp .env.local.example .env.local
```

4. Edite `.env.local` e adicione suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Gerar Tipos TypeScript do Supabase (Opcional mas Recomendado)

```bash
# Via Supabase CLI
supabase gen types typescript --project-id <SEU_PROJECT_REF> > types/database.types.ts
```

## 🏃 Executar o Projeto

```bash
# Instalar dependências (se ainda não instalou)
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse http://localhost:3000

## 📱 Testando o Sistema

### 1. Criar uma Conta

1. Acesse http://localhost:3000
2. Clique em "Começar Gratuitamente"
3. Preencha o formulário de cadastro
4. Você será redirecionado para o onboarding

### 2. Configurar Primeira Empresa

1. Selecione o país (Portugal ou Brasil)
2. Preencha os dados da empresa
3. Clique em "Criar Empresa"
4. Você será redirecionado para o dashboard

### 3. Explorar o Dashboard

- **Dashboard**: Visão geral (a ser implementado)
- **Agenda**: Calendário de agendamentos (a ser implementado)
- **Clientes**: Gestão de clientes (a ser implementado)
- **Serviços**: Gestão de serviços oferecidos (a ser implementado)
- **Equipe**: Gestão de funcionários (a ser implementado)
- **Configurações**: Configurações da empresa (a ser implementado)

## 🔐 Configuração de Autenticação no Supabase

### ⚡ Desabilitar Confirmação de Email (Recomendado)

Para facilitar o cadastro de novos usuários:

1. No dashboard do Supabase, vá em **Authentication** → **Providers**
2. Clique em **Email**
3. **Desabilite** a opção **"Confirm email"** (toggle OFF)
4. Clique em **Save**

Agora os usuários podem criar conta e fazer login imediatamente, sem precisar confirmar email!

### Configurar URLs de Redirect

1. Vá em **Authentication** → **URL Configuration**
2. Configure:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**:
     - `http://localhost:3000/**`
     - `http://localhost:3000/onboarding`
     - `http://localhost:3000/dashboard`

Para produção, adicione também:
   - `https://seu-dominio.com/**`

### Configurar Email Templates (Opcional)

1. Vá em **Authentication** → **Email Templates**
2. Personalize os templates de:
   - Reset de senha
   - Email de convite

**Nota**: Com confirmação de email desabilitada, o template de confirmação não será usado.

## 🎨 Personalização

### Cores e Tema

As cores do tema estão definidas em `app/globals.css`. Você pode personalizá-las alterando as variáveis CSS:

```css
:root {
  --primary: 221.2 83.2% 53.3%; /* Cor primária */
  /* ... outras variáveis */
}
```

### Logo

Para adicionar seu logo:
1. Adicione a imagem em `public/logo.png`
2. Edite `components/dashboard/sidebar.tsx` para usar a imagem

## 📊 Próximas Implementações

Agora que a base está pronta, os próximos passos são:

### Fase 1 - CRUD Básico (Prioridade Alta)
- [ ] CRUD de Serviços
- [ ] CRUD de Clientes
- [ ] CRUD de Funcionários (Staff)
- [ ] Configuração de horários de trabalho

### Fase 2 - Sistema de Agendamentos (Prioridade Alta)
- [ ] Calendário de agendamentos (interno)
- [ ] Criar/editar/cancelar agendamentos
- [ ] Validação de conflitos de horário
- [ ] Página pública de agendamento

### Fase 3 - Notificações (Prioridade Média)
- [ ] Supabase Edge Function para lembretes
- [ ] Envio de emails (Resend ou SendGrid)
- [ ] Template de emails

### Fase 4 - Pagamentos e Assinaturas (Prioridade Média)
- [ ] Integração com Stripe
- [ ] Checkout multi-moeda
- [ ] Gestão de assinaturas
- [ ] Webhook do Stripe

### Fase 5 - Relatórios e Analytics (Prioridade Baixa)
- [ ] Dashboard com métricas
- [ ] Relatórios de faturamento
- [ ] Relatórios de desempenho

### Fase 6 - Recursos Avançados (Futuro)
- [ ] Sistema de avaliações
- [ ] Programa de fidelidade
- [ ] Integração com WhatsApp
- [ ] App mobile (React Native)

## 🐛 Resolução de Problemas

### Erro de conexão com Supabase

- Verifique se as credenciais em `.env.local` estão corretas
- Confirme que as migrations foram executadas
- Verifique se o projeto Supabase está ativo

### Erro de autenticação

- Limpe os cookies do navegador
- Verifique se RLS está habilitado nas tabelas
- Confirme que as políticas RLS foram criadas

### Erro de tipos TypeScript

- Execute `npm install` novamente
- Reinicie o servidor de desenvolvimento
- Gere os tipos do Supabase novamente

## 📚 Documentação Útil

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 💬 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação acima
2. Revise os arquivos de migration em `supabase/migrations/`
3. Consulte os logs do Supabase no dashboard

---

**Boa sorte com o desenvolvimento do Agendly! 🚀**
