import { useStoreOrders, useUpdateOrderStatus } from "@/hooks/useOrders"; // Ajuste o caminho se seu hook estiver em outro lugar
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface OrdersListProps {
  storeId: string;
}

export default function OrdersList({ storeId }: OrdersListProps) {
  // Busca os pedidos a cada 30 segundos ou quando a tela focar (padrão do React Query)
  const { data: orders, isLoading } = useStoreOrders(storeId);
  const { mutate: updateStatus } = useUpdateOrderStatus();

  const handleStatusChange = (orderId: string, newStatus: any) => {
    updateStatus({ orderId, status: newStatus, storeId });
  };

  if (isLoading) return <div className="p-4"><Loader2 className="animate-spin" /> Carregando pedidos...</div>;

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Nenhum pedido recebido ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Pedidos Recentes</h2>
      {orders.map((order) => (
        <Card key={order.id} className="overflow-hidden">
          <div className="bg-slate-50 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">#{order.id?.slice(0, 8)}</span>
                
                {/* CORREÇÃO: Usando 'confirmed' e 'delivered' que são os tipos reais */}
                <Badge variant={(
                  order.status === 'confirmed' ? 'destructive' : 
                  order.status === 'delivered' ? 'default' : 
                  'secondary'
                ) as any}>
                  {/* Tradução dos status para exibir na tela */}
                  {order.status === 'confirmed' ? 'Novo Pedido' : 
                   order.status === 'preparing' ? 'Preparando' :
                   order.status === 'delivering' ? 'Saiu pra Entrega' :
                   order.status === 'delivered' ? 'Entregue' : 
                   order.status === 'cancelled' ? 'Cancelado' : 
                   order.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {order.customer_name} • {order.created_at ? format(new Date(order.created_at), "dd/MM HH:mm") : "-"}
              </p>
            </div>
            
            <div className="flex gap-2">
              {/* Botões para QUANDO CHEGA UM PEDIDO NOVO (confirmed) */}
              {order.status === 'confirmed' && (
                <>
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(order.id, 'cancelled')}>
                    <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                  </Button>
                  <Button size="sm" onClick={() => handleStatusChange(order.id, 'preparing')}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Aceitar
                  </Button>
                </>
              )}

              {/* Botão para quando está PREPARANDO -> Mudar para SAIU PARA ENTREGA */}
              {order.status === 'preparing' && (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleStatusChange(order.id, 'delivering')}>
                  <Clock className="w-4 h-4 mr-1" /> Saiu p/ Entrega
                </Button>
              )}

              {/* Botão para quando SAIU PARA ENTREGA -> Mudar para ENTREGUE */}
              {order.status === 'delivering' && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange(order.id, 'delivered')}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Finalizar
                </Button>
              )}
            </div>
          </div>
          
          <CardContent className="p-4">
            <ul className="space-y-2">
              {order.items?.map((item: any) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.products?.name || "Item removido"}</span>
                  <span className="font-medium">R$ {((item.unit_price || 0) * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
            </div>
            {order.customer_address && (
              <div className="mt-2 text-sm bg-yellow-50 p-2 rounded text-yellow-800">
                📍 Entrega: {order.customer_address}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}