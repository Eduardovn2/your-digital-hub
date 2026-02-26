import { useState, useEffect } from "react";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { useAuth } from "@/contexts/AuthContext";
import { useMyStore } from "@/hooks/useStores";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom"; 

import { 
  Menu, 
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

import { OrdersList } from "@/components/dashboard/OrdersList";
import { StoreProducts } from "@/components/dashboard/StoreProducts";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { toast } from "sonner";

export default function Admin() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams(); 
  
  const { 
    data: store, 
    isLoading, 
    refetch, 
    isError 
  } = useMyStore(user?.id);
  
  useRealtimeOrders(store?.id);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    
    if (paymentStatus === "success") {
      toast.success("Pagamento aprovado! Bem-vindo ao VianaEcommerce 🎉");
      searchParams.delete("payment");
      setSearchParams(searchParams);
    } else if (paymentStatus === "pending") {
      toast.info("Seu pagamento está sendo processado.");
      searchParams.delete("payment");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (user?.id) {
      refetch();
    }
  }, [user?.id, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4 font-sans antialiased">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-500 animate-pulse font-bold">A carregar a sua loja...</p>
      </div>
    );
  }

  if (!store && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans antialiased">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto">
              <Rocket className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Bem-vindo ao VianaEcommerce</h1>
            <p className="text-slate-500 font-medium">Parece que ainda não tem uma loja ativa.</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-primary hover:bg-primary/10 font-bold">
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

  const navigationItems = [
    { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { id: "orders", label: "Pedidos", icon: ShoppingBag },
    { id: "menu", label: "Cardápio", icon: UtensilsCrossed },
    { id: "printing", label: "Impressora", icon: Printer },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white font-sans antialiased"> 
      <div className="p-6 border-b border-white/5 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-400 flex items-center justify-center font-black text-white shrink-0 shadow-lg shadow-indigo-500/20">
              {store?.name?.substring(0,1).toUpperCase() || "V"}
            </div>
            <div className="truncate">
              <h1 className="font-black text-lg leading-none truncate tracking-tight">{store?.name}</h1>
              <p className="text-[10px] text-indigo-300/60 mt-1 flex items-center gap-1 font-black uppercase tracking-tighter">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Loja Online
              </p>
            </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all duration-300 tracking-tight ${
              activeTab === item.id 
                ? "bg-white/10 text-white border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <item.icon className={`h-5 w-5 transition-colors ${activeTab === item.id ? "text-indigo-400" : "text-slate-500"}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 bg-black/20">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold" 
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans antialiased tracking-tight">
      <style>
        {`
          .admin-container *, .admin-container button, .admin-container input {
            font-family: inherit !important;
          }
        `}
      </style>
      
      <aside className="hidden md:flex w-72 flex-shrink-0 flex-col h-full border-r border-slate-200">
        <SidebarContent />
      </aside>

      <main className="flex-1 overflow-x-hidden overflow-y-auto h-full bg-slate-50 relative admin-container">
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
          
          <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm md:bg-transparent md:p-0 md:shadow-none sticky top-0 z-10 md:relative">
            <div className="flex items-center gap-3">
              <div className="md:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-100">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 border-none w-72">
                    <SidebarContent />
                  </SheetContent>
                </Sheet>
              </div>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 capitalize tracking-tighter">
                {navigationItems.find(item => item.id === activeTab)?.label}
              </h2>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white border-slate-200 hover:bg-slate-50 transition-colors shadow-sm font-bold rounded-xl"
              onClick={() => window.open(`/${store!.slug}`, '_blank')}
            >
              <Store className="h-4 w-4 mr-2 text-indigo-600" /> 
              <span className="hidden sm:inline">Ver Loja Online</span>
            </Button>
          </header>

          <div className="animate-in fade-in duration-500 pb-10">
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                <DashboardStats storeId={store!.id} />
                <div className="mt-8">
                   <h3 className="text-lg font-black mb-4 text-slate-800 tracking-tight">Pedidos Recentes</h3>
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