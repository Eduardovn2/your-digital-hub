import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Loader2, DollarSign, ShoppingBag, TrendingUp, Eye, EyeOff, Lock, ShieldCheck, Mail, AlertCircle } from "lucide-react";
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

  // --- Estados de Recuperação de PIN ---
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function loadStats() {
      if (!storeId) return;

      try {
        setIsLoading(true);
        // Estratégia B: Frontend Puro
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

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setUserEmail(user.email);

      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();

    const storedPin = localStorage.getItem("@VianaEccomerce-admin-pin");
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
      localStorage.setItem("@VianaEccomerce-admin-pin", pinInput);
      setHasStoredPin(true);
      setAreValuesVisible(true);
      setIsPinDialogOpen(false);
      toast.success("PIN criado com sucesso!");
    } else {
      const stored = localStorage.getItem("@VianaEccomerce-admin-pin");
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

  const handleStartRecovery = async () => {
    if (!userEmail) {
        toast.error("Erro ao identificar seu e-mail.");
        return;
    }

    setIsSendingEmail(true);
    try {
        const { error } = await supabase.auth.signInWithOtp({
            email: userEmail,
            options: {
                shouldCreateUser: false,
            }
        });

        if (error) throw error;

        setIsRecoveryMode(true);
        toast.success(`Código enviado para ${userEmail}`);
    } catch (error) {
        console.error("Erro ao enviar código:", error);
        toast.error("Erro ao enviar e-mail. Verifique sua conexão.");
    } finally {
        setIsSendingEmail(false);
    }
  };

  const handleVerifyRecoveryCode = async () => {
    // CORREÇÃO: Aceita códigos maiores que 6 dígitos
    if (!recoveryCode || recoveryCode.length < 6) {
        toast.error("Digite o código completo recebido no e-mail.");
        return;
    }

    setIsSendingEmail(true); 
    try {
        const { error } = await supabase.auth.verifyOtp({
            email: userEmail,
            token: recoveryCode,
            type: 'magiclink', 
        });
        
        if (error) {
            // Tenta o tipo 'email' caso 'magiclink' falhe
            const { error: error2 } = await supabase.auth.verifyOtp({
                email: userEmail,
                token: recoveryCode,
                type: 'email', 
            });
            if (error2) throw error2;
        }

        localStorage.removeItem("@VianaEccomerce-admin-pin");
        setHasStoredPin(false);
        setAreValuesVisible(false);
        setPinInput("");
        setIsRecoveryMode(false);
        setRecoveryCode("");
        
        setTimeout(() => {
            setIsPinDialogOpen(true);
            toast.success("Sucesso! Crie seu novo PIN.");
        }, 100);

    } catch (error) {
        console.error("Erro na verificação:", error);
        toast.error("Código inválido ou expirado.");
    } finally {
        setIsSendingEmail(false);
    }
  };

  const safeChartData = data?.daily_stats.map(item => ({
    ...item,
    revenue: areValuesVisible ? item.revenue : 0, 
    count: item.count 
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
      
      {/* Cabeçalho de Privacidade */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-slate-500">
          {areValuesVisible ? (
             <span className="flex items-center gap-1 text-emerald-600 font-medium">
               <ShieldCheck className="h-3 w-3"/> Modo Visível
             </span>
          ) : (
             <span className="flex items-center gap-1 font-medium">
               <Lock className="h-3 w-3"/> Modo Privado
             </span>
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
            className={areValuesVisible ? "text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800 border-none shadow-md"}
        >
            {areValuesVisible ? (
                <><EyeOff className="h-4 w-4 mr-2" /> Ocultar</>
            ) : (
                <><Eye className="h-4 w-4 mr-2" /> Visualizar Dados</>
            )}
        </Button>
      </div>

      {/* MODAL DE PIN / RECUPERAÇÃO */}
      <Dialog open={isPinDialogOpen} onOpenChange={(open) => {
        if (!open) {
            setPinInput(""); 
            setIsRecoveryMode(false);
            setRecoveryCode("");
        }
        setIsPinDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-xs">
            
            {/* TELA DE RECUPERAÇÃO (CÓDIGO EMAIL) */}
            {isRecoveryMode ? (
                <>
                    <DialogHeader>
                        <DialogTitle className="text-center flex flex-col items-center gap-2">
                           <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-1">
                             <Mail className="h-5 w-5" />
                           </div>
                           Verifique seu E-mail
                        </DialogTitle>
                        <DialogDescription className="text-center text-xs px-2">
                            Enviamos um código para:<br/>
                            <span className="font-bold text-slate-900 block mt-1 bg-slate-100 py-1 rounded">{userEmail}</span>
                            <span className="block mt-2 text-amber-600 text-[10px] bg-amber-50 p-1 rounded border border-amber-100">
                                <AlertCircle className="h-3 w-3 inline mr-1" />
                                Digite o código recebido (6 a 8 dígitos).
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex justify-center py-4">
                        <Input 
                            type="text" 
                            inputMode="numeric"
                            // CORREÇÃO: Aumentado para 8 dígitos
                            maxLength={8}
                            placeholder="Código"
                            value={recoveryCode}
                            onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, ''))}
                            // Ajustado tracking para caber códigos maiores
                            className="text-center text-xl tracking-[0.2em] font-bold w-full h-12 border-2 focus-visible:ring-0 focus-visible:border-primary"
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button className="w-full" onClick={handleVerifyRecoveryCode} disabled={isSendingEmail}>
                            {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin"/> : "Confirmar Código"}
                        </Button>
                        <Button variant="ghost" className="w-full text-xs" onClick={() => setIsRecoveryMode(false)}>
                            Cancelar e Voltar
                        </Button>
                    </div>
                </>
            ) : (
                /* TELA DE PIN PADRÃO */
                <>
                    <DialogHeader>
                        <DialogTitle className="text-center">
                        {hasStoredPin ? "Digite seu PIN" : "Crie um PIN"}
                        </DialogTitle>
                        <DialogDescription className="text-center">
                        {hasStoredPin 
                            ? "Proteção ativa. Informe os 4 dígitos." 
                            : "Defina 4 números para proteger a visualização."}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex flex-col items-center gap-4 py-4">
                        <Input 
                            type="password" 
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="••••"
                            value={pinInput}
                            onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setPinInput(val);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                            className="text-center text-3xl tracking-[0.5em] font-bold w-48 h-16 border-2 focus-visible:ring-0 focus-visible:border-slate-900 rounded-xl"
                            autoFocus
                        />

                        {/* Botão de Esqueci a Senha REPOSICIONADO */}
                        {hasStoredPin && (
                            <button 
                                onClick={handleStartRecovery}
                                disabled={isSendingEmail}
                                className="text-xs text-slate-400 hover:text-primary underline decoration-dotted transition-colors flex items-center gap-1"
                            >
                                {isSendingEmail ? <Loader2 className="h-3 w-3 animate-spin"/> : null}
                                Esqueci meu PIN (Enviar código)
                            </button>
                        )}
                    </div>

                    <Button className="w-full h-12 text-md font-medium" onClick={handlePinSubmit}>
                        {hasStoredPin ? "Desbloquear" : "Salvar PIN"}
                    </Button>
                </>
            )}

        </DialogContent>
      </Dialog>

      {/* --- CARTÕES DE KPI --- */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data ? (areValuesVisible ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total_revenue) : "••••") : "..."}
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
            <div className="text-2xl font-bold">{data?.total_count}</div>
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
              {data ? (areValuesVisible ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.average_ticket) : "••••") : "..."}
            </div>
            <p className="text-xs text-muted-foreground">Média por pedido</p>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1 relative overflow-hidden group">
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