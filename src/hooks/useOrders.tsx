import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderItem, OrderStatus } from "@/types/store";
import { toast } from "sonner";
import { printOrder } from "@/services/printService";

// CORREÇÃO 1: Renomeado de useStoreOrders para useOrders para corrigir o erro de importação
export function useOrders(storeId: string | undefined, page: number = 0) {
  const pageSize = 50; 
  return useQuery({
    queryKey: ["orders", storeId, page],
    queryFn: async () => {
      if (!storeId) return [];
      
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data as (Order & { items: OrderItem[] })[];
    },
    enabled: !!storeId,
    refetchInterval: 10000,
  });
}

// Hook de criação (Mantido igual)
type CreateOrderParams = {
  order: {
    store_id: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string | null;
    notes: string | null;
  };
  items: {
    id: string;
    quantity: number;
    notes?: string | null;
  }[];
  deliveryZoneId?: string;
};

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ order, items, deliveryZoneId }: CreateOrderParams) => {
      const rpcPayload = {
        p_store_id: order.store_id,
        p_customer_name: order.customer_name,
        p_customer_phone: order.customer_phone,
        p_customer_address: order.customer_address,
        p_notes: order.notes,
        p_delivery_zone_id: deliveryZoneId || null,
        p_items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          notes: item.notes || null
        }))
      };

      const { data, error } = await supabase.rpc('create_new_order' as any, rpcPayload);

      if (error) throw error;

      const newOrderId = (data as any)?.id;
      if (newOrderId) {
        printOrder(newOrderId, order.store_id).catch(console.error);
      }

      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      
      const totalFormatado = data?.total 
        ? Number(data.total).toFixed(2).replace('.', ',') 
        : '0,00';
        
      toast.success(`Pedido realizado! Total: R$ ${totalFormatado}`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar pedido: ${error.message}`);
    },
  });
}

// CORREÇÃO 2: Removemos 'storeId' dos parâmetros e pegamos da resposta do banco
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      // Atualiza e retorna o dado atualizado (que contém o store_id)
      const { data, error } = await supabase
        .from("orders")
        .update({ status: status as any })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data; // Retorna o objeto Order completo (com store_id)
    },
    onSuccess: (data) => {
      // Usa o store_id que veio da resposta do banco para invalidar o cache correto
      if (data?.store_id) {
         queryClient.invalidateQueries({ queryKey: ["orders", data.store_id] });
      } else {
         queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
      toast.success("Status atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}