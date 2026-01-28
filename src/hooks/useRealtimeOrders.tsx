import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Som de "Ding" curto embutido (funciona offline e sem bloqueio de rede)
const SOUND_BASE64 = "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
// Nota: O base64 acima é um placeholder curto. Para um som real, o código seria enorme.
// Vamos usar um link mais confiável ou o objeto Audio nativo do navegador para 'beep' se possível,
// mas para garantir, vou usar um link de CDN diferente e permitir o play manual.

export function useRealtimeOrders(storeId: string | undefined) {
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Tenta carregar o som. Se falhar, não quebra o app.
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audioRef.current.volume = 1.0; 
  }, []);

  // Função exposta para testar o som manualmente
  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => console.log("Som tocou com sucesso"))
        .catch((e) => console.error("Erro ao tocar som:", e));
    }
  };

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
          // Tenta tocar o som
          playSound();

          toast.success("🔔 Novo Pedido Recebido!", {
            description: `Cliente: ${payload.new.customer_name} - Total: R$ ${payload.new.total}`,
            duration: Infinity, // Fica na tela até clicar
            action: {
              label: "Ver Pedido",
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

  // Retornamos a função de tocar som para poder usar no botão
  return { playSound };
}