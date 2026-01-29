import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, CheckCircle2 } from "lucide-react";
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
    // Redireciona para o painel de admin após pagar
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Assinatura Lojista</CardTitle>
          <CardDescription>
            Invista R$ 59,90/mês para ter sua loja online.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'form' ? (
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="card">Número do Cartão (Fictício)</Label>
                <Input id="card" placeholder="0000 0000 0000 0000" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Validade</Label>
                  <Input id="expiry" placeholder="MM/AA" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input id="cvc" placeholder="123" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome no Cartão</Label>
                <Input id="name" placeholder="Como no cartão" required />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Pagar e Criar Loja"
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
              </div>
              <h3 className="text-xl font-semibold">Tudo certo!</h3>
              <p className="text-muted-foreground">
                Seu pagamento foi confirmado. Agora você pode configurar sua loja.
              </p>
              <Button onClick={handleContinue} className="w-full bg-green-600 hover:bg-green-700">
                Acessar Painel do Lojista
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}