# 🌐 Guia: Mini Site Público

## 📋 Checklist de Configuração

### 1. Aplicar Migrations (OBRIGATÓRIO)

Execute no Supabase SQL Editor:

```sql
-- Arquivo: supabase/migrations/20240103000000_create_public_site_tables.sql
-- Copie todo o conteúdo e execute
```

```sql
-- Arquivo: supabase/migrations/20240103000001_setup_storage_for_public_sites.sql
-- Copie todo o conteúdo e execute
```

### 2. Configurar Variável de Ambiente

No arquivo `.env.local`, certifique-se de que está configurado:

```env
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### 3. Reiniciar Servidor

```bash
# Pare o servidor (Ctrl+C) e rode novamente
npm run dev
```

---

## 🎨 Como Configurar o Site Público

### Acessar Configurações

1. Faça login no dashboard
2. Acesse sua empresa
3. Clique em **"Site Público"** no menu lateral

### Configurar Informações

**Tab "Informações":**
- Descrição curta (aparece no hero)
- Descrição completa (seção "Sobre nós")
- Salve as alterações

**Tab "Contato":**
- WhatsApp (apenas números com código do país)
- Instagram, Facebook, Website (URLs completas)
- Marque se quer mostrar endereço
- Salve as alterações

**Tab "Botão":**
- Personalize o texto do botão de agendamento
- Padrão: "Agendar agora"

### Adicionar Imagem Principal

1. Role até a seção **"Imagem Principal"**
2. Clique em "Enviar Imagem"
3. Selecione uma imagem (recomendado: 1920x600px)
4. Aguarde o upload

### Adicionar Fotos à Galeria

1. Role até a seção **"Galeria de Fotos"**
2. Adicione uma legenda (opcional)
3. Clique em "Selecionar Imagem"
4. Escolha uma foto
5. Repita para adicionar mais fotos

---

## 🚀 Como Visualizar o Site Público

### Opção 1: Botão "Ver Site Público"
No dashboard, clique no botão **"Ver Site Público"** (canto superior direito da página Site Público)

### Opção 2: URL Direta
Acesse no navegador:
```
http://localhost:3000/site/seu-slug-aqui
```

Exemplo:
```
http://localhost:3000/site/salao-de-jogos
```

---

## 🎯 Fluxo do Cliente

### Jornada Completa

1. **Cliente acessa o site público:**
   ```
   /site/salao-de-jogos
   ```

2. **Visualiza:**
   - Hero com nome e descrição da empresa
   - Informações sobre o negócio
   - Lista de serviços disponíveis
   - Galeria de fotos
   - Informações de contato

3. **Clica em "Agendar agora"** (ou em um serviço específico)

4. **É redirecionado para:**
   ```
   /agendar/salao-de-jogos
   ```
   OU (se clicou em serviço específico):
   ```
   /agendar/salao-de-jogos?service=SERVICE_ID
   ```

5. **Completa o agendamento** (fluxo já existente)

---

## 📊 Estrutura de URLs

| Tipo | URL | Descrição |
|------|-----|-----------|
| Landing Page | `/site/{slug}` | Site público da empresa |
| Agendamento | `/agendar/{slug}` | Fluxo de agendamento |
| Agendamento (serviço) | `/agendar/{slug}?service={id}` | Com serviço pré-selecionado |
| Admin (Site) | `/{businessId}/site-publico` | Configurar site público |
| Admin (Agenda) | `/{businessId}/agenda` | Gerenciar agendamentos |

---

## 🎨 Seções do Site Público

### Hero
- Imagem de fundo (ou gradiente se não configurada)
- Nome da empresa
- Descrição curta
- Botão principal de agendamento

### Sobre Nós
- Aparece apenas se houver descrição completa configurada
- Texto formatado

### Serviços
- Sempre aparece se houver serviços cadastrados
- Cada serviço mostra:
  - Nome e descrição
  - Duração
  - Preço formatado
  - Botão "Agendar" (vai direto para agendamento desse serviço)

### Galeria
- Aparece apenas se houver fotos
- Grid responsivo
- Lightbox ao clicar (navegação com setas)

### Contato
- Informações de contato
- Links para redes sociais
- Botão secundário de agendamento

### CTA Flutuante (Mobile)
- Botão fixo no bottom em mobile
- Aparece após scroll de 300px
- Sempre acessível

---

## 🔧 Resolução de Problemas

### Site não aparece

**Verificar se migrations foram aplicadas:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('business_public_profile', 'business_gallery');
```

Deve retornar as duas tabelas.

### Upload de imagem falha

**Verificar se bucket foi criado:**
```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'business-media';
```

Deve retornar o bucket `business-media` com `public = true`.

### Site público não carrega dados

1. Verifique se o slug está correto
2. Verifique se a empresa está ativa
3. Verifique os logs do terminal para erros

---

## ✅ Testes Completos

### Teste 1: Configuração Admin

- [ ] Acesso a `/[businessId]/site-publico` funciona
- [ ] Consegue editar descrições
- [ ] Consegue salvar informações de contato
- [ ] Consegue fazer upload da imagem hero
- [ ] Consegue adicionar fotos à galeria
- [ ] Consegue remover fotos da galeria
- [ ] Botão "Ver Site Público" funciona

### Teste 2: Visualização Pública

- [ ] Acesso a `/site/{slug}` funciona
- [ ] Hero aparece com nome e descrição
- [ ] Imagem hero aparece (se configurada)
- [ ] Seção "Sobre" aparece (se configurada)
- [ ] Serviços aparecem corretamente
- [ ] Galeria aparece (se houver fotos)
- [ ] Lightbox funciona
- [ ] Informações de contato aparecem
- [ ] Links de redes sociais funcionam
- [ ] Botão flutuante aparece em mobile

### Teste 3: Integração com Agendamento

- [ ] Botão "Agendar agora" (hero) redireciona corretamente
- [ ] Botão "Agendar" em serviço específico pré-seleciona o serviço
- [ ] Botão de contato redireciona
- [ ] Fluxo de agendamento funciona normalmente
- [ ] Agendamento aparece no dashboard

### Teste 4: Responsividade

- [ ] Desktop (> 1024px) - layout adequado
- [ ] Tablet (768-1024px) - layout adequado
- [ ] Mobile (< 768px) - layout adequado
- [ ] Botão flutuante aparece apenas em mobile

---

## 🎉 Pronto!

Agora cada empresa tem um mini site público personalizável que aumenta a conversão de agendamentos!

**Próximos passos sugeridos:**
1. Configure o site público da sua empresa de teste
2. Compartilhe o link com amigos para testar
3. Considere adicionar analytics no futuro
