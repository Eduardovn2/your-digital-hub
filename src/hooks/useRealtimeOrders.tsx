import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRealtimeOrders(storeId: string | undefined) {
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("https://cdn.freesound.org/previews/536/536108_11703273-lq.mp3");
  }, []);

  useEffect(() => {
    if (!storeId) return;

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          audioRef.current?.play().catch(() => console.log("Interaja com a página para ouvir o som"));

          toast.success("🔔 Novo Pedido Recebido!", {
            description: `Cliente: ${payload.new.customer_name} - Total: R$ ${payload.new.total}`,
            duration: 10000,
            action: {
              label: "Ver",
              onClick: () => window.focus()
            }
          });

          queryClient.invalidateQueries({ queryKey: ["orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, queryClient]);
}