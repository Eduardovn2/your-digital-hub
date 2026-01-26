-- Drop the existing views with SECURITY DEFINER
DROP VIEW IF EXISTS public.orders_decrypted;
DROP VIEW IF EXISTS public.printer_settings_decrypted;

-- Recreate views with SECURITY INVOKER (default, safer)
CREATE VIEW public.orders_decrypted
WITH (security_invoker = true)
AS
SELECT 
  id,
  store_id,
  customer_name,
  public.decrypt_sensitive(customer_phone) as customer_phone,
  public.decrypt_sensitive(customer_address) as customer_address,
  status,
  notes,
  subtotal,
  delivery_fee,
  total,
  created_at,
  updated_at
FROM public.orders;

CREATE VIEW public.printer_settings_decrypted
WITH (security_invoker = true)
AS
SELECT 
  id,
  store_id,
  public.decrypt_sensitive(printer_ip) as printer_ip,
  printer_port,
  is_enabled,
  paper_width,
  created_at,
  updated_at
FROM public.printer_settings;

-- Grant access to authenticated users (RLS on underlying tables will still apply)
GRANT SELECT ON public.orders_decrypted TO authenticated;
GRANT SELECT ON public.printer_settings_decrypted TO authenticated;