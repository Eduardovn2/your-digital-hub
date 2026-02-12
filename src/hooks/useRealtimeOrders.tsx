import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminSettings } from "@/contexts/AdminSettingsContext";

export function useRealtimeOrders(storeId: string | undefined) {
  const queryClient = useQueryClient();
  const { playNotificationSound } = useAdminSettings();

  useEffect(() => {
    if (!storeId) {
      console.log("Realtime: Aguardando storeId...");
      return;
    }

    console.log("Realtime: Tentando conectar ao canal para a loja:", storeId);

    const channel = supabase
      .channel(`admin-orders-${storeId}`) // Canal único por loja
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          console.log("🔔 NOVO PEDIDO CHEGOU!", payload);
          
          // 1. Tentar tocar o som
          try {
            playNotificationSound();
          } catch (e) {
            console.error("Erro ao tocar som:", e);
          }

          // 2. Notificação visual
          toast.success("Novo pedido recebido!", {
            description: `Pedido de ${payload.new.customer_name}`,
            duration: 10000,
          });

          // 3. Atualizar o banco no front
          queryClient.invalidateQueries({ queryKey: ['orders', storeId] });
        }
      )
      .subscribe((status) => {
        console.log(`Realtime Status para loja ${storeId}:`, status);
        if (status === 'CHANNEL_ERROR') {
          console.error("Erro na conexão Realtime. Verifique se o Realtime está ativo no Supabase.");
        }
      });

    return () => {
      console.log("Realtime: Desconectando canal...");
      supabase.removeChannel(channel);
    };
  }, [storeId, queryClient, playNotificationSound]);
}