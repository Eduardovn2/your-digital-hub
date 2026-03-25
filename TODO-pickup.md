# TODO - Retirada na Loja (Pickup) ✅ APROVADO

## 1. Migration Supabase [PENDENTE]
```
-- No Supabase SQL Editor:
ALTER TABLE orders ADD COLUMN pickup_order boolean DEFAULT false;
-- Add enum 'awaiting_pickup' se necessário
```

## 2. Types [✅ CONCLUÍDO]
src/types/store.ts - `pickup_order`, `'awaiting_pickup'`

## 3. CartContext [✅ CONCLUÍDO] 
src/contexts/CartContext.tsx - `pickupMode`, `deliveryFee=0`, total ajustado

## 4. UI Toggle [PENDENTE]
src/components/cart/CartDrawer.tsx (toggle + conditional forms)

## 5. Order Flow [✅ CONCLUÍDO] 
src/components/dashboard/OrdersList.tsx - flow pickup + STATUS_CONFIG

**Progresso: 4/5**

**Progresso: 0/5**
