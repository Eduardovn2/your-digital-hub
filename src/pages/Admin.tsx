import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyStore } from "@/hooks/useStores";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { 
  Store, 
  LayoutDashboard, 
  UtensilsCrossed, 
  Settings, 
  LogOut, 
  PlusCircle, 
  ShoppingBag,
  Rocket
} from "lucide-react";
import { StoreSetupForm } from "@/components/dashboard/StoreSetupForm";
=======
import { Store, LayoutDashboard, UtensilsCrossed, Settings, LogOut, PlusCircle, ShoppingBag } from "lucide-react";
import { StoreSetupForm } from "@/components/dashboard/StoreSetupForm"; // <--- Importando seu form completo
>>>>>>> 093c430dc1dac51bc8020f337720cdb3792580b0
import { OrdersList } from "@/components/dashboard/OrdersList";
import { StoreProducts } from "@/components/dashboard/StoreProducts";
import { StoreSettings } from "@/components/dashboard/StoreSettings";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
<<<<<<< HEAD
import { GlassCard } from "@/components/ui/GlassCard"; // <--- Importando seu componente de vidro
=======
>>>>>>> 093c430dc1dac51bc8020f337720cdb3792580b0

export default function Admin() {
  const { user, signOut } = useAuth();
  const { data: store, isLoading } = useMyStore(user?.id);
  const [activeTab, setActiveTab] = useState("dashboard");

  if (isLoading) {
<<<<<<< HEAD
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/50">
        <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary relative z-10"></div>
        </div>
      </div>
    );
=======
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
>>>>>>> 093c430dc1dac51bc8020f337720cdb3792580b0
  }

  // --- AQUI ESTÁ A MÁGICA ---
  // Se não tiver loja, mostramos o SEU componente StoreSetupForm (que tem o CEP)
  if (!store) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 selection:bg-primary/20">
        
        {/* Background Decorativo (Para o vidro funcionar bem) */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-3xl w-full space-y-8 relative z-10">
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-white/20 backdrop-blur-sm">
              <Rocket className="h-10 w-10 text-primary drop-shadow-sm" />
            </div>
            <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Bem-vindo ao VianaHub</h1>
                <p className="text-slate-500 mt-2 text-lg">Vamos configurar sua loja digital em poucos passos.</p>
            </div>
          </div>
          
          {/* Aqui usamos o GlassCard para dar o visual premium */}
          <GlassCard 
            intensity="light" 
            gradientBorder={true} 
            className="p-8 md:p-10 shadow-2xl shadow-primary/5"
          >
             <StoreSetupForm userId={user?.id} onSuccess={() => window.location.reload()} />
          </GlassCard>
=======
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Bem-vindo ao VianaHub</h1>
            <p className="text-slate-500 mt-2">Vamos configurar seu delivery completo.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
             {/* Este é o componente que pede CEP, Endereço, etc */}
             <StoreSetupForm userId={user?.id} onSuccess={() => window.location.reload()} />
          </div>
>>>>>>> 093c430dc1dac51bc8020f337720cdb3792580b0
        </div>
      </div>
    );
  }

<<<<<<< HEAD
  // --- TELA 2: DASHBOARD PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row font-sans selection:bg-primary/20">
      
      {/* SIDEBAR (Vidro Escuro Premium) */}
      <aside className="md:w-72 bg-slate-900/95 backdrop-blur-xl border-r border-white/5 text-white flex-shrink-0 flex flex-col shadow-2xl z-20 transition-all duration-300">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary to-orange-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-primary/20 ring-1 ring-white/10">
               {store.name?.substring(0,1).toUpperCase() || "V"}
             </div>
             <div className="overflow-hidden">
               <h1 className="font-bold text-lg leading-tight truncate text-white/90">{store.name}</h1>
               <div className="flex items-center gap-1.5 mt-1">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> 
                 <p className="text-xs text-slate-400 font-medium">Online</p>
               </div>
=======
  // Se já tiver loja, mostra o Dashboard normal
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <aside className="md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center font-bold text-white">
               {store.name?.substring(0,1).toUpperCase() || "V"}
             </div>
             <div>
               <h1 className="font-bold text-lg leading-none truncate w-32">{store.name}</h1>
               <p className="text-xs text-slate-400 mt-1">Online</p>
>>>>>>> 093c430dc1dac51bc8020f337720cdb3792580b0
             </div>
          </div>
        </div>

<<<<<<< HEAD
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {[
            { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
            { id: "orders", label: "Pedidos", icon: ShoppingBag },
=======
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
            { id: "orders", label: "Pedidos", icon: ShoppingBag }, // Ícone ajustado
>>>>>>> 093c430dc1dac51bc8020f337720cdb3792580b0
            { id: "menu", label: "Cardápio", icon: UtensilsCrossed },
            { id: "settings", label: "Configurações", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
<<<<<<< HEAD
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${
                activeTab === item.id 
                  ? "text-white shadow-lg shadow-primary/20 bg-gradient-to-r from-primary/90 to-primary/70" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {activeTab === item.id && (
                  <div className="absolute inset-0 bg-white/20 blur-lg" />
              )}
              <item.icon className={`h-5 w-5 relative z-10 transition-transform group-hover:scale-110 ${activeTab === item.id ? "text-white" : ""}`} />
              <span className="relative z-10">{item.label}</span>
              
              {activeTab === item.id && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
=======
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? "bg-primary text-white shadow-neon" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
>>>>>>> 093c430dc1dac51bc8020f337720cdb3792580b0
            </button>
          ))}
        </nav>

<<<<<<< HEAD
        <div className="p-4 border-t border-white/5 bg-black/20">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl h-12 gap-3"
            onClick={() => signOut()}
          >
            <LogOut className="h-5 w-5" /> Sair do Painel
=======
        <div className="p-4 border-t border-slate-800">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sair
>>>>>>> 093c430dc1dac51bc8020f337720cdb3792580b0
          </Button>
        </div>
      </aside>

<<<<<<< HEAD
      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth bg-dot-pattern">
        
        {/* Header Flutuante (Vidro Claro) */}
        <header className="sticky top-0 z-30 px-6 py-4">
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl px-6 py-3 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    {activeTab === 'orders' ? <ShoppingBag className="h-5 w-5 text-primary"/> : 
                     activeTab === 'dashboard' ? <LayoutDashboard className="h-5 w-5 text-primary"/> : 
                     activeTab === 'menu' ? <UtensilsCrossed className="h-5 w-5 text-primary"/> : 
                     <Settings className="h-5 w-5 text-primary"/>}
                    
                    {activeTab === 'orders' ? 'Gerenciamento de Pedidos' : 
                     activeTab === 'dashboard' ? 'Visão Geral' : 
                     activeTab === 'menu' ? 'Cardápio Digital' : 
                     'Configurações da Loja'}
                </h2>
                
                <div className="flex gap-3">
                    <Button size="sm" variant="outline" className="hidden md:flex rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm" onClick={() => window.open(`/${store.slug}`, '_blank')}>
                        <Store className="h-4 w-4 mr-2" /> Ver Loja Online
                    </Button>
                    
                    {activeTab === 'menu' && (
                        <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-transform active:scale-95">
                            <PlusCircle className="h-4 w-4 mr-2" /> Novo Produto
                        </Button>
                    )}
                </div>
            </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-100px)]">
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <DashboardStats storeId={store.id} />
              
              <div className="mt-8">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Pedidos Recentes</h3>
                    <Button variant="link" className="text-primary h-auto p-0" onClick={() => setActiveTab("orders")}>Ver todos</Button>
                 </div>
                 {/* Envolvendo a lista em um vidro sutil */}
                 <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm overflow-hidden">
                    <OrdersList storeId={store.id} /> 
                 </div>
=======
      <main className="flex-1 overflow-y-auto h-screen">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 capitalize">
            {activeTab === 'orders' ? 'Gerenciamento de Pedidos' : activeTab === 'dashboard' ? 'Visão Geral' : activeTab === 'menu' ? 'Cardápio' : 'Configurações'}
          </h2>
          <Button size="sm" variant="outline" className="hidden md:flex" onClick={() => window.open(`/${store.slug}`, '_blank')}>
             <Store className="h-4 w-4 mr-2" /> Ver Loja Online
          </Button>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in">
              <DashboardStats storeId={store.id} />
              <div className="mt-8">
                 <h3 className="text-lg font-bold mb-4">Pedidos Recentes</h3>
                 <OrdersList storeId={store.id} /> 
>>>>>>> 093c430dc1dac51bc8020f337720cdb3792580b0
              </div>
            </div>
          )}

<<<<<<< HEAD
          {activeTab === "orders" && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <OrdersList storeId={store.id} />
             </div>
          )}

          {activeTab === "menu" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
=======
          {activeTab === "orders" && <OrdersList storeId={store.id} />}

          {activeTab === "menu" && (
            <div className="animate-fade-in">
>>>>>>> 093c430dc1dac51bc8020f337720cdb3792580b0
              <StoreProducts storeId={store.id} />
            </div>
          )}

          {activeTab === "settings" && (
<<<<<<< HEAD
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
=======
             <div className="animate-fade-in space-y-8">
>>>>>>> 093c430dc1dac51bc8020f337720cdb3792580b0
                <StoreSettings store={store} />
             </div>
          )}
        </div>
      </main>
    </div>
  );
}