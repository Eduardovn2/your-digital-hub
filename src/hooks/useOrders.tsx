import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderItem, OrderInsert, OrderItemInsert, OrderStatus } from "@/types/store";
import { toast } from "sonner";

export function useStoreOrders(storeId: string | undefined) {
  return useQuery({
    queryKey: ["orders", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (Order & { items: OrderItem[] })[];
    },
    enabled: !!storeId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      order, 
      items 
    }: { 
      order: OrderInsert; 
      items: Omit<OrderItemInsert, "order_id">[] 
    }) => {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert(order)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        ...item,
        order_id: orderData.id
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return orderData as Order;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders", data.store_id] });
      toast.success("Pedido realizado com sucesso!");
    },
    onError: (error: Error) => {
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
        .update({ status })
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
