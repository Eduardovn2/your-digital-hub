-- ============================================================
-- CONFIGURAÇÃO DE PAGAMENTOS - Sistema Flexível
-- Execute no Supabase SQL Editor
-- https://supabase.com/dashboard/project/vicwmgcwhscjjxuczjdd/sql/new
-- ============================================================

-- ============================================================
-- 1. Adicionar colunas de configuração de pagamento na tabela stores
-- ============================================================

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS accepts_online_payment BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS accepts_cash_on_delivery BOOLEAN NOT NULL DEFAULT TRUE;

-- ============================================================
-- 2. Verificar resultado
-- ============================================================

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'stores' 
  AND column_name IN ('accepts_online_payment', 'accepts_cash_on_delivery');

-- ============================================================
-- 3. Atualizar valores padrão para lojas existentes (opcional)
-- Lojas com MP ativo mantêm ambas opçõesenabled por padrão
-- ============================================================

-- UPDATE public.stores 
-- SET accepts_online_payment = TRUE, 
--     accepts_cash_on_delivery = TRUE
-- WHERE mp_public_key IS NOT NULL 
--   AND (accepts_online_payment IS NULL OR accepts_cash_on_delivery IS NULL);

