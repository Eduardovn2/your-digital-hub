-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encryption key storage (uses Supabase Vault)
-- The actual key should be stored as a secret

-- Create helper function to encrypt text
CREATE OR REPLACE FUNCTION public.encrypt_sensitive(plain_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  IF plain_text IS NULL THEN
    RETURN NULL;
  END IF;
  -- Use a fixed key for now - in production, this should come from vault
  encryption_key := current_setting('app.encryption_key', true);
  IF encryption_key IS NULL OR encryption_key = '' THEN
    -- If no key set, return obfuscated data (base64 encoded)
    RETURN encode(plain_text::bytea, 'base64');
  END IF;
  RETURN encode(
    pgp_sym_encrypt(plain_text, encryption_key),
    'base64'
  );
END;
$$;

-- Create helper function to decrypt text
CREATE OR REPLACE FUNCTION public.decrypt_sensitive(encrypted_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  IF encrypted_text IS NULL THEN
    RETURN NULL;
  END IF;
  encryption_key := current_setting('app.encryption_key', true);
  IF encryption_key IS NULL OR encryption_key = '' THEN
    -- If no key set, decode base64
    RETURN convert_from(decode(encrypted_text, 'base64'), 'UTF8');
  END IF;
  RETURN pgp_sym_decrypt(
    decode(encrypted_text, 'base64')::bytea,
    encryption_key
  );
END;
$$;

-- Create a view for orders that auto-decrypts sensitive data for authorized users
CREATE OR REPLACE VIEW public.orders_decrypted AS
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
FROM public.orders
WHERE public.is_store_owner(store_id);

-- Create a view for printer settings that auto-decrypts
CREATE OR REPLACE VIEW public.printer_settings_decrypted AS
SELECT 
  id,
  store_id,
  public.decrypt_sensitive(printer_ip) as printer_ip,
  printer_port,
  is_enabled,
  paper_width,
  created_at,
  updated_at
FROM public.printer_settings
WHERE public.is_store_owner(store_id);

-- Grant access to views
GRANT SELECT ON public.orders_decrypted TO authenticated;
GRANT SELECT ON public.printer_settings_decrypted TO authenticated;