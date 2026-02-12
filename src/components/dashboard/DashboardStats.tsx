import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Loader2, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";

interface DashboardStatsProps {
  storeId: string;
}

interface StatsData {
  total_revenue: number;
  total_count: number;
  average_ticket: number;
  daily_stats: {
    date: string;
    revenue: number;
    count: number;
  }[];
}

export function DashboardStats({ storeId }: DashboardStatsProps) {
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!storeId) return;

      try {
        setIsLoading(true);
        console.log("Estratégia B: Buscando pedidos brutos para cálculo local...");

        // 1. Buscamos TODOS os pedidos válidos da loja
        const { data: orders, error } = await supabase
          .from('orders')
          .select('total, created_at')
          .eq('store_id', storeId)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (!orders || orders.length === 0) {
          setData({
            total_revenue: 0,
            total_count: 0,
            average_ticket: 0,
            daily_stats: []
          });
          return;
        }

        // 2. Cálculo dos KPIs Gerais (Matemática simples no JS)
        const total_revenue = orders.reduce((acc, order) => acc + Number(order.total), 0);
        const total_count = orders.length;
        const average_ticket = total_count > 0 ? total_revenue / total_count : 0;

        // 3. Preparação dos Gráficos (Agrupamento por dia - Últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Mapa para agrupar valores por data
        const dailyMap = new Map<string, { revenue: number; count: number }>();

        orders.forEach(order => {
          const orderDate = new Date(order.created_at);
          
          // Só considera os últimos 30 dias para o gráfico
          if (orderDate >= thirtyDaysAgo) {
            // Formata data como YYYY-MM-DD para usar como chave
            const dateKey = orderDate.toISOString().split('T')[0];
            
            const current = dailyMap.get(dateKey) || { revenue: 0, count: 0 };
            
            dailyMap.set(dateKey, {
              revenue: current.revenue + Number(order.total),
              count: current.count + 1
            });
          }
        });

        // Converte o Mapa em Array para o gráfico
        const daily_stats = Array.from(dailyMap.entries())
          .map(([date, values]) => ({
            date,
            revenue: values.revenue,
            count: values.count
          }))
          .sort((a, b) => a.date.localeCompare(b.date)); // Ordena por data

        setData({
          total_revenue,
          total_count,
          average_ticket,
          daily_stats
        });

      } catch (error) {
        console.error("Erro ao carregar estatísticas (Estratégia B):", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [storeId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* --- CARTÕES DE KPI --- */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total_revenue)}
            </div>
            <p className="text-xs text-muted-foreground">Total acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Realizados</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_count}</div>
            <p className="text-xs text-muted-foreground">Vendas concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.average_ticket)}
            </div>
            <p className="text-xs text-muted-foreground">Média por pedido</p>
          </CardContent>
        </Card>
      </div>

      {/* --- GRÁFICOS --- */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Faturamento (30 dias)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.daily_stats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    minTickGap={30}
                    tickFormatter={(val) => {
                      const date = new Date(val);
                      return `${date.getDate()}/${date.getMonth()+1}`;
                    }}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Volume de Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.daily_stats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    minTickGap={30}
                    tickFormatter={(val) => {
                      const date = new Date(val);
                      return `${date.getDate()}/${date.getMonth()+1}`;
                    }}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Pedidos"
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}