import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, Store } from "lucide-react";
import { toast } from "sonner";
import DashboardStats from "@/components/admin/DashboardStats"; // Certifique-se que esses componentes existem
  // Se não tiver os componentes abaixo importados, comente-os por enquanto para testar
import OrdersList from "@/components/admin/OrdersList"; 
import MenuManager from "@/components/admin/MenuManager"; 

export default function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreSlug, setNewStoreSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // 1. Busca a loja do usuário logado
  const { data: store, isLoading } = useQuery({
    queryKey: ["my-store", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // Ignora erro de "não encontrado"
      return data;
    },
    enabled: !!user?.id,
  });

  // 2. Função para criar a loja se ela não existir
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsCreating(true);

    try {
      const { error } = await supabase.from("stores").insert({
        name: newStoreName,
        slug: newStoreSlug.toLowerCase().replace(/\s+/g, '-'), // Transforma "Burgao do Ze" em "burgao-do-ze"
        owner_id: user.id,
      });

      if (error) throw error;
      
      toast.success("Loja criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["my-store"] }); // Recarrega a tela
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar loja. O link já pode estar em uso.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  // --- CENÁRIO 1: USUÁRIO SEM LOJA (MOSTRA FORMULÁRIO) ---
  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-center">Configure sua Loja</CardTitle>
            <CardDescription className="text-center">
              Para acessar o painel, precisamos saber o nome do seu negócio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateStore} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Loja</Label>
                <Input 
                  placeholder="Ex: Hamburgueria do Eduardo" 
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Link Personalizado (Slug)</Label>
                <div className="flex items-center">
                  <span className="bg-gray-100 border border-r-0 rounded-l-md px-3 py-2 text-sm text-gray-500">
                    viana.com/
                  </span>
                  <Input 
                    className="rounded-l-none"
                    placeholder="hamburgueria-eduardo" 
                    value={newStoreSlug}
                    onChange={(e) => setNewStoreSlug(e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Este será o link que seus clientes usarão.</p>
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? <Loader2 className="animate-spin mr-2" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Criar Loja e Acessar Painel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- CENÁRIO 2: USUÁRIO COM LOJA (MOSTRA DASHBOARD) ---
// --- CENÁRIO 2: USUÁRIO COM LOJA (MOSTRA DASHBOARD) ---
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Painel Admin - {store.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/${store.slug}`, '_blank')}>
            Ver minha Loja
          </Button>
        </div>
      </header>
      
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* 1. Visão Geral (Gráficos) */}
        <DashboardStats /> 
        
        {/* 2. Área Principal Dividida em Colunas */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Coluna da Esquerda (Maior): Lista de Pedidos */}
          <div className="lg:col-span-2 space-y-4">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Gerenciar Pedidos</h2>
             </div>
             {/* Passamos o ID da loja para buscar os pedidos certos */}
             <OrdersList storeId={store.id} />
          </div>

          {/* Coluna da Direita (Menor): Cardápio */}
          <div>
            <MenuManager storeId={store.id} />
          </div>

        </div>
      </main>
    </div>
  );
}
