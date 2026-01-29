import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderItem, OrderStatus } from "@/types/store";
import { toast } from "sonner";
import { printOrder } from "@/services/printService";

// src/hooks/useOrders.tsx
export function useStoreOrders(storeId: string | undefined, page: number = 0) {
  const pageSize = 20; // Número de pedidos por página
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
        .range(from, to); // Implementação da paginação no banco de dados

      if (error) throw error;
      return data as (Order & { items: OrderItem[] })[];
    },
    enabled: !!storeId,
  });
}

// Tipo específico para a entrada da nossa nova função RPC
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
      // Prepara os dados para o formato exato que a função SQL espera
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

        // Chama a função segura no banco
      // Adicione 'as any' para ignorar a validação de tipo estrito temporariamente
      const { data, error } = await supabase.rpc('create_new_order' as any, rpcPayload);

      if (error) throw error;

      // Tenta imprimir
      // O 'data' aqui é o JSON retornado pela RPC { id, total, status }
      const newOrderId = (data as any)?.id;
      if (newOrderId) {
        printOrder(newOrderId, order.store_id).then(result => {
          if (result.printed) {
            console.log('Order printed successfully');
          }
        });
      }

      return data;
    },
    onSuccess: (data: any) => {
      // Invalida a lista para recarregar
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      
      const totalFormatado = data?.total 
        ? Number(data.total).toFixed(2).replace('.', ',') 
        : '0,00';
        
      toast.success(`Pedido realizado! Total: R$ ${totalFormatado}`);
    },
    onError: (error: Error) => {
      console.error('Erro ao criar pedido:', error);
      toast.error(`Erro ao criar pedido: ${error.message}`);
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, storeId }: { orderId: string; status: OrderStatus; storeId: string }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: status as any })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, storeId } as Order & { storeId: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders", data.storeId] });
      toast.success("Status atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}