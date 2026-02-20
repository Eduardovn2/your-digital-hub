import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard"; 
import { Loader2, CreditCard, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function PaymentMock() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Lê a URL quando a página carrega para ver se houve erro no pagamento
  useEffect(() => {
    if (searchParams.get("payment") === "failed") {
      toast.error("O pagamento foi recusado ou cancelado. Por favor, tente novamente.");
      searchParams.delete("payment");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handlePayment = async () => {
    if (!user) {
        toast.error("Usuário não autenticado.");
        return;
    }

    setIsLoading(true);

    try {
      // Chama a Edge Function que você criou no Supabase
      const { data, error } = await supabase.functions.invoke(
        'create-mercadopago-checkout', 
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
      setIsLoading(false);
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
              <CreditCard className="h-8 w-8 text-primary drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assinatura Lojista</h1>
            <p className="text-slate-500 mt-2">
              Invista <span className="text-slate-900 font-bold">R$ 69,90/mês</span> para ter sua loja online completa.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="text-center space-y-4 animate-in fade-in duration-500">
                <p className="text-sm text-slate-600 mb-6">
                    Você será redirecionado para o ambiente seguro do Mercado Pago para concluir a sua assinatura.
                </p>

                <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 justify-center pb-4">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>Pagamento 100% seguro e criptografado.</span>
                </div>

                <Button 
                    onClick={handlePayment} 
                    className="w-full h-14 font-bold bg-slate-900 text-white rounded-xl shadow-lg hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2" 
                    disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Gerando Link Seguro...
                    </>
                  ) : (
                    <>
                        Pagar no Mercado Pago <ExternalLink className="h-4 w-4"/>
                    </>
                  )}
                </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}