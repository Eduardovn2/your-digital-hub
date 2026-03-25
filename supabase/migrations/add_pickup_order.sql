-- Migration: Supabase - Adicionar Pickup Order Support
-- Execute no Supabase SQL Editor

-- 1. Adicionar coluna pickup_order na tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS pickup_order boolean NOT NULL DEFAULT false;

-- 2. Adicionar status 'awaiting_pickup' ao enum order_status  
DO $$ BEGIN
  -- Verifica se já existe antes de adicionar (evita erro)
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'awaiting_pickup' 
    AND enumtypid = 'public.order_status'::regtype
  ) THEN
    ALTER TYPE public.order_status ADD VALUE 'awaiting_pickup' BEFORE 'delivering';
  END IF;
END $$;

-- 3. Atualizar VIEW orders_decrypted
DROP VIEW IF EXISTS public.orders_decrypted;
CREATE OR REPLACE VIEW public.orders_decrypted AS
SELECT
  id, store_id, customer_name, customer_phone, customer_address, 
  pickup_order, status, notes, subtotal, delivery_fee, total,
  payment_method, change_for, mp_payment_id, device_id,
  created_at, updated_at
FROM public.orders;

-- 4. RLS para pickup_order (herda das existentes)
-- Cliente vê todos seus pedidos independentemente do pickup

-- 5. Index para performance
CREATE INDEX IF NOT EXISTS idx_orders_pickup_status 
ON public.orders (pickup_order, status) WHERE pickup_order = true;

-- ✅ Migration completa!
-- Teste: SELECT pickup_order, status FROM orders LIMIT 5;
