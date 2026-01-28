import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMyStore } from "@/hooks/useStores";
import { LoginForm } from "@/components/admin/LoginForm";
import { StoreSetupForm } from "@/components/dashboard/StoreSetupForm";
import { StoreSettings } from "@/components/dashboard/StoreSettings";
import { StoreProducts } from "@/components/dashboard/StoreProducts";
import { OrdersList } from "@/components/dashboard/OrdersList";
import { DashboardStats } from "@/components/dashboard/DashboardStats"; // <--- NOVO IMPORT
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LogOut, 
  Settings, 
  Package, 
  ShoppingBag, 
  Loader2, 
  ExternalLink, 
  LayoutDashboard // <--- NOVO ICONE
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Admin() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { data: store, isLoading: storeLoading, refetch } = useMyStore(user?.id);
  
  // Mudei o padrão para iniciar já vendo os gráficos
  const [activeTab, setActiveTab] = useState("dashboard");

  // Loading state
  if (authLoading || (user && storeLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <LoginForm />;
  }

  // No store yet - show setup
  if (!store) {
    return <StoreSetupForm onSuccess={() => refetch()} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  🏪
                </div>
              )}
              <div>
                <h1 className="font-semibold text-foreground">{store.name}</h1>
                <Link 
                  to={`/${store.slug}`} 
                  target="_blank" 
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  /{store.slug}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${store.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {store.is_open ? '🟢 Aberto' : '🔴 Fechado'}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          
          {/* Mudei aqui para grid-cols-4 para caber as 4 abas */}
          <TabsList className="grid w-full grid-cols-4 mb-6">
            
            {/* NOVA ABA: Visão Geral */}
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>

            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Produtos</span>
            </TabsTrigger>
            
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
            
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
          </TabsList>

          {/* CONTEÚDO DA NOVA ABA */}
          <TabsContent value="dashboard" className="animate-in fade-in-50 duration-500">
            <DashboardStats storeId={store.id} />
          </TabsContent>

          <TabsContent value="products" className="animate-in fade-in-50 duration-500">
            <StoreProducts storeId={store.id} />
          </TabsContent>

          <TabsContent value="orders" className="animate-in fade-in-50 duration-500">
            <OrdersList storeId={store.id} />
          </TabsContent>

          <TabsContent value="settings" className="animate-in fade-in-50 duration-500">
            <StoreSettings store={store} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}