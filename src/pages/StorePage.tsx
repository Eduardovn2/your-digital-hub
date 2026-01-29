import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StorePage() {
  const { slug } = useParams(); // Pega o link da URL (ex: /hamburgueria-eduardo)

  // Busca os dados da loja pelo slug
  const { data: store, isLoading } = useQuery<any>({
    queryKey: ["store-public", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*, products(*)")
        .eq("slug", slug)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!store) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-bold mb-2">Loja não encontrada 😕</h1>
        <p className="text-gray-600">Verifique o endereço digitado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Capa da Loja */}
      <div className="h-48 bg-primary relative">
        {store.image_url && <img src={store.image_url} alt={store.name} className="w-full h-full object-cover opacity-50" />}
        <div className="absolute -bottom-10 left-4 right-4 bg-white p-4 rounded-lg shadow-lg flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{store.name}</h1>
            {store.address && <p className="text-sm text-gray-500 flex items-center"><MapPin className="h-3 w-3 mr-1"/> {store.address}</p>}
          </div>
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
            Aberto
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="container mx-auto px-4 mt-16">
        <h2 className="text-lg font-bold mb-4">Cardápio</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {store.products && store.products.length > 0 ? (
            store.products.map((product: any) => (
              <div key={product.id} className="bg-white p-4 rounded-lg shadow flex gap-4">
                {product.image_url && <img src={product.image_url} className="w-24 h-24 object-cover rounded-md bg-gray-100" />}
                <div className="flex-1">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-green-600">R$ {product.price}</span>
                    <Button size="sm">Adicionar</Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 col-span-full text-center py-10">Nenhum produto cadastrado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}