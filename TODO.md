# Plano de Correção — Análise do Repositório

## 1. Migration SQL (Schema do Banco)
- [ ] Criar migration com colunas faltantes em `orders`
- [ ] Criar migration com colunas faltantes em `stores`
- [ ] Criar migration com coluna `complements` em `products`
- [ ] Adicionar valores ao enum `order_status`
- [ ] Criar tabelas `delivery_rules` e `customer_addresses`

## 2. Types.ts
- [ ] Recriar `src/integrations/supabase/types.ts` com todos os tipos corretos

## 3. Correções de Código
- [ ] `src/hooks/useStoreHours.tsx` — null check em `isStoreCurrentlyOpen`
- [ ] `src/contexts/CartContext.tsx` — remover import `useEffect` não usado
- [ ] `src/pages/auth/SubscriptionGuard.tsx` — corrigir `store.expires_at!`
- [ ] `src/components/CartDrawer.tsx` — salvar `observation` nos itens, null check em `storeData`, tratar status `paid`, remover código morto
