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

export function isStoreCurrentlyOpen(settings: any) {
  if (!settings || !settings.is_auto_control) return true; // Se não configurou, assume-se aberto

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Domingo, 1 = Segunda...
  
  // 1. Verifica se abre hoje
  if (!settings.days_open?.includes(currentDay)) return false;

  // 2. Verifica o horário
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [openH, openM] = settings.opening_time.split(":").map(Number);
  const [closeH, closeM] = settings.closing_time.split(":").map(Number);
  
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Caso o fechamento seja após a meia-noite (ex: abre 18:00 e fecha 02:00)
  if (closeMinutes < openMinutes) {
    return currentTime >= openMinutes || currentTime <= closeMinutes;
  }

  return currentTime >= openMinutes && currentTime <= closeMinutes;
}