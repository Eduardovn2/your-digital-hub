# Plano de Implementação: Sistema Flexível de Pagamento

## Requisito do Cliente
O cliente deve ter a opção de escolher entre:
1. **Pagamento online via Mercado Pago** (Pix/Cartão) - obrigatório se apenas essa opção estiver habilitada
2. **Pagamento na entrega** (Pix/Cartão/Dinheiro no ato) - obrigatório se apenas essa opção estiver habilitada
3. **Ambas as opções** - cliente escolhe livremente

O lojista configura no admin quais opções aceita.

---

## Estrutura Atual Identificada

### Tabela `stores` - Campos existentes relacionados a pagamento:
- `mp_access_token` - Token de acesso MP
- `mp_public_key` - Chave pública MP
- `mp_refresh_token` - Token de refresh MP

### CartDrawer.tsx - Lógica atual:
- Busca `mp_public_key` para verificar se tem MP
- Se não tem MP → só mostra opção Dinheiro
- Se tem MP → mostra Pix/Cartão/Dinheiro

### CartPayment.tsx - Componente de seleção:
- Opções: pix, cartão, dinheiro
- `requiresMP` = true para pix/cartão

---

## Plano de Implementação

### Passo 1: Migration SQL
Adicionar colunas na tabela `stores`:
- `accepts_online_payment` BOOLEAN DEFAULT TRUE
- `accepts_cash_on_delivery` BOOLEAN DEFAULT TRUE

### Passo 2: Atualizar tipos TypeScript
**Arquivo:** `src/types/store.ts`
- Adicionar campos acima na interface Store

### Passo 3: Atualizar StoreSettings.tsx (Admin)
**Arquivo:** `src/components/dashboard/StoreSettings.tsx`
- Adicionar seção "Configurações de Pagamento" na aba "Pagamentos"
- Checkbox: "Aceito pagamento online (Mercado Pago)"
- Checkbox: "Aceito pagamento na entrega"
- Se "pagamento na entrega" = false, mostrar alerta que exige online
- Mostrar status de integração MP

### Passo 4: Atualizar CartPayment.tsx (Frontend)
**Arquivo:** `src/components/cart/CartPayment.tsx`
- Novas props:
  - `acceptsOnlinePayment`: boolean
  - `acceptsCashOnDelivery`: boolean
  - `requiresOnlinePayment`: boolean
- Lógica de exibição:
  - Se `requiresOnlinePayment` = true: mostrar apenas Pix/Cartão (MP)
  - Se `acceptsCashOnDelivery` = true E `acceptsOnlinePayment` = true: mostrar todas
  - Se `acceptsCashOnDelivery` = true E `acceptsOnlinePayment` = false: apenas Dinheiro/Pix/Cartão na entrega
- Remover lógica antiga do `hasMercadoPago` (substituir por nova)

### Passo 5: Atualizar CartDrawer.tsx (Frontend)
**Arquivo:** `src/components/CartDrawer.tsx`
- Buscar `accepts_online_payment`, `accepts_cash_on_delivery` da loja
- Passar novas props para CartPayment
- Ajustar lógica de validação do formulário

### Passo 6: Atualizar StorePage.tsx
**Arquivo:** `src/pages/StorePage.tsx`
- Verificar se a loja aceita pelo menos uma forma de pagamento
- Se não aceitar nenhuma, mostrar mensagem de erro

---

## Arquivos a Modificar

1. `supabase/migrations/NOVA_MIGRATION.sql` - Adicionar colunas
2. `src/types/store.ts` - Adicionar tipos
3. `src/components/dashboard/StoreSettings.tsx` - Admin UI
4. `src/components/cart/CartPayment.tsx` - Componente de pagamento
5. `src/components/CartDrawer.tsx` - Integração
6. `src/pages/StorePage.tsx` - Validação

---

## Ordem de Implementação

1. Migration SQL
2. Types
3. StoreSettings (Admin)
4. CartPayment
5. CartDrawer
6. StorePage

