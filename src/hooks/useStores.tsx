import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Store, StoreInsert, StoreUpdate } from "@/types/store";
import { toast } from "sonner";

export function useStores() {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Store[];
    },
  });
}

export function useStoreBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["store", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as Store | null;
    },
    enabled: !!slug,
  });
}

export function useMyStore(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-store", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as Store | null;
    },
    enabled: !!userId,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (store: StoreInsert) => {
      const { data, error } = await supabase
        .from("stores")
        .insert(store)
        .select()
        .single();

      if (error) throw error;
      return data as Store;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
      toast.success("Loja criada com sucesso!");
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate key")) {
        toast.error("Este endereço já está em uso. Escolha outro.");
      } else {
        toast.error(`Erro ao criar loja: ${error.message}`);
      }
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: StoreUpdate }) => {
      const { data, error } = await supabase
        .from("stores")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Store;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
      queryClient.invalidateQueries({ queryKey: ["store", data.slug] });
      toast.success("Loja atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar loja: ${error.message}`);
    },
  });
}

export function useUploadStoreAsset() {
  return useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'logo' | 'banner' }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${type}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("store-assets")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("store-assets")
        .getPublicUrl(fileName);

      return data.publicUrl;
    },
    onError: (error: Error) => {
      toast.error(`Erro ao fazer upload: ${error.message}`);
    },
  });
}

export function useCheckSlugAvailable() {
  return useMutation({
    mutationFn: async (slug: string) => {
      const { data, error } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return !data;
    },
  });
}
