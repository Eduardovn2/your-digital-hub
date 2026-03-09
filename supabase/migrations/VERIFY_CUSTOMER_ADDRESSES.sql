-- Verificar e corrigir customer_addresses
-- Execute no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT 
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'customer_addresses'
  ) AS tabela_existe;

-- 2. Verificar colunas existentes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'customer_addresses'
ORDER BY ordinal_position;

-- 3. Adicionar coluna last_used_at se não existir
ALTER TABLE public.customer_addresses 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 4. Recriar políticas (usando OR REPLACE não funciona para políticas, então dropamos primeiro)
DROP POLICY IF EXISTS "Clientes podem salvar seus endereços" ON public.customer_addresses;
DROP POLICY IF EXISTS "Clientes podem ler seus próprios endereços" ON public.customer_addresses;
DROP POLICY IF EXISTS "Clientes podem atualizar seus endereços" ON public.customer_addresses;

CREATE POLICY "Clientes podem salvar seus endereços"
  ON public.customer_addresses FOR INSERT WITH CHECK (true);

CREATE POLICY "Clientes podem ler seus próprios endereços"
  ON public.customer_addresses FOR SELECT USING (true);

CREATE POLICY "Clientes podem atualizar seus endereços"
  ON public.customer_addresses FOR UPDATE USING (true);

SELECT '✅ customer_addresses verificado e corrigido!' AS resultado;

