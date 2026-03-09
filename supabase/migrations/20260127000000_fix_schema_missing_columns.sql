-- ============================================================
-- MIGRATION: Corrigir colunas e tabelas faltantes no schema
-- ============================================================

-- -------------------------------------------------------
-- 1. ENUM order_status — Adicionar valores faltantes
-- -------------------------------------------------------
-- Nota: ALTER TYPE ADD VALUE não pode ser executado dentro de uma transação
-- no PostgreSQL, mas o Supabase executa cada migration em uma transação.
-- Usamos DO $$ para contornar isso.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'paid' AND enumtypid = 'public.order_status'::regtype) THEN
    ALTER TYPE public.order_status ADD VALUE 'paid';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'accepted' AND enumtypid = 'public.order_status'::regtype) THEN
    ALTER TYPE public.order_status ADD VALUE 'accepted';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'delivering' AND enumtypid = 'public.order_status'::regtype) THEN
    ALTER TYPE public.order_status ADD VALUE 'delivering';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'completed' AND enumtypid = 'public.order_status'::regtype) THEN
    ALTER TYPE public.order_status ADD VALUE 'completed';
  END IF;
END $$;

-- -------------------------------------------------------
-- 2. TABELA orders — Adicionar colunas faltantes
-- -------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'dinheiro',
  ADD COLUMN IF NOT EXISTS change_for     NUMERIC,
  ADD COLUMN IF NOT EXISTS items          JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS device_id      TEXT;

-- -------------------------------------------------------
-- 3. TABELA stores — Adicionar colunas faltantes
-- -------------------------------------------------------
ALTER TABLE public.stores
  -- Endereço detalhado
  ADD COLUMN IF NOT EXISTS zip_code       TEXT,
  ADD COLUMN IF NOT EXISTS street         TEXT,
  ADD COLUMN IF NOT EXISTS street_number  TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood   TEXT,
  ADD COLUMN IF NOT EXISTS city           TEXT,
  ADD COLUMN IF NOT EXISTS complement     TEXT,
  -- Redes sociais
  ADD COLUMN IF NOT EXISTS instagram      TEXT,
  -- Mercado Pago
  ADD COLUMN IF NOT EXISTS mp_access_token  TEXT,
  ADD COLUMN IF NOT EXISTS mp_public_key    TEXT,
  ADD COLUMN IF NOT EXISTS mp_refresh_token TEXT,
  -- Assinatura / Status
  ADD COLUMN IF NOT EXISTS status         TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS expires_at     TIMESTAMPTZ;

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

CREATE POLICY "Regras de entrega são públicas"
  ON public.delivery_rules FOR SELECT
  USING (true);

CREATE POLICY "Donos podem gerenciar regras de entrega"
  ON public.delivery_rules FOR ALL
  USING (public.is_store_owner(store_id))
  WITH CHECK (public.is_store_owner(store_id));

CREATE TRIGGER update_delivery_rules_updated_at
  BEFORE UPDATE ON public.delivery_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------
-- 6. TABELA customer_addresses — Criar se não existir
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
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode inserir/ler pelo device_id (sem autenticação)
CREATE POLICY "Clientes podem salvar seus endereços"
  ON public.customer_addresses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Clientes podem ler seus próprios endereços"
  ON public.customer_addresses FOR SELECT
  USING (true);

CREATE POLICY "Clientes podem atualizar seus endereços"
  ON public.customer_addresses FOR UPDATE
  USING (true);

CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------
-- 7. Atualizar a VIEW orders_decrypted para incluir novos campos
-- -------------------------------------------------------
DROP VIEW IF EXISTS public.orders_decrypted;

CREATE VIEW public.orders_decrypted
WITH (security_invoker = true)
AS
SELECT
  id,
  store_id,
  customer_name,
  public.decrypt_sensitive(customer_phone)   AS customer_phone,
  public.decrypt_sensitive(customer_address) AS customer_address,
  status,
  notes,
  subtotal,
  delivery_fee,
  total,
  payment_method,
  change_for,
  items,
  device_id,
  created_at,
  updated_at
FROM public.orders;

GRANT SELECT ON public.orders_decrypted TO authenticated;

-- -------------------------------------------------------
-- 8. Política para pedidos: clientes podem ver seus próprios pedidos pelo device_id
-- -------------------------------------------------------
CREATE POLICY "Clientes podem ver seus pedidos pelo device_id"
  ON public.orders FOR SELECT
  USING (
    device_id IS NOT NULL AND device_id = current_setting('request.headers', true)::json->>'x-device-id'
    OR public.is_store_owner(store_id)
  );
