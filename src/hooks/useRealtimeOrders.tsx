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
          event: '*', 
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          console.log("🔔 ATUALIZAÇÃO NO BANCO:", payload);
          
          const newOrder = payload.new as any;
          const oldOrder = payload.old as any;

          let shouldNotify = false;
          let notificationTitle = "Novo pedido!";

          const isDinheiro = ['dinheiro', 'cash'].includes(newOrder?.payment_method?.toLowerCase());

          // Cenário A: O pedido acabou de ser criado (INSERT)
          if (payload.eventType === 'INSERT') {
            // Se for dinheiro (ou pagamento na entrega), apita logo!
            if (isDinheiro) {
              shouldNotify = true;
              notificationTitle = "Novo pedido (Pagar na Entrega)!";
            } else {
              // É PIX ou Cartão. Entra silencioso como "Aguardando Pagamento".
              console.log("Pedido online gerado. Aguardando o cliente pagar...");
            }
          }

          // Cenário B: O pedido foi atualizado (UPDATE)
          if (payload.eventType === 'UPDATE') {
            // Só toca no UPDATE se o pagamento FOR ONLINE e mudou de pending para accepted (Webhook)
            if (!isDinheiro && oldOrder?.status === 'pending' && newOrder?.status === 'accepted') {
              shouldNotify = true;
              notificationTitle = "Pagamento Aprovado! Novo pedido na fila.";
            }
          }

          // MUDANÇA 3: Só toca a campainha se a lógica acima autorizar
          if (shouldNotify) {
            try {
              playNotificationSound();
            } catch (e) {
              console.error("Erro ao tocar som:", e);
            }

            toast.success(notificationTitle, {
              description: `Pedido de ${newOrder.customer_name}`,
              duration: 10000,
            });
          }

          // Atualiza a tela sempre
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