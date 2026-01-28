// src/hooks/useOrders.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderItem, OrderInsert, OrderItemInsert, OrderStatus } from "@/types/store";
import { toast } from "sonner";
import { printOrder } from "@/services/printService";

// ... (useStoreOrders permanece igual)

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      order, 
      items,
      deliveryZoneId // Novo parâmetro opcional
    }: { 
      order: Omit<OrderInsert, 'id' | 'created_at' | 'updated_at'>; 
      items: { id: string; quantity: number; notes?: string }[];
      deliveryZoneId?: string;
    }) => {
      
      // Preparar o payload para a RPC
      const payload = {
        p_store_id: order.store_id,
        p_customer_name: order.customer_name,
        p_customer_phone: order.customer_phone,
        p_customer_address: order.customer_address,
        p_notes: order.notes,
        p_delivery_zone_id: deliveryZoneId || null, // Passamos o ID da zona, não o valor
        p_items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          notes: item.notes
        }))
      };

      // Chamada segura via RPC
      const { data, error } = await supabase.rpc('create_new_order', payload);

      if (error) throw error;

      // Tentativa de impressão (non-blocking)
      if (data && data.id) {
        printOrder(data.id, order.store_id).then(result => {
          if (result.printed) console.log('Order printed successfully');
        });
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalida a cache para atualizar a lista se estiver no admin
      // Nota: data pode não ter store_id direto dependendo do retorno da RPC, 
      // mas o invalidate geral funciona.
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Pedido realizado! Total confirmado: R$ ${data.total}`);
    },
    onError: (error: Error) => {
      console.error(error);
      toast.error(`Erro ao criar pedido: ${error.message}`);
    },
  });
}

// ... (useUpdateOrderStatus permanece igual)