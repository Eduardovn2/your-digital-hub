import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Se não tiver, use Input
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, CheckCircle } from "lucide-react";
import { getDistance } from "geolib";
import { useToast } from "@/components/ui/use-toast";

// --- REGRAS DE PREÇO ---
const TAXAS = [
  { maxKm: 2, preco: 5.00 },
  { maxKm: 5, preco: 8.00 },
  { maxKm: 10, preco: 12.00 },
  { maxKm: 15, preco: 18.00 }
];

interface AddressData {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  complemento: string;
  referencia: string;
}

interface Props {
  onAddressComplete: (address: AddressData, frete: number) => void;
}

export function DeliveryAddressForm({ onAddressComplete }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [storeCep, setStoreCep] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1); // 1 = Digitar CEP, 2 = Completar endereço
  
  // Dados do Cliente
  const [address, setAddress] = useState<AddressData>({
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    complemento: "",
    referencia: ""
  });

  const [freteCalculado, setFreteCalculado] = useState<number | null>(null);

  // 1. Busca CEP da loja ao iniciar
// Adicione essa interface simples logo acima da função do componente (fora dela)
  // ou apenas use 'any' se quiser ser mais rápido
  
  useEffect(() => {
    async function getStoreCep() {
      // O truque está aqui: adicionamos 'as any' para calar o erro do TypeScript
      const { data } = await supabase
        .from("stores")
        .select("zip_code")
        .limit(1)
        .single();
      
      // Convertendo para 'any' para podermos acessar .zip_code sem erro vermelho
      const loja = data as any;

      if (loja?.zip_code) {
        setStoreCep(loja.zip_code.replace(/\D/g, ""));
      }
    }
    getStoreCep();
  }, []);

  // 2. Função de Busca de CEP e Cálculo
  const handleBuscarCep = async () => {
    const cepLimpo = address.cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) {
      toast({ title: "CEP Inválido", description: "Digite 8 números", variant: "destructive" });
      return;
    }

    if (!storeCep) {
      toast({ title: "Erro na Loja", description: "A loja ainda não configurou o endereço de origem.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // A. Busca dados do Cliente
      const resCliente = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`);
      if (!resCliente.ok) throw new Error("CEP não encontrado");
      const dataCliente = await resCliente.json();

      // B. Busca dados da Loja (para ter lat/long exata)
      const resLoja = await fetch(`https://brasilapi.com.br/api/cep/v2/${storeCep}`);
      const dataLoja = await resLoja.json();

      // C. Calcula Distância
      if (!dataCliente.location?.coordinates || !dataLoja.location?.coordinates) {
        throw new Error("Não foi possível calcular a rota GPS.");
      }

      const distMetros = getDistance(
        { latitude: dataLoja.location.coordinates.latitude, longitude: dataLoja.location.coordinates.longitude },
        { latitude: dataCliente.location.coordinates.latitude, longitude: dataCliente.location.coordinates.longitude }
      );
      const distKm = distMetros / 1000;

      // D. Define Preço
      const faixa = TAXAS.find(t => distKm <= t.maxKm);

      if (!faixa) {
        toast({ title: "Indisponível", description: `Muito longe (${distKm.toFixed(1)}km). Máximo 15km.`, variant: "destructive" });
        setFreteCalculado(null);
        return;
      }

      // Sucesso! Avança para etapa 2
      setFreteCalculado(faixa.preco);
      setAddress(prev => ({
        ...prev,
        rua: dataCliente.street,
        bairro: dataCliente.neighborhood,
        cidade: dataCliente.city
      }));
      setStep(2); // Mostra o resto do formulário

    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Erro ao buscar CEP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // 3. Finalizar preenchimento
  const handleConfirmar = () => {
    if (!address.numero) {
      toast({ title: "Falta o número", description: "Por favor, informe o número da casa.", variant: "destructive" });
      return;
    }
    // Envia tudo para o Pai (CustomerHub)
    if (freteCalculado !== null) {
      onAddressComplete(address, freteCalculado);
    }
  };

  return (
    <Card className="border-dashed bg-slate-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4"/> Entrega
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* ETAPA 1: CEP */}
        <div className="flex gap-2">
          <Input 
            placeholder="Seu CEP" 
            value={address.cep}
            onChange={e => {
                let v = e.target.value.replace(/\D/g, "");
                if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2");
                setAddress({...address, cep: v});
            }}
            maxLength={9}
            className="bg-white"
            disabled={step === 2} // Trava se já calculou
          />
          {step === 1 && (
            <Button onClick={handleBuscarCep} disabled={loading} size="icon">
                {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4"/>}
            </Button>
          )}
          {step === 2 && (
             <Button variant="ghost" size="sm" onClick={() => { setStep(1); setFreteCalculado(null); }} className="text-xs text-red-500">
                Trocar
             </Button>
          )}
        </div>

        {/* ETAPA 2: DADOS COMPLETOS (Só aparece se o frete for calculado) */}
        {step === 2 && freteCalculado !== null && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            
            <div className="bg-green-100 p-2 rounded text-green-800 text-sm font-bold flex justify-between">
                <span>Frete: R$ {freteCalculado.toFixed(2)}</span>
                <span className="font-normal text-xs">{address.bairro}</span>
            </div>

            <div className="space-y-1">
                <Label className="text-xs">Rua</Label>
                <Input value={address.rua} readOnly className="bg-gray-100 h-8 text-sm"/>
            </div>

            <div className="flex gap-2">
                <div className="w-1/3 space-y-1">
                    <Label className="text-xs">Número *</Label>
                    <Input 
                        value={address.numero} 
                        onChange={e => setAddress({...address, numero: e.target.value})} 
                        className="bg-white h-8"
                        autoFocus
                    />
                </div>
                <div className="w-2/3 space-y-1">
                    <Label className="text-xs">Complemento</Label>
                    <Input 
                        value={address.complemento} 
                        onChange={e => setAddress({...address, complemento: e.target.value})} 
                        className="bg-white h-8" 
                        placeholder="Apt 101, Casa B..."
                    />
                </div>
            </div>

            <div className="space-y-1">
                <Label className="text-xs">Ponto de Referência / Obs</Label>
                <Textarea 
                    value={address.referencia} 
                    onChange={e => setAddress({...address, referencia: e.target.value})} 
                    className="bg-white text-sm h-16"
                    placeholder="Ex: Portão azul, deixar na portaria..."
                />
            </div>

            <Button onClick={handleConfirmar} className="w-full bg-green-600 hover:bg-green-700">
                Confirmar Endereço
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}