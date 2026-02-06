import { useAdminSettings } from "@/contexts/AdminSettingsContext"; // <--- Importe o Hook
import { Volume2, VolumeX } from "lucide-react";
import { Switch } from "@/components/ui/switch"; // Certifique-se de ter o componente Switch

export function AdminSidebar() {
  const { soundEnabled, toggleSound } = useAdminSettings(); // <--- Use o Hook

  return (
    <aside className="w-64 bg-slate-900 h-screen flex flex-col text-white">
      {/* ... (Seu logo e links de navegação atuais) ... */}
      
      <div className="flex-1">
          {/* Seus itens de menu aqui... */}
      </div>

      {/* --- NOVA ÁREA DE CONFIGURAÇÃO NO RODAPÉ DA SIDEBAR --- */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span>Sons de Pedido</span>
          </div>
          <Switch 
            checked={soundEnabled} 
            onCheckedChange={toggleSound}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>
      </div>
    </aside>
  );
}