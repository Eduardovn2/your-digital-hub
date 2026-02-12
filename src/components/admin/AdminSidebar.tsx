import { useAdminSettings } from "@/contexts/AdminSettingsContext";
import { Volume2, VolumeX, LayoutDashboard, UtensilsCrossed, Settings, LogOut, ShoppingBag, Store } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  store: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  signOut: () => void;
}

export function AdminSidebar({ store, activeTab, setActiveTab, signOut }: AdminSidebarProps) {
  const { soundEnabled, toggleSound } = useAdminSettings();

  const menuItems = [
    { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { id: "orders", label: "Pedidos", icon: ShoppingBag },
    { id: "menu", label: "Cardápio", icon: UtensilsCrossed },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Cabeçalho da Sidebar */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center font-bold text-white shrink-0">
             {store?.name?.substring(0,1).toUpperCase() || "V"}
           </div>
           <div className="truncate">
             <h1 className="font-bold text-lg leading-none truncate">{store?.name}</h1>
             <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
             </p>
           </div>
        </div>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
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

      {/* Rodapé: Som e Sair */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30 space-y-4">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span>Sons</span>
          </div>
          <Switch 
            checked={soundEnabled} 
            onCheckedChange={toggleSound}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-400 hover:bg-red-900/10 hover:text-red-300" 
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </div>
    </div>
  );
}