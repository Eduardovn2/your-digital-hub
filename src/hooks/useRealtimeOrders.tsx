import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminSettings } from "@/contexts/AdminSettingsContext";

export function useRealtimeOrders(storeId: string | undefined) {
  const queryClient = useQueryClient();
  const { playNotificationSound } = useAdminSettings();

  useEffect(() => {
    if (!storeId) return;

    const channel = supabase
      .channel('global-orders-tracker')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders', 
          filter: `store_id=eq.${storeId}` 
        },
        (payload: any) => { // <--- ADICIONEI ': any' AQUI PARA EVITAR ERROS DE TIPO
          console.log("🔔 Pedido detectado:", payload);

          // 1. Toca o som
          playNotificationSound();

          // 2. Garante que os valores existem antes de mostrar
          const cliente = payload.new?.customer_name || "Cliente";
          const total = Number(payload.new?.total || 0).toFixed(2);

          // 3. Mostra o alerta visual
          toast.success("🔔 Novo Pedido!", {
            description: `Cliente: ${cliente} - Total: R$ ${total}`,
            duration: Infinity,
            action: {
              label: "Ver Pedidos",
              onClick: () => window.location.href = "/admin/orders"
            }
          });

          // 4. Espera 1 segundo para garantir que os itens foram salvos
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          }, 1000); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, queryClient, playNotificationSound]);
}