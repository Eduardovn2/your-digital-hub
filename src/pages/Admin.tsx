import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyStore } from "@/hooks/useStores";
import { Button } from "@/components/ui/button";
import { Store, LayoutDashboard, UtensilsCrossed, Settings, LogOut, PlusCircle } from "lucide-react";
import { StoreSetupForm } from "@/components/dashboard/StoreSetupForm";
import { OrdersList } from "@/components/dashboard/OrdersList";
import { StoreProducts } from "@/components/dashboard/StoreProducts";
import { StoreSettings } from "@/components/dashboard/StoreSettings";
import { DashboardStats } from "@/components/dashboard/DashboardStats";

// 1. IMPORTAÇÃO CORRIGIDA (Pasta dashboard, nome DeliverySettings)
import { DeliverySettings } from "@/components/dashboard/DeliverySettings";

export default function Admin() {
  const { user, signOut } = useAuth();
  const { data: store, isLoading } = useMyStore(user?.id);
  const [activeTab, setActiveTab] = useState("dashboard");

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  // Se não tiver loja, mostra form de criação
  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Bem-vindo ao VianaHub</h1>
            <p className="text-slate-500 mt-2">Vamos configurar sua loja digital em poucos passos.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
             <StoreSetupForm userId={user?.id} />
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD PRINCIPAL
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR */}
      <aside className="md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center font-bold text-white">
               V
             </div>
             <div>
               <h1 className="font-bold text-lg leading-none">Painel</h1>
               <p className="text-xs text-slate-400 mt-1">{store.name}</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
            { id: "orders", label: "Pedidos", icon: Store },
            { id: "menu", label: "Cardápio", icon: UtensilsCrossed },
            { id: "settings", label: "Configurações", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? "bg-primary text-white shadow-neon" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 overflow-y-auto h-screen">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 capitalize">
            {activeTab === 'orders' ? 'Gerenciamento de Pedidos' : activeTab === 'dashboard' ? 'Visão Geral' : activeTab === 'menu' ? 'Cardápio' : 'Configurações'}
          </h2>
          <Button size="sm" variant="outline" className="hidden md:flex">
             <PlusCircle className="h-4 w-4 mr-2" /> Novo Item Rápido
          </Button>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in">
              <DashboardStats storeId={store.id} />
              <div className="mt-8">
                 <h3 className="text-lg font-bold mb-4">Pedidos Recentes</h3>
                 <OrdersList storeId={store.id} /> 
              </div>
            </div>
          )}

          {activeTab === "orders" && <OrdersList storeId={store.id} />}

          {activeTab === "menu" && (
            <div className="animate-fade-in">
              <StoreProducts storeId={store.id} />
            </div>
          )}

          {activeTab === "settings" && (
             <div className="animate-fade-in space-y-8">
                {/* Configurações Gerais da Loja */}
                <StoreSettings store={store} />
                

             </div>
          )}
        </div>
      </main>
    </div>
  );
}