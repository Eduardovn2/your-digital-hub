import { useEffect, useState, useRef } from "react";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { Order, OrderStatus } from "@/types/store";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Clock, CheckCircle2, Truck, ChefHat, XCircle, 
  Printer, MapPin, AlertCircle, Volume2, VolumeX
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ... (Mantenha o objeto STATUS_CONFIG igual ao anterior) ...
const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any, next?: OrderStatus }> = {
  pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-600 border-yellow-200", icon: AlertCircle, next: "confirmed" },
  confirmed: { label: "Na Fila", color: "bg-blue-500/20 text-blue-600 border-blue-200", icon: Clock, next: "preparing" },
  preparing: { label: "Preparando", color: "bg-orange-500/20 text-orange-600 border-orange-200", icon: ChefHat, next: "ready" },
  ready: { label: "Pronto", color: "bg-green-500/20 text-green-600 border-green-200", icon: CheckCircle2, next: "delivering" },
  delivering: { label: "Em Entrega", color: "bg-indigo-500/20 text-indigo-600 border-indigo-200", icon: Truck, next: "delivered" },
  delivered: { label: "Entregue", color: "bg-slate-200 text-slate-600 border-slate-300", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-600 border-red-200", icon: XCircle }
};

export function OrdersList({ storeId }: { storeId: string }) {
  const { data: initialOrders, refetch } = useOrders(storeId);
  const { mutate: updateStatusMutation } = useUpdateOrderStatus();
  const [orders, setOrders] = useState<Order[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Inicializa o áudio
  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    // Tenta habilitar o som com um clique falso se possível, ou espera interação
  }, []);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.warn("Autoplay bloqueado pelo navegador:", error);
        toast.warning("Clique na página para habilitar sons de notificação.");
        setSoundEnabled(false);
      });
    }
  };

  // Botão para ativar som manualmente (Hack para contornar bloqueio do navegador)
  const enableSound = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
        audioRef.current!.currentTime = 0;
        setSoundEnabled(true);
        toast.success("Sons ativados!");
      }).catch(() => toast.error("Erro ao ativar som. Verifique se o arquivo existe."));
    }
  };

  useEffect(() => {
    if (initialOrders) setOrders(initialOrders);
  }, [initialOrders]);

  // Realtime Listener
  useEffect(() => {
    if (!storeId) return;

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` }, () => {
        toast.info("Novo pedido recebido! 🔔");
        playSound();
        refetch();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` }, () => {
        refetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [storeId, refetch]);

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    updateStatusMutation({ orderId, status: newStatus }, {
      onSuccess: () => {
        toast.success(`Pedido movido para: ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      },
      onError: () => {
        refetch();
      }
    });
  };

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const historyOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            Monitor de Cozinha
          </h2>
          <p className="text-slate-500">Gerencie os pedidos em tempo real.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={enableSound}
             className={soundEnabled ? "text-green-600" : "text-slate-400"}
           >
             {soundEnabled ? <Volume2 className="h-5 w-5 mr-2" /> : <VolumeX className="h-5 w-5 mr-2" />}
             {soundEnabled ? "Som Ativo" : "Ativar Som"}
           </Button>
           <Badge variant="outline" className="px-4 py-2 text-base bg-white shadow-sm">
             {activeOrders.length} Pedidos Ativos
           </Badge>
        </div>
      </div>

      {/* GRID KANBAN (Mantenha o código do Grid igual ao anterior, apenas copiei o início para contexto) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activeOrders.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
            <ChefHat className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-500">Tudo calmo na cozinha</h3>
            <p className="text-slate-400">Aguardando novos pedidos...</p>
          </div>
        ) : (
          activeOrders.map((order) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
            const StatusIcon = config.icon;

            return (
              <GlassCard key={order.id} className="flex flex-col border-l-4" style={{ borderLeftColor: order.status === 'pending' ? '#eab308' : '#3b82f6' }}>
                <div className="p-4 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg text-slate-800">#{order.id.slice(0, 4)}</h4>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <Badge className={`px-2 py-1 ${config.color} border`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>

                <div className="px-4 py-3 bg-slate-50/50 text-sm space-y-1">
                   <div className="font-medium text-slate-800 flex items-center gap-2">
                     <span className="truncate">{order.customer_name}</span>
                   </div>
                   {order.customer_address && (
                     <div className="text-slate-500 text-xs flex items-start gap-1">
                       <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                       <span className="line-clamp-2">{order.customer_address}</span>
                     </div>
                   )}
                </div>

                <ScrollArea className="flex-1 h-32 px-4 py-2">
                   <div className="space-y-2">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                             <span className="text-slate-700 font-medium">
                               {item.quantity}x {item.product_name || "Item"}
                             </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">Carregando itens...</p>
                      )}
                      <div className="pt-2 border-t border-dashed">
                        <p className="text-sm font-bold text-slate-800 text-right">
                          Total: {order.total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                   </div>
                </ScrollArea>

                <div className="p-4 pt-2 mt-auto grid grid-cols-2 gap-2">
                  {config.next && (
                    <Button 
                      className="col-span-2 bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all active:scale-95"
                      onClick={() => handleUpdateStatus(order.id, config.next as OrderStatus)}
                    >
                      Avançar para {STATUS_CONFIG[config.next]?.label}
                      <CheckCircle2 className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button variant="outline" size="sm" className="text-xs">
                    <Printer className="h-3 w-3 mr-1" /> Imprimir
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                  >
                    <XCircle className="h-3 w-3 mr-1" /> Cancelar
                  </Button>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      <Separator className="my-8" />
      {/* (Mantenha o histórico aqui igual ao anterior) */}
    </div>
  );
}