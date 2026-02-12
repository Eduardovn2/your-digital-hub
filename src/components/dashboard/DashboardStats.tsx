import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Loader2, DollarSign, ShoppingBag, TrendingUp, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner"; 

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
  
  // --- Estados de Privacidade e PIN ---
  const [areValuesVisible, setAreValuesVisible] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [hasStoredPin, setHasStoredPin] = useState(false);

  useEffect(() => {
    async function loadStats() {
      if (!storeId) return;

      try {
        setIsLoading(true);
        const { data: orders, error } = await supabase
          .from('orders')
          .select('total, created_at')
          .eq('store_id', storeId)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (!orders || orders.length === 0) {
          setData({ total_revenue: 0, total_count: 0, average_ticket: 0, daily_stats: [] });
          return;
        }

        const total_revenue = orders.reduce((acc, order) => acc + Number(order.total), 0);
        const total_count = orders.length;
        const average_ticket = total_count > 0 ? total_revenue / total_count : 0;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dailyMap = new Map<string, { revenue: number; count: number }>();

        orders.forEach(order => {
          const orderDate = new Date(order.created_at);
          if (orderDate >= thirtyDaysAgo) {
            const dateKey = orderDate.toISOString().split('T')[0];
            const current = dailyMap.get(dateKey) || { revenue: 0, count: 0 };
            dailyMap.set(dateKey, {
              revenue: current.revenue + Number(order.total),
              count: current.count + 1
            });
          }
        });

        const daily_stats = Array.from(dailyMap.entries())
          .map(([date, values]) => ({ date, revenue: values.revenue, count: values.count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setData({ total_revenue, total_count, average_ticket, daily_stats });

      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();

    const storedPin = localStorage.getItem("@vianahub-admin-pin");
    if (storedPin) {
      setHasStoredPin(true);
    }
  }, [storeId]);

  const handlePinSubmit = () => {
    if (pinInput.length !== 4) {
      toast.error("O PIN deve ter 4 números.");
      return;
    }

    if (!hasStoredPin) {
      localStorage.setItem("@vianahub-admin-pin", pinInput);
      setHasStoredPin(true);
      setAreValuesVisible(true);
      setIsPinDialogOpen(false);
      toast.success("PIN criado com sucesso!");
    } else {
      const stored = localStorage.getItem("@vianahub-admin-pin");
      if (pinInput === stored) {
        setAreValuesVisible(true);
        setIsPinDialogOpen(false);
        toast.success("Acesso liberado.");
      } else {
        toast.error("PIN incorreto.");
        setPinInput(""); 
      }
    }
    setPinInput("");
  };

  const handleResetPin = () => {
    if (confirm("Deseja redefinir seu PIN? Os valores serão ocultados.")) {
      localStorage.removeItem("@vianahub-admin-pin");
      setHasStoredPin(false);
      setAreValuesVisible(false);
      setPinInput("");
      toast.info("Crie um novo PIN.");
    }
  };

  // --- BLINDAGEM CONTRA INSPEÇÃO ---
  // Se não estiver visível, retorna string fixa "••••"
  // O número real NÃO É RENDERIZADO no DOM
  const formatValue = (value: number, type: 'currency' | 'number') => {
    if (areValuesVisible) {
      if (type === 'currency') {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      }
      return value;
    }
    return "••••";
  };

  // --- PREPARAÇÃO DOS DADOS DO GRÁFICO ---
  // Aqui está a segurança real dos gráficos:
  // Se estiver bloqueado, passamos revenue = 0. 
  // Assim, o SVG gerado terá paths zerados. O inspecionar elemento não achará nada.
  const safeChartData = data?.daily_stats.map(item => ({
    ...item,
    revenue: areValuesVisible ? item.revenue : 0, // DADO FALSO SE BLOQUEADO
    count: item.count // Pedidos geralmente não são sensíveis, mas pode zerar também se quiser: (areValuesVisible ? item.count : 0)
  })) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* Botão de Controle */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-slate-500">
          {areValuesVisible ? (
             <span className="flex items-center gap-1 text-emerald-600"><ShieldCheck className="h-3 w-3"/> Modo Visível</span>
          ) : (
             <span className="flex items-center gap-1"><Lock className="h-3 w-3"/> Modo Privado</span>
          )}
        </div>
        <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
                if (areValuesVisible) {
                    setAreValuesVisible(false); 
                } else {
                    setIsPinDialogOpen(true); 
                }
            }}
            className={areValuesVisible ? "text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800 border-none"}
        >
            {areValuesVisible ? (
                <><EyeOff className="h-4 w-4 mr-2" /> Ocultar</>
            ) : (
                <><Eye className="h-4 w-4 mr-2" /> Visualizar Dados</>
            )}
        </Button>
      </div>

      {/* Modal PIN */}
      <Dialog open={isPinDialogOpen} onOpenChange={(open) => {
        if (!open) setPinInput(""); 
        setIsPinDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-xs">
            <DialogHeader>
                <DialogTitle className="text-center">
                  {hasStoredPin ? "Digite seu PIN" : "Crie um PIN de Acesso"}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {hasStoredPin 
                    ? "Informe os 4 números para visualizar." 
                    : "Defina 4 números para proteger seus dados."}
                </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
                <Input 
                    type="password" 
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="0000"
                    value={pinInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPinInput(val);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                    className="text-center text-3xl tracking-[1em] font-bold w-40 h-14"
                    autoFocus
                />
            </div>
            <DialogFooter className="flex-col gap-2 sm:gap-0">
                <Button className="w-full" onClick={handlePinSubmit}>
                    {hasStoredPin ? "Desbloquear" : "Salvar PIN"}
                </Button>
                {hasStoredPin && (
                  <Button variant="ghost" className="w-full text-xs text-muted-foreground mt-2" onClick={handleResetPin}>
                    Esqueci meu PIN
                  </Button>
                )}
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {/* O valor real NUNCA é renderizado se estiver oculto */}
            <div className="text-2xl font-bold">
              {formatValue(data.total_revenue, 'currency')}
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
              {formatValue(data.average_ticket, 'currency')}
            </div>
            <p className="text-xs text-muted-foreground">Média por pedido</p>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico de Faturamento */}
        <Card className="col-span-1 relative overflow-hidden group">
          {/* O Overlay visual ainda existe para dar o feedback ao usuário */}
          {!areValuesVisible && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-10 flex flex-col items-center justify-center text-slate-500 transition-all">
                <div className="bg-white p-3 rounded-full shadow-sm mb-2">
                  <Lock className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium">Faturamento Oculto</p>
            </div>
          )}
          
          <CardHeader>
            <CardTitle>Faturamento (30 dias)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {/* AQUI ESTÁ O SEGREDO: 
                   Passamos 'safeChartData'. Se estiver bloqueado, 'revenue' é 0.
                   O gráfico renderiza uma linha reta no zero.
                   Mesmo tirando o blur, não há dados para ver.
                */}
                <LineChart data={safeChartData}>
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
                    tickFormatter={(value) => areValuesVisible ? `R$${value}` : ''} 
                  />
                  <Tooltip 
                    formatter={(value: number) => [areValuesVisible ? `R$ ${value.toFixed(2)}` : '***', 'Faturamento']}
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

        {/* Gráfico de Volume de Pedidos */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Volume de Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeChartData}>
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