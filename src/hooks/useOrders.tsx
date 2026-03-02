import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderItem, OrderStatus } from "@/types/store";
import { toast } from "sonner";
import { printOrder } from "@/services/printService";

// Hook de listagem de pedidos
export function useOrders(storeId: string | undefined, page: number = 0) {
  const pageSize = 50; 
  return useQuery({
    queryKey: ["orders", storeId, page],
    queryFn: async () => {
      if (!storeId) return [];
      
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // CORREÇÃO CRÍTICA AQUI:
      // Removemos a parte `items:order_items(*)` porque a tabela order_items não existe mais.
      // Agora usamos apenas `*` porque a coluna 'items' já está dentro da tabela 'orders'.
      const { data, error } = await supabase
        .from("orders")
        .select("*") 
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Erro ao buscar pedidos:", error);
        throw error;
      }
      
      return data as (Order & { items: OrderItem[] })[];
    },
    enabled: !!storeId,
    refetchInterval: 10000, // Garante atualização a cada 10s mesmo sem realtime
  });
}

// Hook de criação (Mantido)
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
      // Como estamos usando a tabela direta agora, podemos simplificar se o RPC falhar,
      // mas vamos manter o RPC se ele estiver atualizado. 
      // Se der erro aqui também, avise que mudamos para insert direto.
      
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
      toast.success(`Pedido realizado!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar pedido: ${error.message}`);
    },
  });
}

// Hook de atualização de status
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      
      // SE O STATUS FOR CANCELADO, CHAMAMOS A EDGE FUNCTION DE ESTORNO
      if (status === 'cancelled') {
        const { data, error } = await supabase.functions.invoke('refund-mp-payment', {
          body: { orderId }
        });

        if (error) {
          console.error("Erro na Edge Function:", error);
          throw new Error("Erro ao processar cancelamento/estorno.");
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        return data; // A função já retorna o pedido atualizado ou sucesso
      }

      // SE FOR QUALQUER OUTRO STATUS, SEGUE O FLUXO NORMAL
      const { data, error } = await supabase
        .from("orders")
        .update({ status: status as any })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidamos os pedidos para atualizar a lista na tela
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      // Mensagem personalizada se for cancelamento
      if (variables.status === 'cancelled') {
        toast.success("Pedido cancelado e estorno processado!");
      } else {
        toast.success("Status atualizado!");
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}