import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function useStoreHours(storeId?: string) {
  return useQuery({
    queryKey: ["store-hours", storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from("store_hours")
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });
}

// FUNÇÃO MÁGICA: Verifica se a loja está aberta agora
export function isStoreCurrentlyOpen(settings: any) {
  if (!settings || !settings.is_auto_control) return true;

  const now = new Date();
  const currentDay = now.getDay(); // 0-6
  
  // 1. Hoje é dia de trabalho?
  if (!settings.days_open?.includes(currentDay)) return false;

  // 2. Cálculo de minutos — com null check para evitar TypeError
  if (!settings.opening_time || !settings.closing_time) return true;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = settings.opening_time.split(":").map(Number);
  const [closeH, closeM] = settings.closing_time.split(":").map(Number);
  
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Se fechar após meia-noite (ex: abre 18:00 fecha 02:00)
  if (closeMinutes < openMinutes) {
    return currentTime >= openMinutes || currentTime <= closeMinutes;
  }

  return currentTime >= openMinutes && currentTime <= closeMinutes;
}