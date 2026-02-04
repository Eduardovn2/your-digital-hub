import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Search, RefreshCw, AlertCircle, MapPin } from "lucide-react";
import { getDistance } from "geolib";
import { useToast } from "@/components/ui/use-toast";

interface DeliveryRule {
  max_km: number;
  price: number;
}

export interface AddressData {
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
  storeId: string;
}

const FRETE_FIXO_SEGURANCA = 15.00; 

export function DeliveryAddressForm({ onAddressComplete, storeId }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [storeAddress, setStoreAddress] = useState<{
    cep: string, rua?: string, numero?: string, bairro?: string, cidade?: string
  } | null>(null);
  
  const [step, setStep] = useState<1 | 2>(1); 
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [rules, setRules] = useState<DeliveryRule[]>([]);
  
  const [address, setAddress] = useState<AddressData>({
    cep: "", rua: "", numero: "", bairro: "", cidade: "", complemento: "", referencia: ""
  });

  const [freteCalculado, setFreteCalculado] = useState<number | null>(null);
  const [isSimulado, setIsSimulado] = useState(false);

  // 1. CARREGAMENTO INTELIGENTE (COM FALLBACK)
  useEffect(() => {
    async function loadData() {
      try {
        // A. Busca Loja (Tenta com ID, se falhar pega a primeira para não quebrar)
        let queryLoja = supabase.from("stores").select("zip_code, street_number, neighborhood, id");
        if (storeId) {
            queryLoja = queryLoja.eq("id", storeId);
        }
        const { data: storeData } = await queryLoja.limit(1).maybeSingle();

        if (storeData) {
            const loja = storeData as any;
            // Configura endereço da loja
            if (loja.zip_code) {
                const cepLimpo = String(loja.zip_code).replace(/\D/g, "");
                let ruaLoja = "";
                let cidadeLoja = "Rio de Janeiro";
                
                try {
                  const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
                  if(res.ok) {
                    const dadosApi = await res.json();
                    ruaLoja = dadosApi.street;
                    cidadeLoja = dadosApi.city;
                  }
                } catch(e) {}

                setStoreAddress({
                  cep: cepLimpo,
                  rua: ruaLoja, 
                  numero: loja.street_number, 
                  bairro: loja.neighborhood, 
                  cidade: cidadeLoja
                });
            }

            // B. BUSCA REGRAS (O PULO DO GATO PARA CORRIGIR O R$ 15,00)
            // 1. Tenta buscar regras ESPECÍFICAS dessa loja
            let { data: rulesData } = await supabase
                .from("delivery_rules" as any)
                .select("max_km, price")
                .eq("store_id", storeId) // Tenta filtrar
                .order("max_km", { ascending: true });

            // 2. Se não achou nada (array vazio), busca regras GERAIS (sem filtro)
            // Isso resolve o problema se o banco ainda não tiver os IDs vinculados
            if (!rulesData || rulesData.length === 0) {
                console.log("⚠️ Regras específicas não encontradas. Buscando regras gerais...");
                const { data: allRules } = await supabase
                    .from("delivery_rules" as any)
                    .select("max_km, price")
                    .order("max_km", { ascending: true });
                rulesData = allRules;
            }

            if (rulesData) {
                const regrasFormatadas = rulesData.map((r: any) => ({
                    max_km: Number(r.max_km),
                    price: Number(r.price)
                }));
                console.log("✅ Regras de Frete Carregadas:", regrasFormatadas);
                setRules(regrasFormatadas);
            }
        }
      } catch (err) {
        console.error("Erro loadData:", err);
      }
    }
    loadData();
  }, [storeId]);

  async function buscarCoordenadasPorTexto(rua: string, numero: string, bairro: string, cidade: string) {
    try {
        const query = `${rua}, ${numero || ''}, ${bairro || ''}, ${cidade}, Brazil`;
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`, {
             headers: { 'User-Agent': 'VianaHub-App' }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (e) {
        return null;
    }
  }

  const handleBuscarCep = async () => {
    setErroMsg(null);
    setIsSimulado(false);
    const cepLimpo = address.cep.replace(/\D/g, "");
    
    if (cepLimpo.length !== 8) {
      toast({ title: "CEP Inválido", description: "O CEP deve ter 8 dígitos.", variant: "destructive" });
      return;
    }

    setLoading(true);
    let dadosEncontrados: any = null;
    let clienteCoords: { latitude: number; longitude: number } | null = null;
    let lojaCoords: { latitude: number; longitude: number } | null = null;

    try {
      if (!storeAddress?.cep) throw new Error("Loja sem endereço configurado.");

      // Mesmo CEP = Frete Mínimo
      if (cepLimpo === storeAddress.cep) {
          const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
          const dados = await res.json();
          const novoEndereco = {
            ...address,
            rua: dados.street || "",
            bairro: dados.neighborhood || "",
            cidade: dados.city || ""
          };
          setAddress(novoEndereco);
          const precoMinimo = rules.length > 0 ? rules[0].price : 0;
          aplicarFrete(novoEndereco, precoMinimo);
          setLoading(false);
          return;
      }

      // Busca Cliente
      const resCliente = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
      if (!resCliente.ok) throw new Error("CEP não encontrado.");
      dadosEncontrados = await resCliente.json();

      const novoEndereco = {
        ...address,
        rua: dadosEncontrados.street || "",
        bairro: dadosEncontrados.neighborhood || "",
        cidade: dadosEncontrados.city || ""
      };
      setAddress(novoEndereco);

      // Coordenadas
      if (dadosEncontrados.street) {
          clienteCoords = await buscarCoordenadasPorTexto(
            dadosEncontrados.street, "", dadosEncontrados.neighborhood, dadosEncontrados.city
          );
      }
      if (!clienteCoords) {
          try {
             const resv2 = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`);
             const dataV2 = await resv2.json();
             if (dataV2.location?.coordinates?.latitude) {
               clienteCoords = { latitude: parseFloat(dataV2.location.coordinates.latitude), longitude: parseFloat(dataV2.location.coordinates.longitude) };
             }
          } catch(e) {}
      }

      if (storeAddress.rua) {
          lojaCoords = await buscarCoordenadasPorTexto(
             storeAddress.rua, storeAddress.numero || "", storeAddress.bairro || "", storeAddress.cidade || ""
          );
      }
      if (!lojaCoords) {
        // Tenta fallback V2 para loja
         try {
            const resLojaV2 = await fetch(`https://brasilapi.com.br/api/cep/v2/${storeAddress.cep}`);
            const dataLojaV2 = await resLojaV2.json();
            if (dataLojaV2.location?.coordinates?.latitude) {
                lojaCoords = { latitude: parseFloat(dataLojaV2.location.coordinates.latitude), longitude: parseFloat(dataLojaV2.location.coordinates.longitude) };
            }
         } catch(e) {}
      }

      if (!clienteCoords || !lojaCoords) {
         throw { simulacao: true };
      }

      const distMetros = getDistance(
        { latitude: lojaCoords.latitude, longitude: lojaCoords.longitude },
        { latitude: clienteCoords.latitude, longitude: clienteCoords.longitude }
      );
      const distKm = distMetros / 1000;
      console.log(`📏 Distância Real: ${distKm.toFixed(2)}km`);

      if (distKm > 150) throw { simulacao: true };

      // Aplica Regras
      if (rules.length > 0) {
          const regraAplicavel = rules.find(r => distKm <= r.max_km);
          if (!regraAplicavel) {
            setErroMsg(`Fora da área (${distKm.toFixed(1)}km).`);
            setFreteCalculado(null);
          } else {
            console.log(`✅ Regra Encontrada: Até ${regraAplicavel.max_km}km = R$ ${regraAplicavel.price}`);
            aplicarFrete(novoEndereco, regraAplicavel.price);
          }
      } else {
          // Se chegou aqui e rules está vazio, vai pro catch
          throw { simulacao: true };
      }

    } catch (error: any) {
      if (typeof error === 'string' && error.includes("Fora")) {
        // Erro legítimo de área
      } else {
          // Se deu erro de GPS ou falta de regras -> R$ 15.00
          console.log("⚠️ Falha no cálculo exato. Usando modo de segurança.");
          setIsSimulado(true);
          const enderecoFallback = {
            ...address,
            rua: dadosEncontrados?.street || address.rua || "",
            bairro: dadosEncontrados?.neighborhood || "",
            cidade: dadosEncontrados?.city || ""
          };
          aplicarFrete(enderecoFallback, FRETE_FIXO_SEGURANCA);
      }
    } finally {
      setLoading(false);
    }
  };

  const aplicarFrete = (dadosEndereco: AddressData, valor: number) => {
    setFreteCalculado(valor);
    setStep(2);
    onAddressComplete(dadosEndereco, valor);
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
                <Input 
                    placeholder="Digite seu CEP" 
                    value={address.cep}
                    onChange={e => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2");
                        setAddress(prev => ({...prev, cep: v}));
                    }}
                    maxLength={9}
                    className="bg-white border-slate-200 focus:bg-white text-slate-900 placeholder:text-slate-500 shadow-sm font-medium"
                    disabled={step === 2} 
                />
            </div>
            {step === 1 && (
                <Button onClick={handleBuscarCep} disabled={loading} size="icon" className="bg-slate-800 hover:bg-slate-900 text-white shadow-md">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                </Button>
            )}
            {step === 2 && (
                <Button variant="outline" size="icon" onClick={() => { setStep(1); setFreteCalculado(null); setErroMsg(null); }} className="border-red-200 text-red-500 hover:bg-red-50 bg-white">
                    <RefreshCw className="h-4 w-4"/>
                </Button>
            )}
      </div>

      {erroMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-start gap-2 mb-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{erroMsg}</span>
          </div>
      )}

      {step === 2 && freteCalculado !== null && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="border-b border-slate-200 pb-3 mb-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Entregar em:</p>
              {address.rua ? (
                  <p className="text-base font-bold text-slate-900 leading-tight">{address.rua}</p>
              ) : (
                  <Input 
                    value={address.rua} 
                    onChange={e => { const novo = {...address, rua: e.target.value}; setAddress(novo); aplicarFrete(novo, freteCalculado); }}
                    placeholder="Nome da Rua" className="bg-white h-8 text-sm mb-1 font-bold"
                  />
              )}
              <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-600">{address.bairro || "Bairro"} - {address.cidade || "Cidade"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${isSimulado ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}>
                      <MapPin className="h-3 w-3" />
                      Frete: R$ {freteCalculado.toFixed(2)} {isSimulado && "*"}
                  </span>
              </div>
          </div>
          <div className="flex gap-3">
              <div className="w-1/3 space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Número *</Label>
                  <Input 
                     value={address.numero} 
                     onChange={e => { 
                        const novo = {...address, numero: e.target.value}; 
                        setAddress(novo); 
                        aplicarFrete(novo, freteCalculado); // Atualiza o pai
                     }} 
                     className="bg-white h-10 border-slate-300 text-slate-900 font-medium" 
                     autoFocus 
                     placeholder="Nº" 
                  />
              </div>
              <div className="w-2/3 space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Complemento</Label>
                  <Input value={address.complemento} onChange={e => { const novo = {...address, complemento: e.target.value}; setAddress(novo); aplicarFrete(novo, freteCalculado); }} className="bg-white h-10 border-slate-300 text-slate-900" placeholder="Apto, Bloco..." />
              </div>
          </div>
          <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Referência</Label>
              <Input value={address.referencia} onChange={e => { const novo = {...address, referencia: e.target.value}; setAddress(novo); aplicarFrete(novo, freteCalculado); }} className="bg-white h-10 border-slate-300 text-slate-900" placeholder="Ex: Portão preto" />
          </div>
        </div>
      )}
    </div>
  );
}