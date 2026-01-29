import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer, Check, Truck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// Definimos os status exatos que o seu processo de hamburgueria segue
type OrderStatus = "pending" | "preparing" | "shipped" | "delivered" | "cancelled";

export default function OrdersList({ storeId }: { storeId: string }) {
  const queryClient = useQueryClient();

  // 1. Busca de Pedidos em tempo real
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as any[]; // 'any' ajuda a lidar com colunas novas no banco sem travar o TS
    },
  });

  // --- FUNÇÃO DE MUDANÇA DE STATUS (PASSO 2) ---
  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus } as any)
        .eq("id", orderId);

      if (error) throw error;

      toast.success(`Pedido movido para: ${newStatus}`);
      
      // Isso força o dashboard e a lista a se atualizarem na hora
      queryClient.invalidateQueries({ queryKey: ["orders", storeId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats", storeId] });
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  };

  // Função de Impressão para Maquininha/Térmica
  const handlePrint = (order: any) => {
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <html>
        <body style="font-family: monospace; width: 80mm; padding: 10px;">
          <h3 style="text-align: center;">PEDIDO: #${order.id.slice(0, 5)}</h3>
          <p><strong>Cliente:</strong> ${order.customer_name}</p>
          <hr>
          <p><strong>Endereço:</strong> ${order.customer_address || 'Retirada'}</p>
          <hr>
          <h4 style="text-align: right;">TOTAL: R$ ${Number(order.total).toFixed(2)}</h4>
        </body>
      </html>
    `);
    printWindow?.print();
    printWindow?.close();
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {orders?.map((order) => (
        <Card key={order.id} className={order.status === 'pending' ? "border-l-4 border-l-orange-500 shadow-md" : ""}>
          <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg">#{order.id.slice(0, 5)}</span>
                <Badge variant={order.status === 'pending' ? 'destructive' : 'secondary'}>
                  {order.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {order.customer_name} • {order.customer_address || 'Endereço não informado'}
              </p>
            </div>

            <div className="flex gap-2 w-full md:w-auto justify-end">
              <Button size="icon" variant="outline" onClick={() => handlePrint(order)}>
                <Printer className="h-4 w-4" />
              </Button>
              
              {/* Botões de Ação Baseados no Status Atual */}
              {order.status === 'pending' && (
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(order.id, 'preparing')}>
                  <Check className="mr-2 h-4 w-4" /> Aceitar
                </Button>
              )}
              
              {order.status === 'preparing' && (
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => updateStatus(order.id, 'shipped')}>
                  <Truck className="mr-2 h-4 w-4" /> Despachar
                </Button>
              )}

              {order.status === 'shipped' && (
                <Button className="bg-slate-800 hover:bg-slate-900 text-white" onClick={() => updateStatus(order.id, 'delivered')}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Concluir
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}