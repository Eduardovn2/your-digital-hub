import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DeliveryZone, DeliveryZoneInsert, DeliveryZoneUpdate } from "@/types/store";
import { toast } from "sonner";

export function useDeliveryZones(storeId: string | undefined) {
  return useQuery({
    queryKey: ["delivery-zones", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .eq("store_id", storeId)
        .order("name");

      if (error) throw error;
      return data as DeliveryZone[];
    },
    enabled: !!storeId,
  });
}

export function usePublicDeliveryZones(storeId: string | undefined) {
  return useQuery({
    queryKey: ["public-delivery-zones", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as DeliveryZone[];
    },
    enabled: !!storeId,
  });
}

export function useCreateDeliveryZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zone: DeliveryZoneInsert) => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .insert(zone)
        .select()
        .single();

      if (error) throw error;
      return data as DeliveryZone;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones", data.store_id] });
      toast.success("Zona de entrega criada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar zona: ${error.message}`);
    },
  });
}

export function useUpdateDeliveryZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storeId, updates }: { id: string; storeId: string; updates: DeliveryZoneUpdate }) => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, storeId } as DeliveryZone & { storeId: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones", data.storeId] });
      toast.success("Zona atualizada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

export function useDeleteDeliveryZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storeId }: { id: string; storeId: string }) => {
      const { error } = await supabase
        .from("delivery_zones")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { storeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones", data.storeId] });
      toast.success("Zona removida!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });
}
