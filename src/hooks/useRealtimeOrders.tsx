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
          const newOrder = payload.new as any;
          const oldOrder = payload.old as any;
          
          console.log("📡 Realtime event:", payload.eventType, "Order ID:", newOrder?.id, "Status:", newOrder?.status, "Payment:", newOrder?.payment_method);
          
          // Determina o tipo de pagamento
          const paymentMethod = (newOrder?.payment_method || '').toLowerCase();
          const isDinheiro = ['dinheiro', 'cash'].includes(paymentMethod);
          const isPix = paymentMethod === 'pix';
          const isCartao = paymentMethod === 'cartão';
          
          // Qualquer pedido com status "accepted" já está confirmado (pago na entrega)
          const isAccepted = newOrder?.status === 'accepted';
          const isPaid = newOrder?.status === 'paid';
          
          // Notificar para pagamentos na entrega (accepted) e pagamentos online confirmados (paid)
          const shouldNotify = isAccepted || isPaid;
          
          // Gerar mensagem apropriada
          let notificationTitle = "🔥 Novo pedido!";
          if (isAccepted) {
            if (isDinheiro) {
              notificationTitle = "🔥 Novo pedido! (Dinheiro na Entrega)";
            } else if (isPix) {
              notificationTitle = "🔥 Novo pedido! (Pix na Entrega)";
            } else if (isCartao) {
              notificationTitle = "🔥 Novo pedido! (Cartão na Entrega)";
            } else {
              notificationTitle = "🔥 Novo pedido! (Pagar na Entrega)";
            }
          } else if (isPaid) {
            if (isPix) {
              notificationTitle = "✅ Pagamento aprovado! (Pix Online)";
            } else if (isCartao) {
              notificationTitle = "✅ Pagamento aprovado! (Cartão Online)";
            } else {
              notificationTitle = "✅ Pagamento aprovado!";
            }
          }

          // Executa a notificação
          if (shouldNotify) {
            console.log("🔔 DISPARANDO NOTIFICAÇÃO:", notificationTitle);
            
            // 1. Tenta reproduzir o som
            try {
              playNotificationSound();
            } catch (e) {
              console.log("Som bloqueado pelo navegador");
            }
            
            // 2. Tenta usar a API de Notificações do navegador como backup
            if ("Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification(notificationTitle, {
                  body: `Pedido de ${newOrder.customer_name || 'Cliente'}`,
                  icon: "/favicon.ico",
                  tag: "new-order"
                });
              } else if (Notification.permission !== "denied") {
                // Solicita permissão se ainda não foi negada
                Notification.requestPermission();
              }
            }

            // 3. Mostra o toast (sempre funciona)
            toast.success(notificationTitle, {
              description: `Pedido de ${newOrder.customer_name || 'Cliente'}`,
              duration: 10000,
            });
          } else {
            console.log("⏳ Pedido aguardando pagamento - status:", newOrder?.status);
          }

          // Atualiza os dados na tela
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