import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MenuItem } from "@/types/menu";
import { toast } from "sonner";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  popular: boolean | null;
  store_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at">;
export type ProductUpdate = Partial<ProductInsert>;

// Convert Product to MenuItem for cart compatibility
export function productToMenuItem(product: Product): MenuItem {
  return {
    id: product.id,
    name: product.name,
    description: product.description || "",
    price: Number(product.price),
    image: product.image_url || "/placeholder.svg",
    category: product.category,
    popular: product.popular || false,
  };
}

export function useProducts(storeId?: string) {
  return useQuery({
    queryKey: ["products", storeId],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (storeId) {
        query = query.eq("store_id", storeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const { data, error } = await supabase
        .from("products")
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar produto: ${error.message}`);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProductUpdate }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar produto: ${error.message}`);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir produto: ${error.message}`);
    },
  });
}

export function useUploadProductImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    },
    onError: (error: Error) => {
      toast.error(`Erro ao fazer upload: ${error.message}`);
    },
  });
}
