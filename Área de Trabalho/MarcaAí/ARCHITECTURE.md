# Arquitetura do Agendly

## 📐 Visão Geral

O Agendly é uma aplicação SaaS multi-tenant construída com Next.js 14 (App Router) e Supabase, seguindo as melhores práticas de segurança e escalabilidade.

## 🏗️ Stack Tecnológica

### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **shadcn/ui** - Componentes UI reutilizáveis
- **React Hook Form** - Gestão de formulários
- **Zod** - Validação de schemas

### Backend
- **Supabase** - Backend-as-a-Service completo
  - PostgreSQL - Banco de dados relacional
  - Auth - Autenticação e autorização
  - Row Level Security (RLS) - Segurança a nível de linha
  - Edge Functions - Serverless functions
  - Realtime - Atualizações em tempo real
  - Storage - Armazenamento de arquivos

### Infraestrutura
- **Vercel** (recomendado) - Hospedagem e deploy
- **Supabase Cloud** - Banco de dados e backend

## 🗄️ Modelo de Dados

### Hierarquia Multi-Tenant

```
countries
    ↓
businesses (multi-tenant root)
    ↓
    ├── business_members (staff + admins)
    ├── services
    ├── customers
    ├── appointments
    ├── staff_schedules
    └── business_subscriptions
```

### Tabelas Principais

#### `businesses`
- Raiz do multi-tenant
- Cada empresa é isolada por RLS
- Contém configurações de país, moeda e timezone

#### `business_members`
- Relaciona usuários com empresas
- Define roles: `admin` ou `staff`
- Um usuário pode pertencer a múltiplas empresas

#### `appointments`
- Agendamentos com validação de conflitos
- Status: pending, confirmed, cancelled, completed, no_show
- Prevenção de sobreposição via trigger

#### `services`
- Serviços oferecidos pela empresa
- Preço e duração configuráveis
- Soft delete

#### `customers`
- Clientes das empresas
- Isolados por business_id

#### `staff_schedules`
- Horários de trabalho dos funcionários
- Por dia da semana
- Validação de intervalo de tempo

## 🔒 Segurança

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com políticas específicas:

**Princípios:**
1. **Isolamento Multi-Tenant**: Usuários só acessam dados de suas empresas
2. **Controle de Acesso Baseado em Roles**:
   - `admin`: Acesso total aos dados da empresa
   - `staff`: Acesso limitado aos próprios agendamentos
3. **Funções Helper**:
   - `get_user_businesses()`: Retorna empresas do usuário
   - `is_business_admin()`: Verifica se é admin
   - `is_business_member()`: Verifica se é membro

### Validação em Camadas

1. **Frontend**: Validação com React Hook Form + Zod
2. **Server Actions**: Validação com Zod schemas
3. **Banco de Dados**: Constraints, triggers e RLS

## 📁 Estrutura de Diretórios

```
agendly/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rotas de autenticação
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # Dashboard protegido
│   │   └── [businessId]/         # Rotas específicas da empresa
│   │       ├── agenda/
│   │       ├── clientes/
│   │       ├── servicos/
│   │       ├── equipe/
│   │       └── configuracoes/
│   ├── (public)/                 # Páginas públicas
│   │   └── agendar/[businessSlug]/
│   ├── api/                      # API Routes
│   │   └── webhooks/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/                   # Componentes React
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Formulários
│   ├── dashboard/                # Componentes do dashboard
│   └── public/                   # Componentes públicos
│
├── lib/                          # Utilitários e configurações
│   ├── actions/                  # Server Actions
│   │   ├── auth.ts
│   │   └── business.ts
│   ├── supabase/                 # Clientes Supabase
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Middleware helper
│   ├── utils/                    # Funções utilitárias
│   │   ├── country.ts            # Multi-país/moeda
│   │   └── slug.ts               # Geração de slugs
│   ├── validations/              # Schemas Zod
│   │   ├── auth.ts
│   │   ├── business.ts
│   │   ├── appointment.ts
│   │   └── service.ts
│   └── constants/                # Constantes
│
├── types/                        # Tipos TypeScript
│   ├── database.types.ts         # Tipos do Supabase (gerados)
│   └── shared.ts                 # Tipos compartilhados
│
├── supabase/                     # Configurações Supabase
│   └── migrations/               # SQL migrations
│       ├── 20240101000000_initial_schema.sql
│       └── 20240101000001_rls_policies.sql
│
└── public/                       # Arquivos estáticos
```

## 🔄 Fluxos Principais

### 1. Fluxo de Autenticação

```
Usuário → Signup → Supabase Auth → Trigger (criar perfil) → Onboarding → Dashboard
```

### 2. Fluxo de Onboarding

```
Usuário autenticado → Criar empresa → Auto-definir como admin → Criar trial → Dashboard
```

### 3. Fluxo de Agendamento (Interno)

```
Staff/Admin → Selecionar serviço → Escolher cliente → Definir horário → Validar conflito → Criar agendamento
```

### 4. Fluxo de Agendamento (Público)

```
Cliente → Acessar página pública → Selecionar serviço → Escolher horário disponível → Preencher dados → Criar agendamento
```

## 🌍 Multi-País e Multi-Moeda

### Suporte Atual
- **Portugal**: EUR (€), timezone Europe/Lisbon, locale pt-PT
- **Brasil**: BRL (R$), timezone America/Sao_Paulo, locale pt-BR

### Implementação

1. **Detecção Automática**: Via timezone do navegador
2. **Configuração por Empresa**: País definido no onboarding
3. **Formatação Automática**: 
   - Moeda formatada conforme país
   - Datas/horas com timezone correto
   - Locale apropriado (pt-PT ou pt-BR)

### Preços e Planos

Cada plano de assinatura possui dois preços:
- `price_eur`: Preço em Euros
- `price_brl`: Preço em Reais
- Stripe Price IDs separados para cada moeda

## ⚡ Performance e Otimizações

### Banco de Dados
- **Índices**: Criados em todas as foreign keys e campos de busca
- **Queries Otimizadas**: Uso de select específico, limit e filtros
- **Soft Deletes**: Para manter histórico sem perder performance

### Frontend
- **Server Components**: Padrão, Client Components apenas quando necessário
- **Streaming**: Com Suspense para carregamento progressivo
- **Otimização de Imagens**: next/image com formatos modernos
- **Code Splitting**: Automático pelo Next.js

### Caching
- **Static Generation**: Para páginas públicas quando possível
- **ISR**: Revalidação incremental para dados que mudam pouco
- **Client-side Cache**: React Query ou SWR (a implementar)

## 🔮 Escalabilidade

### Preparado para:
- **1000+ empresas**: Isolamento por RLS
- **10000+ usuários**: Auth do Supabase escala automaticamente
- **Milhões de agendamentos**: Índices otimizados e particionamento futuro

### Próximos Passos:
- Implementar cache de queries frequentes
- Adicionar CDN para assets estáticos
- Implementar rate limiting
- Monitoramento com Sentry ou similar

## 🧪 Testes (A Implementar)

### Recomendações:
- **Unit Tests**: Vitest para funções utilitárias
- **Integration Tests**: Playwright para fluxos completos
- **E2E Tests**: Cypress para casos críticos
- **Database Tests**: Testes de RLS policies

## 📦 Deploy

### Recomendações:

**Frontend (Next.js)**:
- Vercel (recomendado) - Deploy automático
- Netlify
- AWS Amplify

**Backend (Supabase)**:
- Supabase Cloud (recomendado)
- Self-hosted Supabase (Docker)

### Variáveis de Ambiente (Produção):
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🎯 Princípios de Design

1. **Security First**: Toda lógica sensível no backend
2. **Mobile First**: Design responsivo priorizando mobile
3. **Type Safe**: TypeScript em todo o código
4. **DRY**: Reutilização de componentes e lógica
5. **KISS**: Soluções simples e diretas
6. **Accessibility**: Componentes acessíveis (WCAG)

---

**Arquitetura sólida, segura e escalável! 🏗️**
