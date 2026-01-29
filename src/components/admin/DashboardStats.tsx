import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Users, TrendingUp, Loader2 } from "lucide-react";

export default function DashboardStats() {
  
  // Busca os pedidos para calcular os totais
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Pega todos os pedidos finalizados (status não é 'cancelled')
      const { data: orders, error } = await supabase
        .from("orders")
        .select("total, status")
        .neq("status", "cancelled");

      if (error) throw error;

      // Calcula os totais matematicamente
      const totalRevenue = orders.reduce((acc, order) => acc + Number(order.total), 0);
      const totalOrders = orders.length;
      const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        revenue: totalRevenue,
        orders: totalOrders,
        average: averageTicket,
      };
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* CARD 1: Faturamento Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {stats?.revenue.toFixed(2).replace('.', ',')}
          </div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            +20.1% em relação ao mês passado
          </p>
        </CardContent>
      </Card>

      {/* CARD 2: Total de Pedidos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pedidos Realizados</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.orders}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Total de vendas processadas
          </p>
        </CardContent>
      </Card>

      {/* CARD 3: Ticket Médio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {stats?.average.toFixed(2).replace('.', ',')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Valor médio por pedido
          </p>
        </CardContent>
      </Card>
    </div>
  );
}