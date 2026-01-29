import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, TrendingUp, Loader2 } from "lucide-react";

export default function DashboardStats({ storeId }: { storeId: string }) {
  // 1. Busca dados financeiros da loja
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", storeId],
    queryFn: async () => {
      // Selecionamos '*' ou especificamos as colunas corretas: 'total' e 'status'
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", storeId)
        .eq("status", "delivered");

      if (error) throw error;

      // Cálculo da receita total usando a coluna correta 'total'
      // Usamos o cast 'as any' para evitar o erro de coluna inexistente no tipo gerado
      const totalRevenue = orders?.reduce((acc, curr) => {
        const amount = Number((curr as any).total) || 0;
        return acc + amount;
      }, 0) || 0;

      const totalOrders = orders?.length || 0;

      return { totalRevenue, totalOrders };
    },
    enabled: !!storeId,
  });

  if (isLoading) return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse bg-slate-50 h-32" />
      ))}
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-l-4 border-l-green-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            R$ {stats?.totalRevenue.toFixed(2) || "0.00"}
          </div>
          <p className="text-xs text-green-600 font-medium">+20.1% este mês</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Entregues</CardTitle>
          <ShoppingBag className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{stats?.totalOrders || 0}</div>
          <p className="text-xs text-muted-foreground font-medium">Vendas concluídas</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            R$ {stats?.totalOrders ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : "0.00"}
          </div>
          <p className="text-xs text-muted-foreground font-medium">Média por pedido</p>
        </CardContent>
      </Card>
    </div>
  );
}