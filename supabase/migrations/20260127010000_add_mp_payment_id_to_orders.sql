-- Adiciona coluna mp_payment_id na tabela orders para armazenar o ID do pagamento no Mercado Pago
-- Necessário para processar estornos automáticos quando um pedido é cancelado

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS mp_payment_id TEXT DEFAULT NULL;

COMMENT ON COLUMN public.orders.mp_payment_id IS 
  'ID do pagamento gerado pelo Mercado Pago. Usado para processar estornos automáticos.';

-- Atualiza a view orders_decrypted para incluir o novo campo
-- Usa DROP + CREATE pois CREATE OR REPLACE não permite reordenar colunas
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
