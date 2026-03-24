import { useEffect, useState, useRef, useCallback } from "react"; // Adicionado useRef, useCallback
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
  Printer, MapPin, AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useReactToPrint } from "react-to-print"; // Importe a biblioteca
import { ReceiptTemplate } from "@/components/printing/ReceiptTemplate"; // Importe o template

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any, next?: OrderStatus }> = {
  pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-600 border-yellow-200", icon: AlertCircle, next: "accepted" },
  accepted: { label: "Na Fila", color: "bg-blue-500/20 text-blue-600 border-blue-200", icon: Clock, next: "preparing" },
  preparing: { label: "Preparando", color: "bg-orange-500/20 text-orange-600 border-orange-200", icon: ChefHat, next: "ready" },
  ready: { label: "Pronto", color: "bg-green-500/20 text-green-600 border-green-200", icon: CheckCircle2, next: "delivering" },
  delivering: { label: "Em Entrega", color: "bg-indigo-500/20 text-indigo-600 border-indigo-200", icon: Truck, next: "completed" },
  completed: { label: "Entregue", color: "bg-slate-200 text-slate-600 border-slate-300", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-600 border-red-200", icon: XCircle }
};

export function OrdersList({ storeId }: { storeId: string }) {
  const { data: initialOrders, refetch } = useOrders(storeId);
  const { mutate: updateStatusMutation } = useUpdateOrderStatus();
  const [orders, setOrders] = useState<Order[]>([]);
  
  // --- LÓGICA DE IMPRESSÃO ---
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const lastPrintedId = useRef<string | null>(null);

const handlePrint = useReactToPrint({
    // Mudança aqui: de 'content' para 'contentRef' e passamos o ref direto
    contentRef: componentRef, 
    onAfterPrint: () => setOrderToPrint(null),
  });

  // Função para disparar impressão manualmente — useCallback para estabilizar a referência
  const triggerManualPrint = useCallback((order: Order) => {
    setOrderToPrint(order);
    // Pequeno delay para garantir que o React renderizou o template antes de imprimir
    setTimeout(() => {
      handlePrint();
    }, 250);
  }, [handlePrint]);

  // Sincroniza e verifica Auto-print
  useEffect(() => {
    if (initialOrders && initialOrders.length > 0) {
      setOrders(initialOrders);

      // LÓGICA AUTO-PRINT: Verifica se o pedido mais recente é novo
      const latestOrder = initialOrders[0];
      const savedSettings = localStorage.getItem("printer_settings");
      const settings = savedSettings ? JSON.parse(savedSettings) : { autoPrint: false };

      if (settings.autoPrint && latestOrder.id !== lastPrintedId.current) {
        const isDinheiro = ['dinheiro', 'cash'].includes(latestOrder.payment_method?.toLowerCase());
        const isPagamentoNaEntrega = ['pix_entrega', 'cartao_entrega'].includes((latestOrder.payment_method || '').toLowerCase());
        
        // Usamos (latestOrder.status as string) para o TS aceitar o 'paid'
        const status = latestOrder.status as string;
        // Imprime se: for dinheiro (pending), pagamento na entrega (pending), ou pago (paid)
        const deveImprimir = (isDinheiro && status === 'pending') || (isPagamentoNaEntrega && status === 'pending') || (status === 'paid');

        if (deveImprimir) {
          lastPrintedId.current = latestOrder.id;
          triggerManualPrint(latestOrder);
          toast.info("Impressão automática enviada!");
        }
      }
    }
  }, [initialOrders, triggerManualPrint]); // Bug #17: triggerManualPrint adicionado às deps


  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    updateStatusMutation({ orderId, status: newStatus }, {
      onError: () => refetch()
    });
  };

  const activeOrders = orders.filter(o => {
    // 1. Esconde pedidos que já foram finalizados ou cancelados
  if (['completed', 'cancelled'].includes(o.status)) return false;
    
    // 2. A MÁGICA: Esconde da cozinha se for PIX/Cartão ONLINE e ainda não estiver pago
    // Pagamentos na entrega (pix_entrega, cartao_entrega) devem aparecer imediatamente
    const isPagamentoNaEntrega = ['pix_entrega', 'cartao_entrega'].includes((o.payment_method || '').toLowerCase());
    const isDinheiro = ['dinheiro', 'cash'].includes(o.payment_method?.toLowerCase());
  
  // Se for PIX/Cartão ONLINE e ainda estiver 'pending', ESCONDE (cliente ainda não pagou)
  // Mas pix_entrega e cartao_entrega devem aparecer (cliente paga na entrega)
  if (o.status === 'pending' && !isDinheiro && !isPagamentoNaEntrega) {
    return false; 
  }
  
  // Se chegou aqui e o status for 'paid', 'accepted', 'preparing', etc, MOSTRA!
  return true;
  });
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* COMPONENTE DE IMPRESSÃO INVISÍVEL */}
      <div style={{ display: "none" }}>
        <ReceiptTemplate 
          ref={componentRef} 
          order={orderToPrint as any} 
          paperSize={JSON.parse(localStorage.getItem("printer_settings") || '{}').paperSize || "80mm"} 
        />
      </div>

{/* Ajustamos o items-center para items-start no mobile e md:items-center no desktop */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
  <div>
    {/* Adicionamos flex-wrap para garantir que o ícone e o texto não quebrem feio em telas minúsculas */}
    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 flex-wrap">
      <ChefHat className="h-7 w-7 md:h-8 md:w-8 text-primary shrink-0" />
      <span className="break-words">Monitor de Cozinha</span>
    </h2>
    <p className="text-sm md:text-base text-slate-500">Gerencie os pedidos em tempo real.</p>
  </div>
  <div className="flex items-center gap-2 w-full md:w-auto">
     {/* Adicionamos w-full no mobile para o badge acompanhar a largura ou manter o padrão */}
     <Badge variant="outline" className="px-4 py-2 text-sm md:text-base bg-white shadow-sm border-primary/20 text-primary font-semibold">
       {activeOrders.length} Pedidos Ativos
     </Badge>
  </div>
</div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activeOrders.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
            <ChefHat className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-500">Tudo calmo na cozinha</h3>
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
                    <div className="font-medium text-slate-800">{order.customer_name}</div>
                    <div className="text-slate-500 text-xs truncate">{order.customer_address}</div>
                    {/* Exibe Meio de Pagamento no Card */}
                    <div className="text-[10px] font-bold text-primary uppercase pt-1">
                      Pagamento: {order.payment_method}
                    </div>
                </div>

                <ScrollArea className="flex-1 h-32 px-4 py-2">
                    <div className="space-y-2">
                       {Array.isArray(order.items) && order.items.map((item: any, i: number) => (
                           <div key={i} className="flex justify-between text-sm">
                              <span className="text-slate-700 font-medium">
                                {item.quantity}x {item.product_name}
                              </span>
                           </div>
                       ))}
                       <div className="pt-2 border-t border-dashed">
                         <p className="text-sm font-bold text-slate-800 text-right">
                           Total: {Number(order.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                         </p>
                       </div>
                    </div>
                </ScrollArea>

                <div className="p-4 pt-2 mt-auto grid grid-cols-2 gap-2">
                  {config.next && (
                    <Button 
                      className="col-span-2 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                      onClick={() => handleUpdateStatus(order.id, config.next as OrderStatus)}
                    >
                      Avançar para {STATUS_CONFIG[config.next]?.label}
                      <CheckCircle2 className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* BOTÃO AGORA FUNCIONAL */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => triggerManualPrint(order)}
                  >
                    <Printer className="h-3 w-3 mr-1" /> Imprimir
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs hover:text-red-600"
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
    </div>
  );
}