import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard"; 
import { Loader2, CreditCard, ExternalLink, ShieldCheck, QrCode, RefreshCw, Hand } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function PaymentMock() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("payment") === "failed") {
      toast.error("O pagamento foi recusado ou cancelado. Por favor, tente novamente.");
      searchParams.delete("payment");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handlePayment = async (type: 'subscription' | 'pix') => {
    if (!user) {
        toast.error("Usuário não autenticado.");
        return;
    }

    setIsLoading(type);

    try {
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

      window.location.href = data.checkoutUrl;

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao processar o redirecionamento de pagamento.");
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 selection:bg-primary/20">
      
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
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-200 backdrop-blur-sm">
              <ShieldCheck className="h-8 w-8 text-blue-600 drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Liberar Acesso</h1>
            <p className="text-slate-500 mt-2">
              Ative sua loja online por <span className="text-slate-900 font-bold">R$ 69,90/mês</span>. Escolha seu formato ideal:
            </p>
          </div>
          
          <div className="space-y-4 animate-in fade-in duration-500">
            
            {/* Botão de Assinatura Automática (Cartão) - Azul vibrante em vez de preto */}
            <Button 
                onClick={() => handlePayment('subscription')} 
                className="w-full h-auto py-4 font-bold bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col items-start px-6 gap-1" 
                disabled={isLoading !== null}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-blue-100" />
                  <span className="text-lg">Assinatura no Cartão</span>
                </div>
                {isLoading === 'subscription' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-200" />
                ) : (
                  <ExternalLink className="h-4 w-4 text-blue-200"/>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-blue-100 font-normal text-xs bg-blue-700/50 px-2 py-1 rounded-md">
                <RefreshCw className="h-3 w-3" />
                Cobrança 100% automática todo mês
              </div>
            </Button>

            {/* Botão de PIX/Avulso Manual */}
            <Button 
                onClick={() => handlePayment('pix')} 
                className="w-full h-auto py-4 font-bold bg-white text-slate-900 border-2 border-slate-200 rounded-xl shadow-sm hover:border-emerald-500 hover:text-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col items-start px-6 gap-1" 
                disabled={isLoading !== null}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <QrCode className="h-5 w-5 text-emerald-500" />
                  <span className="text-lg">PIX ou Boleto</span>
                </div>
                {isLoading === 'pix' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                ) : (
                  <ExternalLink className="h-4 w-4 text-slate-400"/>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-slate-500 font-normal text-xs bg-slate-100 px-2 py-1 rounded-md">
                <Hand className="h-3 w-3" />
                Renovação manual a cada 30 dias
              </div>
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