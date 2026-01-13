# Agendly - Sistema de Agendamentos

Sistema SaaS multi-tenant de agendamentos para qualquer tipo de empresa que atende clientes com hora marcada.

## Stack Tecnológica

- **Frontend**: Next.js 14+ (App Router, TypeScript)
- **Backend**: Supabase (Auth, PostgreSQL, RLS, Edge Functions, Realtime, Storage)
- **UI**: shadcn/ui + Tailwind CSS
- **Validação**: Zod
- **Pagamentos**: Stripe (multi-moeda: EUR/BRL)

## Funcionalidades

- Sistema multi-tenant com isolamento por Row Level Security (RLS)
- Suporte a múltiplos países (Portugal/Brasil) e moedas (EUR/BRL)
- Gestão de funcionários com roles (admin/staff)
- Agendamentos com prevenção de conflitos
- Agenda interna e página pública de agendamentos
- Sistema de assinaturas com limites por plano
- Notificações automáticas (Edge Functions)

## Começando

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase

### Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.local.example .env.local
# Editar .env.local com suas credenciais do Supabase

# Rodar servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Configuração Rápida do Supabase

1. **Execute as migrations SQL** (via SQL Editor no dashboard)
2. **Desabilite confirmação de email** (Authentication → Providers → Email → "Confirm email" OFF)
3. **Configure as URLs** (Authentication → URL Configuration → adicione `http://localhost:3000/**`)
4. **Pronto!** Crie sua primeira conta e comece a usar

## Estrutura do Projeto

```
app/              # App Router do Next.js
  (auth)/         # Rotas de autenticação
  (dashboard)/    # Dashboard interno
  (public)/       # Páginas públicas de agendamento
components/       # Componentes React reutilizáveis
lib/              # Utilitários e configurações
  supabase/       # Clientes Supabase
  validations/    # Schemas Zod
types/            # Tipos TypeScript
supabase/         # Migrations e Edge Functions
```

## Licença

Proprietário - Todos os direitos reservados
