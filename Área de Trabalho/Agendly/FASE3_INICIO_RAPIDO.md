# 🚀 FASE 3 - Início Rápido

## ⚡ Como Testar em 5 Minutos

### 1. Aplicar Migrations (1 min)

**Opção A - Supabase Studio (Recomendado):**
1. Abra o Supabase Studio
2. Vá em "SQL Editor"
3. Abra o arquivo `supabase/migrations/APLICAR_FASE3.sql`
4. Cole todo o conteúdo no editor
5. Clique em "Run"
6. ✅ Pronto!

**Opção B - CLI:**
```bash
# Se você usa Supabase CLI local
supabase migration up
```

### 2. Obter o Slug da Sua Empresa (30 seg)

Execute no SQL Editor do Supabase:

```sql
SELECT id, name, slug FROM businesses WHERE active = true LIMIT 5;
```

Copie o valor do campo `slug`. Exemplo: `minha-barbearia`

### 3. Acessar a Página Pública (30 seg)

Abra no navegador:

```
http://localhost:3000/agendar/[SEU-SLUG-AQUI]
```

Exemplo:
```
http://localhost:3000/agendar/minha-barbearia
```

### 4. Testar o Fluxo (3 min)

1. **Escolha um serviço** → Clique em um card
2. **Escolha um profissional** → Clique em "Qualquer disponível" ou escolha um
3. **Escolha data e hora** → Selecione um dia e um horário disponível
4. **Preencha seus dados:**
   - Nome: "João Silva"
   - Telefone: "912345678"
   - Email: "joao@exemplo.com" (opcional)
5. **Confirme** → Clique em "Confirmar Agendamento"

### 5. Verificar no Dashboard (30 seg)

Acesse seu dashboard interno:

```
http://localhost:3000/[BUSINESS-ID]/agenda
```

✅ O agendamento deve aparecer na agenda com status "Pendente"

---

## 🎨 Testar Widget Embed

Adicione `?embed=true` na URL:

```
http://localhost:3000/agendar/minha-barbearia?embed=true
```

O layout ficará compacto, ideal para incorporar em outro site.

---

## 📋 Checklist de Funcionalidades

Execute este checklist para garantir que tudo está funcionando:

### Passo 1 - Serviços
- [ ] Serviços aparecem em cards
- [ ] Preço está formatado (EUR ou BRL)
- [ ] Duração aparece corretamente
- [ ] Clicar em um serviço o seleciona
- [ ] Botão "Continuar" fica habilitado

### Passo 2 - Profissionais
- [ ] Opção "Qualquer disponível" aparece
- [ ] Profissionais aparecem com nome
- [ ] Clicar seleciona o profissional
- [ ] Botão "Continuar" fica habilitado

### Passo 3 - Data e Hora
- [ ] Calendário semanal aparece
- [ ] Pode navegar entre semanas
- [ ] Horários disponíveis aparecem
- [ ] Horários passados não aparecem
- [ ] Horários ocupados não aparecem
- [ ] Clicar em horário o seleciona
- [ ] Botão "Continuar" fica habilitado

### Passo 4 - Dados
- [ ] Formulário aparece
- [ ] Nome é obrigatório
- [ ] Telefone é obrigatório
- [ ] Email é opcional
- [ ] Validação funciona
- [ ] Botão "Continuar" fica habilitado

### Passo 5 - Confirmação
- [ ] Resumo mostra todos os dados
- [ ] Botão "Confirmar" aparece
- [ ] Loading aparece ao clicar
- [ ] Mensagem de sucesso aparece
- [ ] Pode fazer novo agendamento

### Verificação Final
- [ ] Agendamento aparece no dashboard interno
- [ ] Status é "pending"
- [ ] Cliente foi criado/atualizado
- [ ] Modo embed funciona
- [ ] Mobile responsivo funciona

---

## 🐛 Problemas Comuns

### "Empresa não encontrada"

**Solução:** Verifique se o slug está correto e a empresa está ativa.

```sql
UPDATE businesses SET active = true WHERE slug = 'seu-slug';
```

### "Nenhum horário disponível"

**Solução:** Configure horários de trabalho para os profissionais.

1. Vá em `Dashboard → Equipe`
2. Clique em "Configurar Horários" para cada profissional
3. Defina horários de trabalho

### Página em branco

**Solução:** Verifique se migrations foram aplicadas.

```sql
-- Deve retornar 'source'
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'appointments' AND column_name = 'source';
```

---

## 📊 Como Empresas Podem Usar

### Opção 1: Link Direto

Compartilhe o link com clientes:

```
https://seudominio.com/agendar/sua-empresa
```

### Opção 2: Widget no Site

```html
<h2>Agende Seu Horário</h2>
<iframe 
  src="https://seudominio.com/agendar/sua-empresa?embed=true"
  width="100%"
  height="700px"
  style="border: none; border-radius: 8px;"
></iframe>
```

### Opção 3: QR Code

Gere um QR Code apontando para:
```
https://seudominio.com/agendar/sua-empresa
```

Clientes podem escanear e agendar na hora!

---

## 🎯 Próximos Passos

Após testar e validar:

1. ✅ Configure horários de trabalho para todos os profissionais
2. ✅ Adicione descrições aos serviços
3. ✅ Teste em diferentes dispositivos (mobile, tablet, desktop)
4. ✅ Compartilhe o link com clientes de teste
5. ✅ Configure fotos de perfil dos profissionais (opcional)
6. ✅ Defina logo da empresa (opcional)

---

## 🎉 Pronto!

Seu sistema agora aceita agendamentos públicos! 

Clientes podem agendar 24/7 sem precisar de login, e você recebe tudo no seu dashboard.

**Boa sorte com seu negócio!** 🚀
