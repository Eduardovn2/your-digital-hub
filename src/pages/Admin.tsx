import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyStore } from "@/hooks/useStores";
import { Button } from "@/components/ui/button";
import { Store, LayoutDashboard, UtensilsCrossed, Settings, LogOut, PlusCircle, ShoppingBag, Rocket } from "lucide-react";
import { StoreSetupForm } from "@/components/dashboard/StoreSetupForm";
import { StoreSettings } from "@/components/dashboard/StoreSettings";
import { GlassCard } from "@/components/ui/GlassCard";

// Placeholders seguros para evitar tela branca se o componente não existir
const PlaceholderComponent = ({ title }: { title: string }) => (
  <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
    <h3 className="text-lg font-bold text-slate-700">{title}</h3>
    <p className="text-slate-500">Este módulo está em desenvolvimento.</p>
  </div>
);

// Tenta importar, se falhar, não quebra (No React padrão isso requer Lazy, mas vamos simplificar usando importação direta e condicional visual)
import { OrdersList } from "@/components/dashboard/OrdersList";
import { StoreProducts } from "@/components/dashboard/StoreProducts";
import { DashboardStats } from "@/components/dashboard/DashboardStats";

export default function Admin() {
  const { user, signOut } = useAuth();
  const { data: store, isLoading } = useMyStore(user?.id);
  const [activeTab, setActiveTab] = useState("dashboard");

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // --- TELA DE CRIAÇÃO (Se user não tem loja) ---
  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-2xl w-full space-y-8 relative z-10">
          <div className="text-center space-y-4">
            <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto">
              <Rocket className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Bem-vindo ao VianaHub</h1>
            <p className="text-slate-500">Vamos configurar sua loja digital.</p>
          </div>
          
          <GlassCard className="p-8">
             <StoreSetupForm userId={user?.id} onSuccess={() => window.location.reload()} />
          </GlassCard>
        </div>
      </div>
    );
  }

  // --- DASHBOARD PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <aside className="md:w-72 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center font-bold text-white">
               {store.name?.substring(0,1).toUpperCase() || "V"}
             </div>
             <div>
               <h1 className="font-bold text-lg leading-none truncate w-32">{store.name}</h1>
               <p className="text-xs text-slate-400 mt-1">Online</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
            { id: "orders", label: "Pedidos", icon: ShoppingBag },
            { id: "menu", label: "Cardápio", icon: UtensilsCrossed },
            { id: "settings", label: "Configurações", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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

        <div className="p-4 border-t border-slate-800">
          <Button variant="ghost" className="w-full justify-start text-red-400" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="flex justify-between items-center mb-8">
             <h2 className="text-2xl font-bold text-slate-900 capitalize">
                {activeTab === 'dashboard' ? 'Visão Geral' : activeTab}
             </h2>
             <Button variant="outline" onClick={() => window.open(`/${store.slug}`, '_blank')}>
                <Store className="h-4 w-4 mr-2" /> Ver Loja
             </Button>
          </header>

          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in">
              <DashboardStats storeId={store.id} />
              <div className="mt-8">
                 <h3 className="text-lg font-bold mb-4">Pedidos Recentes</h3>
                 <OrdersList storeId={store.id} /> 
              </div>
            </div>
          )}

          {activeTab === "orders" && <OrdersList storeId={store.id} />}

          {activeTab === "menu" && <StoreProducts storeId={store.id} />}

          {activeTab === "settings" && <StoreSettings store={store} />}
        </div>
      </main>
    </div>
  );
}