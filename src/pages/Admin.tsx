import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, PlusCircle, Store, LayoutDashboard, ClipboardList, UtensilsCrossed, Settings } from "lucide-react";
import { toast } from "sonner";

// Componentes das Abas
import DashboardStats from "@/components/admin/DashboardStats";
import OrdersList from "@/components/admin/OrdersList";
import MenuManager from "@/components/admin/MenuManager";
import DeliverySettings from "@/components/admin/DeliverySettings";

export default function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreSlug, setNewStoreSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // 1. Busca a loja do lojista logado
  const { data: store, isLoading: isLoadingStore } = useQuery({
    queryKey: ["my-store", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // 2. Notificação Sonora e Real-time para Novos Pedidos
  useEffect(() => {
    if (!store?.id) return;

    const audio = new Audio("/notification.mp3"); // Certifique-se que o arquivo existe em /public

    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders', 
          filter: `store_id=eq.${store.id}` 
        },
        (payload) => {
          audio.play().catch(() => console.log("Interação do usuário necessária para tocar som"));
          toast.info("🍔 Novo pedido recebido!");
          queryClient.invalidateQueries({ queryKey: ["orders", store.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [store?.id, queryClient]);

  // 3. Criação de Loja (Primeiro Acesso)
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsCreating(true);

    try {
      const { error } = await supabase.from("stores").insert({
        name: newStoreName,
        slug: newStoreSlug.toLowerCase().replace(/\s+/g, '-'),
        owner_id: user.id,
      });

      if (error) throw error;
      toast.success("Loja criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar loja.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoadingStore) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  // --- CENÁRIO: USUÁRIO SEM LOJA ---
  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-center">Configure sua Loja</CardTitle>
            <CardDescription className="text-center">Defina o nome do seu negócio para começar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateStore} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Loja</Label>
                <Input placeholder="Ex: Hamburgueria do Madruga" value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Link (Slug)</Label>
                <div className="flex items-center">
                  <span className="bg-gray-100 border border-r-0 rounded-l-md px-3 py-2 text-sm text-gray-500 font-mono">viana.com/</span>
                  <Input className="rounded-l-none" placeholder="hamburgueria-do-madruga" value={newStoreSlug} onChange={(e) => setNewStoreSlug(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? <Loader2 className="animate-spin mr-2" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Criar Loja
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- CENÁRIO: DASHBOARD COM ABAS ---
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Painel - {store.name}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.open(`/${store.slug}`, '_blank')}>
          Ver minha Loja
        </Button>
      </header>
      
      <main className="p-6 max-w-7xl mx-auto">
        <Tabs defaultValue="pedidos" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full lg:w-[600px] bg-white border">
            <TabsTrigger value="dashboard" className="flex gap-2">
              <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="flex gap-2 relative">
              <ClipboardList className="h-4 w-4" /> <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="cardapio" className="flex gap-2">
              <UtensilsCrossed className="h-4 w-4" /> <span className="hidden sm:inline">Cardápio</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex gap-2">
              <Settings className="h-4 w-4" /> <span className="hidden sm:inline">Taxas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardStats storeId={store.id} />
          </TabsContent>

          <TabsContent value="pedidos">
            <OrdersList storeId={store.id} />
          </TabsContent>

          <TabsContent value="cardapio">
            <MenuManager storeId={store.id} />
          </TabsContent>

          <TabsContent value="config">
            <DeliverySettings storeId={store.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}