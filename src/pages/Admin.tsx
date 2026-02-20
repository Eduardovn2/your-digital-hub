import { useState, useEffect } from "react";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { useAuth } from "@/contexts/AuthContext";
import { useMyStore } from "@/hooks/useStores";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom"; 

import { 
  Menu, // <--- O ícone dos 3 traços
  Store, 
  LayoutDashboard, 
  UtensilsCrossed, 
  Settings, 
  LogOut, 
  ShoppingBag, 
  Rocket, 
  RefreshCw, 
  Printer
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { PrinterSettings } from "@/components/admin/PrinterSettings";
import { StoreSetupForm } from "@/components/dashboard/StoreSetupForm";
import { StoreSettings } from "@/components/dashboard/StoreSettings";
import { GlassCard } from "@/components/ui/GlassCard";
import { useQueryClient } from "@tanstack/react-query";

// Imports condicionais seguros
import { OrdersList } from "@/components/dashboard/OrdersList";
import { StoreProducts } from "@/components/dashboard/StoreProducts";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { toast } from "sonner";

export default function Admin() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams(); // <-- NOVO
  
  // Busca a loja do utilizador
  const { 
    data: store, 
    isLoading, 
    refetch, 
    isError 
  } = useMyStore(user?.id);
  
  useRealtimeOrders(store?.id);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Força uma atualização dos dados sempre que entrar na página
useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    
    if (paymentStatus === "success") {
      toast.success("Pagamento aprovado! Bem-vindo ao VianaEccomerce 🎉");
      searchParams.delete("payment");
      setSearchParams(searchParams);
    } else if (paymentStatus === "pending") {
      toast.info("Seu pagamento está sendo processado. Você terá acesso total assim que for confirmado.");
      searchParams.delete("payment");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Força uma atualização dos dados...
  useEffect(() => {
    if (user?.id) {
      refetch();
    }
  }, [user?.id, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-500 animate-pulse">A carregar a sua loja...</p>
      </div>
    );
  }

  // --- TELA DE CONFIGURAÇÃO INICIAL (Se não houver loja) ---
  if (!store && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto">
              <Rocket className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Bem-vindo ao VianaEccomerce</h1>
            <p className="text-slate-500">Parece que ainda não tem uma loja ativa.</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-primary hover:bg-primary/10">
                <RefreshCw className="h-4 w-4 mr-2" /> Verificar novamente
            </Button>
          </div>
          <GlassCard className="p-8">
             <StoreSetupForm 
               userId={user?.id} 
               onSuccess={() => window.location.href = "/admin"} 
             />
          </GlassCard>
        </div>
      </div>
    );
  }

  // Definição dos itens de navegação
const navigationItems = [
  { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { id: "orders", label: "Pedidos", icon: ShoppingBag },
  { id: "menu", label: "Cardápio", icon: UtensilsCrossed },
  { id: "printing", label: "Impressora", icon: Printer }, // <--- NOVO ITEM
  { id: "settings", label: "Configurações", icon: Settings },
];
  // Componente reutilizável para o conteúdo da barra lateral
  const SidebarContent = () => (
    <div className="flex flex-col h-full text-white"> {/* Adicionado text-white para garantir cor no mobile */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center font-bold text-white shrink-0">
              {store?.name?.substring(0,1).toUpperCase() || "V"}
            </div>
            <div className="truncate">
              <h1 className="font-bold text-lg leading-none truncate text-white">{store?.name}</h1>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
              </p>
            </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsMobileMenuOpen(false); // Fecha o menu mobile ao clicar
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === item.id 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 mt-auto">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-400 hover:bg-red-900/10 hover:text-red-300" 
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </div>
    </div>
  );

  // --- DASHBOARD PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR DESKTOP - Escondida no mobile (hidden md:flex) */}
      <aside className="hidden md:flex w-72 bg-slate-900 text-white flex-shrink-0 flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 overflow-y-auto min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
          
          {/* HEADER RESPONSIVO */}
          <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm md:bg-transparent md:p-0 md:shadow-none">
            <div className="flex items-center gap-3">
              
              {/* BOTÃO HAMBURGER MOBILE - Só aparece no mobile (md:hidden) */}
              <div className="md:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-100">
                      <Menu className="h-6 w-6" /> {/* Ícone dos 3 traços */}
                    </Button>
                  </SheetTrigger>
                  
                  {/* CONTEÚDO DA GAVETA MOBILE */}
                  <SheetContent side="left" className="bg-slate-900 p-0 border-none w-72">
                    <SidebarContent />
                  </SheetContent>
                </Sheet>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-slate-900 capitalize">
                {navigationItems.find(item => item.id === activeTab)?.label}
              </h2>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
              onClick={() => window.open(`/${store!.slug}`, '_blank')}
            >
              <Store className="h-4 w-4 mr-2" /> 
              <span className="hidden sm:inline">Ver Loja Online</span>
            </Button>
          </header>

          {/* RENDERIZAÇÃO DAS ABAS */}
          <div className="animate-in fade-in duration-500">
            {/* O PULO DO GATO: Usamos 'store!' para dizer ao TypeScript que o store existe aqui */}
            
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                <DashboardStats storeId={store!.id} />
                <div className="mt-8">
                   <h3 className="text-lg font-bold mb-4 text-slate-800">Pedidos Recentes</h3>
                   <OrdersList storeId={store!.id} /> 
                </div>
              </div>
            )}

            {activeTab === "orders" && <OrdersList storeId={store!.id} />}
            {activeTab === "menu" && <StoreProducts storeId={store!.id} />}
            {activeTab === "settings" && <StoreSettings store={store!} />}
            {activeTab === "printing" && (
              <div className="max-w-2xl mx-auto">
                <PrinterSettings />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}