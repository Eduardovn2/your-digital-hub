import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard"; 
import { Loader2, CreditCard, ExternalLink, ShieldCheck, QrCode } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function PaymentMock() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState<string | null>(null); // Agora guarda qual botão está carregando

  // Lê a URL quando a página carrega para ver se houve erro no pagamento
  useEffect(() => {
    if (searchParams.get("payment") === "failed") {
      toast.error("O pagamento foi recusado ou cancelado. Por favor, tente novamente.");
      searchParams.delete("payment");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // A função agora recebe o tipo de pagamento
  const handlePayment = async (type: 'subscription' | 'pix') => {
    if (!user) {
        toast.error("Usuário não autenticado.");
        return;
    }

    setIsLoading(type);

    try {
      // Decide qual Edge Function chamar
      const functionName = type === 'subscription' 
        ? 'create-mercadopago-checkout' 
        : 'create-pix-checkout';

      const { data, error } = await supabase.functions.invoke(
        functionName, 
        {
          body: { 
            email: user.email, 
            userName: user.user_metadata?.full_name || "Lojista",
            userId: user.id 
          }
        }
      );

      if (error) throw error;
      if (!data?.checkoutUrl) throw new Error("Não foi possível gerar o link de pagamento.");

      // Redireciona o cliente para a tela de checkout do Mercado Pago
      window.location.href = data.checkoutUrl;

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao processar o redirecionamento de pagamento.");
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 selection:bg-primary/20">
      
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md z-10">
        <GlassCard 
          intensity="light" 
          gradientBorder={true}
          className="w-full p-8 shadow-2xl shadow-primary/5"
        >
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/20 backdrop-blur-sm">
              <ShieldCheck className="h-8 w-8 text-primary drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Liberar Acesso</h1>
            <p className="text-slate-500 mt-2">
              Escolha a forma de pagamento para ativar sua loja por <span className="text-slate-900 font-bold">R$ 69,90/mês</span>.
            </p>
          </div>
          
          <div className="space-y-4 animate-in fade-in duration-500">
            
            {/* Botão de Assinatura (Cartão) */}
            <Button 
                onClick={() => handlePayment('subscription')} 
                className="w-full h-14 font-bold bg-slate-900 text-white rounded-xl shadow-lg hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-between px-6" 
                disabled={isLoading !== null}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-blue-400" />
                <span>Assinatura (Cartão)</span>
              </div>
              {isLoading === 'subscription' ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              ) : (
                <ExternalLink className="h-4 w-4 text-slate-400"/>
              )}
            </Button>

            {/* Botão de PIX/Avulso */}
            <Button 
                onClick={() => handlePayment('pix')} 
                className="w-full h-14 font-bold bg-white text-slate-900 border-2 border-slate-200 rounded-xl shadow-sm hover:border-emerald-500 hover:text-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between px-6" 
                disabled={isLoading !== null}
            >
              <div className="flex items-center gap-3">
                <QrCode className="h-5 w-5 text-emerald-500" />
                <span>PIX ou Boleto (1 Mês)</span>
              </div>
              {isLoading === 'pix' ? (
                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              ) : (
                <ExternalLink className="h-4 w-4 text-slate-400"/>
              )}
            </Button>

            <div className="pt-4 flex items-center gap-2 text-xs text-slate-500 justify-center">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Pagamento 100% seguro via Mercado Pago.</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}