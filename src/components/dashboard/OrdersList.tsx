import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStoreOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types/store";
import { Loader2, Package, Clock, Phone, MapPin, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";

interface OrdersListProps {
  storeId: string;
}

export function OrdersList({ storeId }: OrdersListProps) {
  // 2. CHAMAR O HOOK AQUI (logo no início)
  useRealtimeOrders(storeId);

  // O resto do teu código continua igual:
  const [page, setPage] = useState<number>(0);
  const { data: orders, isLoading } = useStoreOrders(storeId, page);
  const updateStatus = useUpdateOrderStatus();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateStatus.mutate({ orderId, status, storeId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if ((!orders || orders.length === 0) && page === 0) {
    return (
      <div className="text-center py-12 bg-card border rounded-xl">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Nenhum pedido ainda</h3>
        <p className="text-muted-foreground mt-1">
          Os pedidos dos clientes aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Pedidos</h2>
        <span className="text-sm text-muted-foreground">Página {page + 1}</span>
      </div>

      <div className="space-y-3">
        {orders?.map((order) => (
          <div key={order.id} className="bg-card border rounded-xl overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.customer_name}</span>
                      <Badge className={ORDER_STATUS_COLORS[order.status]}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(order.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {order.customer_phone}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    R$ {Number(order.total).toFixed(2).replace('.', ',')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.items?.length || 0} itens
                  </div>
                </div>
              </div>
            </div>

            {expandedOrder === order.id && (
              <div className="border-t p-4 bg-muted/30 space-y-4">
                {order.customer_address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{order.customer_address}</span>
                  </div>
                )}

                {order.notes && (
                  <div className="flex items-start gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{order.notes}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Itens do Pedido:</h4>
                  <div className="bg-background rounded-lg p-3 space-y-2">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span>
                          {item.quantity}x {item.product_name}
                          {item.notes && (
                            <span className="text-muted-foreground ml-2">({item.notes})</span>
                          )}
                        </span>
                        <span className="font-medium">
                          R$ {Number(item.subtotal).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex items-center justify-between font-medium">
                      <span>Total</span>
                      <span>R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Alterar Status:</span>
                  <Select
                    value={order.status}
                    onValueChange={(v) => handleStatusChange(order.id, v as OrderStatus)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t mt-4">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || isLoading}
          className="w-[100px]"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        
        <span className="text-sm text-muted-foreground">
          Página {page + 1}
        </span>

        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={!orders || orders.length < 20 || isLoading}
          className="w-[100px]"
        >
          Próximo
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}