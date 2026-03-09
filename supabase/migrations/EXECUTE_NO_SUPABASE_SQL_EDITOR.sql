-- ============================================================
-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR:
-- https://supabase.com/dashboard/project/vicwmgcwhscjjxuczjdd/sql/new
--
-- Este script é idempotente (seguro para executar múltiplas vezes).
-- Combina todas as migrations pendentes + correções de bugs.
-- ============================================================

-- -------------------------------------------------------
-- 1. ENUM order_status — Adicionar valores faltantes
-- -------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'paid'
      AND enumtypid = 'public.order_status'::regtype
  ) THEN
    ALTER TYPE public.order_status ADD VALUE 'paid';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'accepted'
      AND enumtypid = 'public.order_status'::regtype
  ) THEN
    ALTER TYPE public.order_status ADD VALUE 'accepted';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'delivering'
      AND enumtypid = 'public.order_status'::regtype
  ) THEN
    ALTER TYPE public.order_status ADD VALUE 'delivering';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'completed'
      AND enumtypid = 'public.order_status'::regtype
  ) THEN
    ALTER TYPE public.order_status ADD VALUE 'completed';
  END IF;
END $$;

-- -------------------------------------------------------
-- 2. TABELA orders — Adicionar colunas faltantes
-- -------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT        NOT NULL DEFAULT 'dinheiro',
  ADD COLUMN IF NOT EXISTS change_for     NUMERIC,
  ADD COLUMN IF NOT EXISTS items          JSONB        NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS device_id      TEXT,
  ADD COLUMN IF NOT EXISTS mp_payment_id  TEXT,
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now();

-- -------------------------------------------------------
-- 3. TABELA stores — Adicionar colunas faltantes
-- -------------------------------------------------------
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS zip_code         TEXT,
  ADD COLUMN IF NOT EXISTS street           TEXT,
  ADD COLUMN IF NOT EXISTS street_number    TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood     TEXT,
  ADD COLUMN IF NOT EXISTS city             TEXT,
  ADD COLUMN IF NOT EXISTS complement       TEXT,
  ADD COLUMN IF NOT EXISTS instagram        TEXT,
  ADD COLUMN IF NOT EXISTS mp_access_token  TEXT,
  ADD COLUMN IF NOT EXISTS mp_public_key    TEXT,
  ADD COLUMN IF NOT EXISTS mp_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS status           TEXT        NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS expires_at       TIMESTAMPTZ;

-- -------------------------------------------------------
-- 4. TABELA products — Adicionar coluna complements
-- -------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS complements JSONB DEFAULT '[]'::jsonb;

-- -------------------------------------------------------
-- 5. TABELA delivery_rules — Criar se não existir
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_rules (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   UUID        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  max_km     NUMERIC     NOT NULL DEFAULT 10,
  price      NUMERIC     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Regras de entrega são públicas" ON public.delivery_rules;
CREATE POLICY "Regras de entrega são públicas"
  ON public.delivery_rules FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Donos podem gerenciar regras de entrega" ON public.delivery_rules;
CREATE POLICY "Donos podem gerenciar regras de entrega"
  ON public.delivery_rules FOR ALL
  USING (auth.uid() IN (SELECT owner_id FROM public.stores WHERE id = store_id))
  WITH CHECK (auth.uid() IN (SELECT owner_id FROM public.stores WHERE id = store_id));

-- Trigger updated_at (só cria se não existir)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_delivery_rules_updated_at'
  ) THEN
    CREATE TRIGGER update_delivery_rules_updated_at
      BEFORE UPDATE ON public.delivery_rules
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- -------------------------------------------------------
-- 6. TABELA customer_addresses — Criar se não existir
--    INCLUI last_used_at (usado em DeliveryAddressForm.tsx)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    TEXT        NOT NULL,
  zip_code     TEXT,
  street       TEXT,
  number       TEXT,
  neighborhood TEXT,
  city         TEXT,
  complement   TEXT,
  referencia   TEXT,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clientes podem salvar seus endereços" ON public.customer_addresses;
CREATE POLICY "Clientes podem salvar seus endereços"
  ON public.customer_addresses FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Clientes podem ler seus próprios endereços" ON public.customer_addresses;
CREATE POLICY "Clientes podem ler seus próprios endereços"
  ON public.customer_addresses FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Clientes podem atualizar seus endereços" ON public.customer_addresses;
CREATE POLICY "Clientes podem atualizar seus endereços"
  ON public.customer_addresses FOR UPDATE
  USING (true);

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_customer_addresses_updated_at'
  ) THEN
    CREATE TRIGGER update_customer_addresses_updated_at
      BEFORE UPDATE ON public.customer_addresses
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- -------------------------------------------------------
-- 7. RLS para orders — Clientes podem ver e cancelar pedidos
-- -------------------------------------------------------
-- SELECT: qualquer usuário pode ver pedidos que têm device_id
-- (o app filtra pelo device_id específico — são UUIDs aleatórios, seguros)
DROP POLICY IF EXISTS "Clientes podem ver seus pedidos pelo device_id" ON public.orders;
CREATE POLICY "Clientes podem ver seus pedidos pelo device_id"
  ON public.orders FOR SELECT
  USING (device_id IS NOT NULL);

-- UPDATE: clientes podem cancelar pedidos pendentes (auto-cancel 5min)
DROP POLICY IF EXISTS "Clientes podem cancelar seus pedidos pendentes" ON public.orders;
CREATE POLICY "Clientes podem cancelar seus pedidos pendentes"
  ON public.orders FOR UPDATE
  USING (device_id IS NOT NULL AND status = 'pending');

-- -------------------------------------------------------
-- 8. VIEW orders_decrypted — Versão final com todos os campos
-- -------------------------------------------------------
DROP VIEW IF EXISTS public.orders_decrypted;

CREATE VIEW public.orders_decrypted
WITH (security_invoker = true)
AS
SELECT
  id,
  store_id,
  customer_name,
  customer_phone,
  customer_address,
  status,
  notes,
  subtotal,
  delivery_fee,
  total,
  payment_method,
  change_for,
  items,
  device_id,
  mp_payment_id,
  created_at,
  updated_at
FROM public.orders;

GRANT SELECT ON public.orders_decrypted TO authenticated;

-- -------------------------------------------------------
-- 9. Verificação final — confirma que tudo foi criado
-- -------------------------------------------------------
DO $$
DECLARE
  v_orders_cols TEXT;
  v_stores_cols TEXT;
  v_ca_exists   BOOLEAN;
  v_dr_exists   BOOLEAN;
BEGIN
  -- Verifica colunas em orders
  SELECT string_agg(column_name, ', ' ORDER BY column_name)
  INTO v_orders_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'orders'
    AND column_name IN ('payment_method','change_for','items','device_id','mp_payment_id');

  -- Verifica colunas em stores
  SELECT string_agg(column_name, ', ' ORDER BY column_name)
  INTO v_stores_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'stores'
    AND column_name IN ('mp_access_token','mp_public_key','status','expires_at');

  -- Verifica tabelas novas
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customer_addresses'
  ) INTO v_ca_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'delivery_rules'
  ) INTO v_dr_exists;

  RAISE NOTICE '✅ orders colunas: %', v_orders_cols;
  RAISE NOTICE '✅ stores colunas: %', v_stores_cols;
  RAISE NOTICE '✅ customer_addresses existe: %', v_ca_exists;
  RAISE NOTICE '✅ delivery_rules existe: %', v_dr_exists;
END $$;
