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

    console.log("Realtime: Conectando canal para a loja:", storeId);

    const channel = supabase
      .channel(`admin-orders-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          console.log("🔔 Notificação de banco:", payload);
          
          const newOrder = payload.new as any;
          const oldOrder = payload.old as any;
          let shouldNotify = false;
          let notificationTitle = "Novo pedido!";

          // Log para debug
          console.log("🔔 Evento:", payload.eventType, "Payment:", newOrder?.payment_method, "Status:", newOrder?.status);
          
          // Qualquer pedido com status "accepted" já está confirmado (pago na entrega)
          // Isso inclui: dinheiro, pix (entrega), cartão (entrega)
          const isAccepted = newOrder?.status === 'accepted';

          // 1. Lógica de Notificação
          if (payload.eventType === 'INSERT') {
            if (isAccepted) {
              shouldNotify = true;
              notificationTitle = "Novo pedido (Pagar na Entrega)!";
            } else {
              console.log("Pedido criado com status:", newOrder?.status, "- Aguardando pagamento...");
            }
          }

          if (payload.eventType === 'UPDATE') {
            const isDinheiro = ['dinheiro', 'cash'].includes(newOrder?.payment_method?.toLowerCase());
            // Verifica se o status mudou para 'paid' (vindo do Webhook) ou para 'accepted' (pagamento na entrega)
            const mudouParaPago = oldOrder?.status === 'pending' && newOrder?.status === 'paid';
            const mudouParaAccepted = oldOrder?.status === 'pending' && newOrder?.status === 'accepted';
            
            if ((!isDinheiro && mudouParaPago) || mudouParaAccepted) {
              shouldNotify = true;
              notificationTitle = mudouParaAccepted ? "Novo pedido (Pagar na Entrega)!" : "Pagamento Aprovado! Pedido na fila.";
            }
          }

          // 2. Executa a notificação (apenas uma vez)
          if (shouldNotify) {
            try {
              playNotificationSound();
            } catch (e) {
              console.error("Erro ao tocar som:", e);
            }

            toast.success(notificationTitle, {
              description: `Pedido de ${newOrder.customer_name || 'Cliente'}`,
              duration: 10000,
            });
          }

          // 3. Atualiza os dados na tela (Invalidar o cache do React Query)
          // Isso faz o useOrders() buscar os dados novos automaticamente
          queryClient.invalidateQueries({ queryKey: ['orders', storeId] });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error("Erro no Realtime. Verifique se o Realtime está ativo no Supabase.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, queryClient, playNotificationSound]);
}