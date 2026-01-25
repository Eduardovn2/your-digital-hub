-- 1. Tabela para zonas de entrega (CEP/Bairros)
CREATE TABLE public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Nome do bairro/zona
  cep_prefix TEXT, -- Prefixo do CEP (ex: 01310 para região)
  fee NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela para horários de funcionamento
CREATE TABLE public.store_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  opening_time TIME NOT NULL DEFAULT '08:00',
  closing_time TIME NOT NULL DEFAULT '22:00',
  days_open INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6}', -- 0=dom, 1=seg...6=sab
  is_auto_control BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela para configurações de impressora
CREATE TABLE public.printer_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  printer_ip TEXT NOT NULL,
  printer_port INTEGER NOT NULL DEFAULT 9100,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  paper_width INTEGER NOT NULL DEFAULT 80, -- mm
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_zones
CREATE POLICY "Zonas são visíveis publicamente"
ON public.delivery_zones FOR SELECT
USING (is_active = true);

CREATE POLICY "Donos podem gerenciar zonas"
ON public.delivery_zones FOR ALL
USING (is_store_owner(store_id))
WITH CHECK (is_store_owner(store_id));

-- RLS Policies for store_hours
CREATE POLICY "Horários são públicos"
ON public.store_hours FOR SELECT
USING (true);

CREATE POLICY "Donos podem gerenciar horários"
ON public.store_hours FOR ALL
USING (is_store_owner(store_id))
WITH CHECK (is_store_owner(store_id));

-- RLS Policies for printer_settings
CREATE POLICY "Donos podem gerenciar impressora"
ON public.printer_settings FOR ALL
USING (is_store_owner(store_id))
WITH CHECK (is_store_owner(store_id));

-- Triggers para updated_at
CREATE TRIGGER update_delivery_zones_updated_at
BEFORE UPDATE ON public.delivery_zones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_hours_updated_at
BEFORE UPDATE ON public.store_hours
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_printer_settings_updated_at
BEFORE UPDATE ON public.printer_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();