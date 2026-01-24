-- Corrigir políticas de orders para serem mais seguras
DROP POLICY IF EXISTS "Clientes podem criar pedidos" ON public.orders;
DROP POLICY IF EXISTS "Itens podem ser criados com pedido" ON public.order_items;

-- Política mais segura: pedidos só podem ser criados para lojas ativas
CREATE POLICY "Clientes podem criar pedidos em lojas ativas" ON public.orders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND is_active = true AND is_open = true)
  );

-- Itens só podem ser criados se o pedido pertence a uma loja válida
CREATE POLICY "Itens podem ser criados para pedidos válidos" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o 
      JOIN public.stores s ON s.id = o.store_id 
      WHERE o.id = order_id AND s.is_active = true
    )
  );