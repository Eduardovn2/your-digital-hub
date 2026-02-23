import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, CheckCircle, CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function SubscriptionSettings() {
  const { user } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    async function fetchStore() {
      if (!user) return;
      const { data } = await supabase
        .from('stores')
        .select('status, expires_at')
        .eq('owner_id', user.id)
        .single();
      
      setStore(data);
      setIsLoading(false);
    }
    fetchStore();
  }, [user]);

  if (isLoading) {
    return <div className="animate-pulse h-40 bg-slate-100 rounded-xl" />;
  }

  if (!store || !store.expires_at) return null;

  // Lógica Matemática do Tempo
  const now = new Date();
  const expiresAt = new Date(store.expires_at);
  const diffTime = expiresAt.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Se faltam mais de 30 dias (porque o 1º pagamento dá 45), está na garantia!
  const isRefundEligible = daysLeft > 30;

  const handleCancelSubscription = async () => {
    const confirmMessage = isRefundEligible 
      ? "Tem a certeza? A sua loja será desativada e o seu dinheiro será devolvido (Reembolso de 15 dias)."
      : "Tem a certeza? A renovação automática será cancelada, mas poderá usar a loja até ao dia do vencimento.";

    if (!window.confirm(confirmMessage)) return;

    setIsCancelling(true);
    try {
      // AQUI ENTRARÁ A NOSSA FUTURA EDGE FUNCTION DO MERCADO PAGO
      // await supabase.functions.invoke('cancel-subscription', { body: { userId: user.id, refund: isRefundEligible } });
      
      // Simulação de sucesso por agora:
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(isRefundEligible ? "Assinatura cancelada e reembolso solicitado!" : "Renovação cancelada com sucesso.");
      
    } catch (error) {
      toast.error("Erro ao cancelar assinatura. Tente novamente.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-slate-600" />
              A sua Assinatura
            </CardTitle>
            <CardDescription className="mt-1">
              Faça a gestão do seu plano VianaEccomerce e pagamentos.
            </CardDescription>
          </div>
          <Badge className={store.status === 'active' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-orange-100 text-orange-700"}>
            {store.status === 'active' ? 'Ativo' : 'Pendente'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        <div className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-lg shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Vencimento / Fim do Acesso</p>
            <p className="text-lg font-bold text-slate-900">
              {expiresAt.toLocaleDateString('pt-BR')} 
              <span className="text-sm font-normal text-slate-500 ml-2">({daysLeft} dias restantes)</span>
            </p>
          </div>
        </div>

        {/* MENSAGEM DINÂMICA DE GARANTIA VS RENOVAÇÃO */}
        <div className={`p-4 rounded-lg border flex gap-3 ${isRefundEligible ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
          {isRefundEligible ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
          )}
          
          <div>
            <h4 className={`font-semibold ${isRefundEligible ? 'text-emerald-800' : 'text-slate-700'}`}>
              {isRefundEligible ? 'Garantia Incondicional Ativa' : 'Assinatura Padrão'}
            </h4>
            <p className="text-sm text-slate-600 mt-1">
              {isRefundEligible 
                ? "Ainda está dentro do período de 15 dias de teste. Se cancelar agora, o seu dinheiro será devolvido na totalidade e a loja desativada de imediato."
                : "A sua garantia inicial já terminou. Se cancelar, não haverá novas cobranças e a loja continuará ativa até ao fim do período já pago."}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button 
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-semibold"
            onClick={handleCancelSubscription}
            disabled={isCancelling}
          >
            {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isRefundEligible ? 'Cancelar e Pedir Reembolso' : 'Cancelar Renovação Automática'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}