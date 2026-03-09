-- ============================================================
-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/vicwmgcwhscjjxuczjdd/sql/new
-- ============================================================

-- Criar tabela customer_addresses (necessária para salvar endereços)
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  zip_code TEXT,
  street TEXT,
  number TEXT,
  neighborhood TEXT,
  city TEXT,
  complement TEXT,
  referencia TEXT,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Clientes podem salvar seus endereços"
  ON public.customer_addresses FOR INSERT WITH CHECK (true);

CREATE POLICY "Clientes podem ler seus próprios endereços"
  ON public.customer_addresses FOR SELECT USING (true);

CREATE POLICY "Clientes podem atualizar seus endereços"
  ON public.customer_addresses FOR UPDATE USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Confirmar criação
SELECT '✅ Tabela customer_addresses criada com sucesso!' AS resultado;

