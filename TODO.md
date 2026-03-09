# Plano de Correção — Análise do Repositório

## 1. Migration SQL (Schema do Banco)
- [x] Criar migration com colunas faltantes em `orders` (payment_method, change_for, items, device_id)
- [x] Criar migration com colunas faltantes em `stores` (zip_code, street, street_number, neighborhood, city, complement, instagram, mp_access_token, mp_public_key, mp_refresh_token, status, expires_at)
- [x] Criar migration com coluna `complements` em `products`
- [x] Adicionar valores ao enum `order_status` (paid, accepted, delivering, completed)
- [x] Criar tabelas `delivery_rules` e `customer_addresses` com RLS
- [x] Atualizar view `orders_decrypted` com novos campos
- [x] Adicionar policy para clientes verem seus pedidos por device_id

## 2. Types.ts
- [x] Recriar `src/integrations/supabase/types.ts` com todos os tipos corretos (todas as tabelas, views, funções, enums)

## 3. Tipos da Aplicação (store.ts)
- [x] Adicionar campos `instagram`, `mp_access_token`, `mp_public_key`, `mp_refresh_token` à interface `Store`

## 4. Correções de Código — Bugs Críticos
- [x] `src/hooks/useOrders.tsx` — substituir RPC `create_new_order` (inexistente) por insert direto
- [x] `src/hooks/useOrders.tsx` — adicionar try/catch em `refund-mp-payment` (Edge Function inexistente) com fallback para update direto
- [x] `src/hooks/useOrders.tsx` — corrigir cast TypeScript `data as unknown as (Order & { items: OrderItem[] })[]`

## 5. Correções de Código — Bugs Altos
- [x] `src/hooks/useStoreHours.tsx` — null check em `isStoreCurrentlyOpen` (TypeError se opening_time/closing_time for null)
- [x] `src/components/CartDrawer.tsx` — salvar `item.observation` como `notes` no insert de pedido
- [x] `src/components/CartDrawer.tsx` — null check em `storeData.phone` → `(storeData?.phone ?? "").replace()`
- [x] `src/components/CartDrawer.tsx` — chamar `clearCart()` após PIX payment iniciado
- [x] `src/components/CartDrawer.tsx` — corrigir `order.total_amount` (campo inexistente) → `order.total`
- [x] `src/components/CartDrawer.tsx` — corrigir `normalizeStatus`: adicionar 'paid', remover duplicata 'delivering', reordenar checks

## 6. Correções de Código — Bugs Médios
- [x] `src/contexts/CartContext.tsx` — remover import `useEffect` não usado
- [x] `src/pages/auth/SubscriptionGuard.tsx` — corrigir `store.expires_at!` (non-null assertion incorreta)
- [x] `src/components/dashboard/OrdersList.tsx` — envolver `triggerManualPrint` em `useCallback`, adicionar ao deps do `useEffect`
- [x] `src/components/dashboard/DashboardStats.tsx` — PIN armazenado em texto puro → hash SHA-256 via Web Crypto API
- [x] `src/pages/StorePage.tsx` — remover `(store as any)` casts desnecessários (campos agora tipados em `Store`)
- [x] `src/pages/StorePage.tsx` — remover import `Star` não usado

## 7. Edge Functions de Pagamento
- [x] `supabase/functions/process-payment/index.ts` — Criada e deployada ✅
      → Cria pagamento PIX (Payments API) ou Checkout Pro (Preferences API) no MP
      → Salva mp_payment_id no pedido para rastreamento e estorno
      → notification_url aponta para mp-webhook automaticamente
- [x] `supabase/functions/mp-webhook/index.ts` — Criada e deployada (--no-verify-jwt) ✅
      → Recebe notificações IPN e Webhooks do Mercado Pago
      → Suporta: payment (PIX), merchant_order (Checkout Pro)
      → Atualiza status do pedido: pending → paid (aprovado) ou cancelled (rejeitado)
      → Dispara Supabase Realtime → atualiza cliente e admin automaticamente
- [ ] `exchange-mp-token` — Edge Function para OAuth do MP ainda não criada
      → Afeta apenas o fluxo de conexão da conta MP no painel admin
      → Tratamento de erro já existe em StoreSettings.tsx

## 8. Bug do Telefone
- [x] `src/components/CartDrawer.tsx` — maxLength={11} → maxLength={15}
      → Input travava em (21) 98786-3 pois maxLength limitava a string formatada

## Resumo dos Bugs Corrigidos
| # | Severidade | Arquivo | Descrição |
|---|-----------|---------|-----------|
| 1 | 🔴 Crítico | types.ts | Arquivo completamente vazio |
| 2 | 🔴 Crítico | orders (DB) | Colunas payment_method, change_for, items, device_id faltando |
| 3 | 🔴 Crítico | stores (DB) | 12 colunas faltando |
| 4 | 🔴 Crítico | products (DB) | Coluna complements faltando |
| 5 | 🔴 Crítico | order_status (DB) | Enum sem paid/accepted/delivering/completed |
| 6 | 🔴 Crítico | DB | Tabelas delivery_rules e customer_addresses inexistentes |
| 7 | 🔴 Crítico | useOrders.tsx | RPC create_new_order inexistente |
| 8 | 🔴 Crítico | useOrders.tsx | Edge Function refund-mp-payment inexistente |
| 9 | 🟠 Alto | CartDrawer.tsx | item.observation não salvo no DB |
| 10 | 🟠 Alto | CartDrawer.tsx | storeData.phone.replace() sem null check → TypeError |
| 11 | 🟠 Alto | CartDrawer.tsx | clearCart() não chamado após PIX |
| 12 | 🟠 Alto | CartDrawer.tsx | order.total_amount não existe → sempre undefined |
| 13 | 🟠 Alto | CartDrawer.tsx | Status 'paid' não tratado em normalizeStatus |
| 14 | 🟠 Alto | useStoreHours.tsx | TypeError se opening_time/closing_time for null |
| 15 | 🟡 Médio | SubscriptionGuard.tsx | store.expires_at! non-null assertion incorreta |
| 16 | 🟡 Médio | CartContext.tsx | useEffect importado mas não usado |
| 17 | 🟡 Médio | OrdersList.tsx | triggerManualPrint stale closure no useEffect |
| 18 | 🟡 Médio | DashboardStats.tsx | PIN em texto puro no localStorage |
| 19 | 🟡 Médio | StorePage.tsx | (store as any) casts desnecessários |
| 20 | 🟡 Médio | StorePage.tsx | Import Star não usado |
