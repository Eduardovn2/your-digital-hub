import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StoreHours, StoreHoursInsert, StoreHoursUpdate } from "@/types/store";
import { toast } from "sonner";

export function useStoreHours(storeId: string | undefined) {
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
      return data as StoreHours | null;
    },
    enabled: !!storeId,
  });
}

export function useUpsertStoreHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, hours }: { storeId: string; hours: StoreHoursInsert | StoreHoursUpdate }) => {
      // Check if exists
      const { data: existing } = await supabase
        .from("store_hours")
        .select("id")
        .eq("store_id", storeId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("store_hours")
          .update(hours)
          .eq("store_id", storeId)
          .select()
          .single();

        if (error) throw error;
        return data as StoreHours;
      } else {
        const { data, error } = await supabase
          .from("store_hours")
          .insert({ ...hours, store_id: storeId } as StoreHoursInsert)
          .select()
          .single();

        if (error) throw error;
        return data as StoreHours;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["store-hours", data.store_id] });
      toast.success("Horário atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar horário: ${error.message}`);
    },
  });
}

// Helper to check if store is currently open
export function isStoreCurrentlyOpen(hours: StoreHours | null): boolean {
  if (!hours || !hours.is_auto_control) return true;

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM

  // Check if today is in days_open
  if (!hours.days_open.includes(currentDay)) {
    return false;
  }

  // Check if current time is within opening hours
  const opening = hours.opening_time.slice(0, 5);
  const closing = hours.closing_time.slice(0, 5);

  return currentTime >= opening && currentTime <= closing;
}
