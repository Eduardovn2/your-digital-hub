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
      
      // Usamos 'unknown' como intermediário pois 'items' vem como Json do Supabase
      return (data as unknown) as (Order & { items: OrderItem[] })[];
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
      // Bug #8: RPC 'create_new_order' não existe no DB.
      // Substituído por insert direto na tabela 'orders'.
      const itemsData = items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        notes: item.notes || null,
      }));

      const { data, error } = await supabase
        .from("orders")
        .insert({
          store_id: order.store_id,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_address: order.customer_address,
          notes: order.notes,
          items: itemsData,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) throw error;

      if (data?.id) {
        printOrder(data.id, order.store_id).catch(console.error);
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
      
      // SE O STATUS FOR CANCELADO, TENTA ESTORNO VIA EDGE FUNCTION
      // Bug #7: Edge Function 'refund-mp-payment' pode não existir.
      // Usamos try/catch para garantir que o cancelamento funcione mesmo sem ela.
      if (status === 'cancelled') {
        // Chama a Edge Function de estorno — ela cancela o pedido no banco E tenta o reembolso MP
        const { data: refundData, error: refundError } = await supabase.functions.invoke(
          'refund-mp-payment',
          { body: { orderId } }
        );

        // Erro de rede/invocação da Edge Function (não erro de negócio)
        if (refundError) {
          console.warn("[useOrders] refund-mp-payment falhou na invocação, cancelando diretamente:", refundError.message);

          // Fallback: cancela diretamente no banco sem estorno
          const { data, error } = await supabase
            .from("orders")
            .update({ status: "cancelled" as any })
            .eq("id", orderId)
            .select()
            .maybeSingle();

          if (error) throw error;
          if (!data) throw new Error("Pedido não encontrado para cancelamento.");
          return { ...data, _refundMessage: "Pedido cancelado. Estorno automático indisponível no momento." };
        }

        // Erro de negócio retornado pela Edge Function (ex: pedido não encontrado)
        if (refundData?.error) {
          throw new Error(refundData.error);
        }

        // Sucesso — retorna os dados com a mensagem da Edge Function
        return refundData;
      }

      // SE FOR QUALQUER OUTRO STATUS, SEGUE O FLUXO NORMAL
      const { error } = await supabase
        .from("orders")
        .update({ status: status as any })
        .eq("id", orderId);

      if (error) throw error;
      return { id: orderId, status } as any;
    },
    onSuccess: (data: any, variables) => {
      // Invalida os pedidos para atualizar a lista na tela
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      if (variables.status === 'cancelled') {
        // Usa a mensagem retornada pela Edge Function se disponível
        const msg: string =
          data?._refundMessage ||
          data?.message ||
          "Pedido cancelado com sucesso.";

        const detail: string | undefined = data?.detail;

        if (data?.refunded) {
          // Estorno MP processado com sucesso
          toast.success(msg, {
            description: detail,
            duration: 8000,
          });
        } else {
          // Cancelado sem estorno (dinheiro, sem token MP, etc.)
          toast.info(msg, {
            description: detail,
            duration: 6000,
          });
        }
      } else {
        toast.success("Status do pedido atualizado!");
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}