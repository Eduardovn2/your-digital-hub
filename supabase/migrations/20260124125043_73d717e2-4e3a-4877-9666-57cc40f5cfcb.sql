-- Enum para status de pedido
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');

-- Tabela de lojas
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  -- Personalização visual
  primary_color TEXT DEFAULT '#f97316',
  secondary_color TEXT DEFAULT '#ea580c',
  accent_color TEXT DEFAULT '#fed7aa',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#1f2937',
  font_family TEXT DEFAULT 'Inter',
  layout_style TEXT DEFAULT 'grid',
  show_banner BOOLEAN DEFAULT true,
  show_categories BOOLEAN DEFAULT true,
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adicionar store_id na tabela products
ALTER TABLE public.products ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- Tabela de pedidos
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  status order_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Itens do pedido
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Função para verificar dono da loja
CREATE OR REPLACE FUNCTION public.is_store_owner(_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND owner_id = auth.uid()
  )
$$;

-- Políticas para stores
CREATE POLICY "Lojas ativas são públicas" ON public.stores
  FOR SELECT USING (is_active = true);

CREATE POLICY "Donos podem criar lojas" ON public.stores
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Donos podem atualizar suas lojas" ON public.stores
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Donos podem excluir suas lojas" ON public.stores
  FOR DELETE USING (auth.uid() = owner_id);

-- Atualizar políticas de products para multi-tenant
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

CREATE POLICY "Produtos de lojas ativas são públicos" ON public.products
  FOR SELECT USING (
    store_id IS NULL OR 
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND is_active = true)
  );

CREATE POLICY "Donos podem criar produtos" ON public.products
  FOR INSERT WITH CHECK (public.is_store_owner(store_id));

CREATE POLICY "Donos podem atualizar produtos" ON public.products
  FOR UPDATE USING (public.is_store_owner(store_id));

CREATE POLICY "Donos podem excluir produtos" ON public.products
  FOR DELETE USING (public.is_store_owner(store_id));

-- Políticas para orders
CREATE POLICY "Clientes podem criar pedidos" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Pedidos são visíveis para donos da loja" ON public.orders
  FOR SELECT USING (public.is_store_owner(store_id));

CREATE POLICY "Donos podem atualizar pedidos" ON public.orders
  FOR UPDATE USING (public.is_store_owner(store_id));

-- Políticas para order_items
CREATE POLICY "Itens podem ser criados com pedido" ON public.order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Itens são visíveis com o pedido" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND public.is_store_owner(o.store_id)
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket para assets das lojas
INSERT INTO storage.buckets (id, name, public) VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para store-assets
CREATE POLICY "Store assets são públicos" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-assets');

CREATE POLICY "Donos podem fazer upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'store-assets' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Donos podem atualizar assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'store-assets' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Donos podem deletar assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'store-assets' AND 
    auth.role() = 'authenticated'
  );