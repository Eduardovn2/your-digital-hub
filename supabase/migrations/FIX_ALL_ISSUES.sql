-- ============================================================
-- CORREÇÕES FINAIS - Execute no Supabase SQL Editor
-- https://supabase.com/dashboard/project/vicwmgcwhscjjxuczjdd/sql/new
-- ============================================================

-- ============================================================
-- 1. CORRIGIR customer_addresses - Adicionar coluna que falta e políticas
-- ============================================================

-- Verificar colunas existentes
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'customer_addresses';

-- Adicionar last_used_at se não existir
ALTER TABLE public.customer_addresses 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Adicionar referencia se não existir  
ALTER TABLE public.customer_addresses 
ADD COLUMN IF NOT EXISTS referencia TEXT;

-- Habilitar RLS se não estiver
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Recriar políticas (primeiro dropar as existentes)
DROP POLICY IF EXISTS "Clientes podem salvar seus endereços" ON public.customer_addresses;
DROP POLICY IF EXISTS "Clientes podem ler seus próprios endereços" ON public.customer_addresses;
DROP POLICY IF EXISTS "Clientes podem atualizar seus endereços" ON public.customer_addresses;

CREATE POLICY "Clientes podem salvar seus endereços"
  ON public.customer_addresses FOR INSERT WITH CHECK (true);

CREATE POLICY "Clientes podem ler seus próprios endereços"
  ON public.customer_addresses FOR SELECT USING (true);

CREATE POLICY "Clientes podem atualizar seus endereços"
  ON public.customer_addresses FOR UPDATE USING (true);

-- ============================================================
-- 2. CORRIGIR orders - Adicionar colunas faltantes
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'dinheiro',
  ADD COLUMN IF NOT EXISTS change_for NUMERIC,
  ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ============================================================
-- 3. CORRIGIR stores - Adicionar colunas faltantes
-- ============================================================

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS street_number TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS complement TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS mp_access_token TEXT,
  ADD COLUMN IF NOT EXISTS mp_public_key TEXT,
  ADD COLUMN IF NOT EXISTS mp_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- ============================================================
-- 4. Verificar resultado
-- ============================================================

SELECT 
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'last_used_at') > 0 AS customer_addresses_ok,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'items') > 0 AS orders_items_ok,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name = 'stores' AND column_name = 'mp_access_token') AS stores_mp_token_ok;
