# TODO - Correções VianaEcommerce

## Bugs Corrigidos (20 bugs)

### 🔴 CRÍTICOS (8)
- [x] **Bug #1**: `types.ts` completamente vazio → Recriado com todos os tipos
- [x] **Bug #2**: `orders` sem colunas (payment_method, change_for, items, device_id) → Adicionadas via SQL
- [x] **Bug #3**: `stores` sem 12 colunas → Adicionadas via SQL  
- [x] **Bug #4**: `products` sem `complements` → Adicionado via SQL
- [x] **Bug #5**: `order_status` enum incompleto (falta paid/accepted/delivering/completed) → Adicionados via SQL
- [x] **Bug #6**: Tabelas `delivery_rules` e `customer_addresses` não existem → Criadas via SQL
- [x] **Bug #7**: RPC `create_new_order` não existe → Substituído por insert direto em useOrders.tsx
- [x] **Bug #8**: Edge Function `refund-mp-payment` pode não existir → Adicionado try/catch com fallback

### 🟠 ALTOS (6)
- [x] **Bug #9**: `item.observation` não era salvo no DB → Adicionado `notes: item.observation || null`
- [x] **Bug #10**: `storeData.phone.replace()` sem null check → `(storeData?.phone ?? "").replace()`
- [x] **Bug #11**: `clearCart()` não chamado após PIX → Adicionado após `setShowPixScreen(true)`
- [x] **Bug #12**: `order.total_amount` não existe → Alterado para `order.total`
- [x] **Bug #13**: Status 'paid' não tratado em `normalizeStatus` → Adicionado aos keywords de accepted
- [x] **Bug #14**: `isStoreCurrentlyOpen()` lança TypeError se null → Adicionado null check

### 🟡 MÉDIOS (6)
- [x] **Bug #15**: `store.expires_at!` non-null assertion incorreta → Corrigido para verificar antes
- [x] **Bug #16**: Import `useEffect` não usado em CartContext.tsx → Removido
- [x] **Bug #17**: `triggerManualPrint` stale closure em useEffect → Adicionado useCallback + deps
- [x] **Bug #18**: PIN armazenado em texto puro → Hash SHA-256 via Web Crypto API
- [x] **Bug #19**: Casts `(store as any)` em StorePage.tsx → Removidos, interface atualizada
- [x] **Bug #20**: Import `Star` não usado em StorePage.tsx → Removido
- [x] **Bug #21**: maxLength=11 no input de telefone → Alterado para maxLength=15

## Testes Realizados (API)

### ✅ Testes de Integração (via API REST)
1. `POST /orders` (criar pedido com items JSONB) → 201 Created ✅
2. `GET /orders?device_id=eq.xxx` (Meus Pedidos) → 200 com pedidos ✅
3. `PATCH /orders` (auto-cancel) → 200, status alterado ✅
4. `process-payment` (Edge Function PIX) → 200 com QR Code válido ✅
5. `refund-mp-payment` (Edge Function estorno) → 200 ✅

### ✅ Testes de Código (Review)
1. `SubscriptionGuard.tsx` - Lógica de expiração ✅
2. `useStoreHours.tsx` - Null checks, tipo explícito ✅
3. `DashboardStats.tsx` - Hash SHA-256 do PIN ✅
4. `OrdersList.tsx` - useCallback, deps corretos ✅
5. `StorePage.tsx` - Sem casts, tipos corretos ✅

## Arquivos Criados/Modificados

### Banco de Dados
- `supabase/migrations/EXECUTE_NO_SUPABASE_SQL_EDITOR.sql` - SQL completo idempotente
- `supabase/functions/process-payment/index.ts` - Pagamento PIX/Checkout Pro
- `supabase/functions/refund-mp-payment/index.ts` - Estorno
- `supabase/functions/mp-webhook/index.ts` - Webhooks MP

### Frontend
- `src/integrations/supabase/types.ts` - Tipos completos
- `src/types/store.ts` - Interface Store atualizada
- `src/hooks/useStoreHours.tsx` - Null checks + tipo explícito
- `src/hooks/useOrders.tsx` - Insert direto + try/catch
- `src/contexts/CartContext.tsx` - Import removido
- `src/components/CartDrawer.tsx` - Múltiplos bugs corrigidos
- `src/components/dashboard/OrdersList.tsx` - useCallback + deps
- `src/components/dashboard/DashboardStats.tsx` - Hash SHA-256
- `src/pages/auth/SubscriptionGuard.tsx` - expires_at check
- `src/pages/StorePage.tsx` - Sem casts, tipos corretos

## Pendências Conhecidas
- Edge Functions `exchange-mp-token` não existe localmente (somente no Supabase)
- Se `mp_public_key` setado mas `mp_access_token` = null, pagamento falha com mensagem clara
