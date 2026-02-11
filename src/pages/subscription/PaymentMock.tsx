import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard"; // <-- Importando GlassCard
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function PaymentMock() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simula tempo de processamento do banco (2 segundos)
    setTimeout(() => {
      setIsLoading(false);
      setStep('success');
      toast.success("Pagamento aprovado com sucesso!");
    }, 2000);
  };

  const handleContinue = () => {
    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 selection:bg-primary/20">
      
      {/* Background Decorativo (Igual ao Admin) */}
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
              Invista <span className="text-slate-900 font-bold">R$ 59,90/mês</span> para ter sua loja online completa.
            </p>
          </div>
          
          <div className="space-y-6">
            {step === 'form' ? (
              <form onSubmit={handlePayment} className="space-y-5 animate-in fade-in">
                <div className="space-y-2">
                  <Label htmlFor="card" className="text-slate-600 ml-1 text-xs uppercase font-bold tracking-wider">Número do Cartão</Label>
                  <Input 
                    id="card" 
                    placeholder="0000 0000 0000 0000" 
                    required 
                    className="pl-4 h-12 bg-white/60 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-primary/10 rounded-xl transition-all shadow-sm backdrop-blur-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-slate-600 ml-1 text-xs uppercase font-bold tracking-wider">Validade</Label>
                    <Input 
                      id="expiry" 
                      placeholder="MM/AA" 
                      required 
                      className="pl-4 h-12 bg-white/60 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-primary/10 rounded-xl transition-all shadow-sm backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc" className="text-slate-600 ml-1 text-xs uppercase font-bold tracking-wider">CVC</Label>
                    <Input 
                      id="cvc" 
                      placeholder="123" 
                      required 
                      className="pl-4 h-12 bg-white/60 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-primary/10 rounded-xl transition-all shadow-sm backdrop-blur-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-600 ml-1 text-xs uppercase font-bold tracking-wider">Nome no Cartão</Label>
                  <Input 
                    id="name" 
                    placeholder="Como no cartão" 
                    required 
                    className="pl-4 h-12 bg-white/60 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-primary/10 rounded-xl transition-all shadow-sm backdrop-blur-sm"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 justify-center">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>Pagamento 100% seguro e criptografado.</span>
                </div>

                <Button type="submit" className="w-full h-14 font-bold bg-slate-900 text-white rounded-xl shadow-lg hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Pagar e Criar Loja"
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                  </div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900">Tudo certo!</h3>
                    <p className="text-slate-500 text-lg">
                    Seu pagamento foi confirmado.<br/>Agora você pode configurar sua loja.
                    </p>
                </div>
                <Button onClick={handleContinue} className="w-full h-14 font-bold text-lg bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all">
                  Acessar Painel do Lojista
                </Button>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}