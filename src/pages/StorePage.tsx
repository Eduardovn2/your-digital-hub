import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShoppingCart, Plus } from "lucide-react";

export default function StorePage() {
  const { slug } = useParams();
  const { addToCart, items, checkout, total } = useCart();

  // 1. Busca os dados da loja pelo link (slug)
  const { data: store, isLoading: loadingStore } = useQuery({
    queryKey: ["store", slug],
    queryFn: async () => {
      // CORREÇÃO LINHA 20: Usamos o '!' para dizer que o slug existe ou enviamos string vazia
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug || "") 
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // 2. Busca os produtos ativos desta loja
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["store-products", store?.id],
    queryFn: async () => {
      // CORREÇÃO LINHA 34: Garantimos que o store.id é uma string
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", store?.id as string);
      if (error) throw error;
      return data;
    },
    // A query só roda se o ID existir, o que ajuda o TS a entender a lógica
    enabled: !!store?.id,
  });

  const handleFinalizeOrder = () => {
    if (!store) return;
    
    const testCustomer = {
      name: "Cliente de Teste",
      phone: "21999999999",
      address: "Rua do Teste, 123"
    };
    
    const fee = (store as any)?.delivery_fee || 0;
    // Aqui também garantimos que o ID está presente
    checkout(testCustomer, store.id, fee);
  };

  if (loadingStore || loadingProducts) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-orange-600 text-white p-6 shadow-md text-center">
        <h1 className="text-2xl font-bold">{store?.name}</h1>
        <p className="text-sm opacity-90">Bem-vindo ao nosso cardápio digital!</p>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {products?.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-row h-32 border-none shadow-sm">
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="w-32 h-full object-cover" />
              )}
              <div className="flex-1 p-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">{product.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-600 font-bold">R$ {Number(product.price).toFixed(2)}</span>
                  <Button size="sm" onClick={() => addToCart(product)} className="h-8 w-8 rounded-full p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <p className="text-lg font-bold text-orange-600">Total: R$ {total.toFixed(2)}</p>
            </div>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleFinalizeOrder}>
              <ShoppingCart className="mr-2 h-4 w-4" /> Finalizar Pedido
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}