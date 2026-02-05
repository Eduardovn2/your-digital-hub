import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Search, RefreshCw, AlertCircle, MapPin, History, ArrowRight } from "lucide-react";
import { getDistance } from "geolib";
import { useToast } from "@/components/ui/use-toast";
import { useDevice } from "@/hooks/useDevice"; // Certifique-se que criou este hook no passo anterior

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

const DEFAULT_SYSTEM_RULES: DeliveryRule[] = [
    { max_km: 3, price: 5.00 },
    { max_km: 7, price: 10.00 },
    { max_km: 12, price: 15.00 },
    { max_km: 20, price: 25.00 }
];

export function DeliveryAddressForm({ onAddressComplete, storeId }: Props) {
  const { toast } = useToast();
  const deviceId = useDevice(); // Identidade do dispositivo
  
  const [loading, setLoading] = useState(false);
  const [storeAddress, setStoreAddress] = useState<{
    cep: string, rua?: string, numero?: string, bairro?: string, cidade?: string
  } | null>(null);
  
  const [step, setStep] = useState<1 | 2>(1); 
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [rules, setRules] = useState<DeliveryRule[]>([]);
  
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]); // Histórico local

  const [address, setAddress] = useState<AddressData>({
    cep: "", rua: "", numero: "", bairro: "", cidade: "", complemento: "", referencia: ""
  });

  const [freteCalculado, setFreteCalculado] = useState<number | null>(null);

  // 1. CARREGAMENTO DOS DADOS DA LOJA E REGRAS
  useEffect(() => {
    async function loadData() {
      if (!storeId) return;

      try {
        let queryLoja = supabase.from("stores").select("zip_code, street_number, neighborhood, id");
        if (storeId) queryLoja = queryLoja.eq("id", storeId);
        const { data: storeData } = await queryLoja.limit(1).maybeSingle();

        if (storeData) {
            const loja = storeData as any;
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
                  cep: cepLimpo, rua: ruaLoja, numero: loja.street_number, 
                  bairro: loja.neighborhood, cidade: cidadeLoja
                });
            }

            // CORREÇÃO ANTERIOR: Carrega regras vinculadas à loja
            const { data: rulesData } = await supabase
                .from("delivery_rules" as any)
                .select("max_km, price")
                .eq("store_id", storeId)
                .order("max_km", { ascending: true });

            if (rulesData && rulesData.length > 0) {
                setRules(rulesData.map((r: any) => ({
                    max_km: Number(r.max_km),
                    price: Number(r.price)
                })));
            } else {
                setRules(DEFAULT_SYSTEM_RULES);
            }
        }
      } catch (err) {
        console.error("Erro loadData:", err);
      }
    }
    loadData();
  }, [storeId]);

  // 2. CORREÇÃO DO ERRO: CARREGAR ENDEREÇOS SALVOS (Com "as any")
  useEffect(() => {
    async function fetchSavedAddresses() {
        if (!deviceId) return;
        
        // "as any" resolve o erro de tipagem pois a tabela é nova
        const { data } = await supabase
            .from("customer_addresses" as any)
            .select("*")
            .eq("device_id", deviceId)
            .order("last_used_at", { ascending: false })
            .limit(3);
        
        if (data) setSavedAddresses(data);
    }
    fetchSavedAddresses();
  }, [deviceId]);

  // FUNÇÃO AUXILIAR: Salvar endereço novo no histórico
// FUNÇÃO AUXILIAR: Salvar endereço novo no histórico
  const salvarNoHistorico = async (dados: AddressData) => {
    if (!deviceId || !dados.cep || !dados.numero) return;

    try {
        // Verifica se já existe esse endereço para este device
        const { data } = await supabase
            .from("customer_addresses" as any)
            .select("id")
            .eq("device_id", deviceId)
            .eq("zip_code", dados.cep)
            .eq("number", dados.numero)
            .maybeSingle(); // Use maybeSingle para evitar erros no console se não existir

        // FORÇA O TIPO 'ANY' PARA O TYPESCRIPT NÃO RECLAMAR DO ID
        const existing = data as any;

        if (existing && existing.id) {
            // Atualiza data de uso
            await supabase
                .from("customer_addresses" as any)
                .update({ last_used_at: new Date().toISOString() })
                .eq("id", existing.id);
        } else {
            // Insere novo
            await supabase
                .from("customer_addresses" as any)
                .insert({
                    device_id: deviceId,
                    zip_code: dados.cep,
                    street: dados.rua,
                    number: dados.numero,
                    neighborhood: dados.bairro,
                    city: dados.cidade,
                    complement: dados.complemento
                });
        }
    } catch (e) {
        console.log("Erro silencioso ao salvar histórico:", e);
    }
  };

  async function buscarCoordenadasPorTexto(rua: string, numero: string, bairro: string, cidade: string) {
    try {
        const query = `${rua}, ${numero || ''}, ${bairro || ''}, ${cidade}, Brazil`;
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`, {
             headers: { 'User-Agent': 'VianaHub-App' }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
        }
        return null;
    } catch (e) { return null; }
  }

  const handleBuscarCep = async (cepOverride?: string) => {
    setErroMsg(null);
    const cepParaBuscar = cepOverride || address.cep;
    const cepLimpo = cepParaBuscar.replace(/\D/g, "");
    
    if (cepLimpo.length !== 8) {
      toast({ title: "CEP Inválido", description: "O CEP deve ter 8 dígitos.", variant: "destructive" });
      return;
    }

    setLoading(true);
    let ruaDetectada = ""; 
    
    try {
      if (!storeAddress?.cep) throw new Error("LOJA_SEM_ENDERECO");

      // Caso 1: Retirada no Local / Mesmo CEP
      if (cepLimpo === storeAddress.cep) {
          const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
          const dados = await res.json();
          
          const novoEndereco = {
              ...address, 
              cep: cepParaBuscar,
              rua: dados.street || "", 
              bairro: dados.neighborhood || "", 
              cidade: dados.city || ""
          };
          setAddress(novoEndereco);
          
          const taxaLocal = rules.length > 0 ? rules[0].price : 2.00;
          aplicarFrete(novoEndereco, taxaLocal);
          
          setLoading(false);
          return;
      }

      // Busca Dados do CEP
      const resCliente = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
      if (!resCliente.ok) throw new Error("CEP não encontrado.");
      const dadosEncontrados = await resCliente.json();
      
      ruaDetectada = dadosEncontrados.street || "";

      const novoEnderecoBase = {
        ...address, 
        cep: cepParaBuscar,
        rua: dadosEncontrados.street || "", 
        bairro: dadosEncontrados.neighborhood || "", 
        cidade: dadosEncontrados.city || ""
      };
      setAddress(novoEnderecoBase);

      // GPS e Cálculo
      let clienteCoords = null;
      if (dadosEncontrados.street) {
          clienteCoords = await buscarCoordenadasPorTexto(dadosEncontrados.street, "", dadosEncontrados.neighborhood, dadosEncontrados.city);
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

      let lojaCoords = null;
      if (storeAddress.rua) {
          lojaCoords = await buscarCoordenadasPorTexto(storeAddress.rua, storeAddress.numero || "", storeAddress.bairro || "", storeAddress.cidade || "");
      }
      if (!lojaCoords) {
         try {
            const resLojaV2 = await fetch(`https://brasilapi.com.br/api/cep/v2/${storeAddress.cep}`);
            const dataLojaV2 = await resLojaV2.json();
            if (dataLojaV2.location?.coordinates?.latitude) {
                lojaCoords = { latitude: parseFloat(dataLojaV2.location.coordinates.latitude), longitude: parseFloat(dataLojaV2.location.coordinates.longitude) };
            }
         } catch(e) {}
      }

      if (!clienteCoords || !lojaCoords) throw { erro_tecnico: true };

      const distMetros = getDistance(
        { latitude: lojaCoords.latitude, longitude: lojaCoords.longitude },
        { latitude: clienteCoords.latitude, longitude: clienteCoords.longitude }
      );
      const distKm = distMetros / 1000;

      if (distKm > 150) {
          setErroMsg(`Distância muito longa (${distKm.toFixed(0)}km).`);
          setFreteCalculado(null);
          return;
      }

      const regraAplicavel = rules.find(r => distKm <= r.max_km);
      
      if (!regraAplicavel) {
        setErroMsg(`A rota exata para '${ruaDetectada || "seu endereço"}' encontra-se indisponível ou é inviável no momento (${distKm.toFixed(1)}km). Entre em contato pelo WhatsApp.`);
        setFreteCalculado(null);
      } else {
        aplicarFrete(novoEnderecoBase, regraAplicavel.price);
      }

    } catch (error: any) {
      console.log("Erro cálculo:", error);
      if (error.message === "LOJA_SEM_ENDERECO") {
          setErroMsg("Erro na Loja: Endereço de origem não cadastrado.");
      } else {
          setErroMsg(`A rota exata para '${ruaDetectada || "seu endereço"}' encontra-se indisponível ou é inviável no momento. Entre em contato pelo WhatsApp.`);
      }
      setFreteCalculado(null);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFrete = (dadosEndereco: AddressData, valor: number) => {
    setFreteCalculado(valor);
    setStep(2);
    onAddressComplete(dadosEndereco, valor);
    
    // Tenta salvar no histórico se tiver número (se for busca por card, já tem número)
    if (dadosEndereco.numero) {
        salvarNoHistorico(dadosEndereco);
    }
  };

  const handleUseSavedAddress = (savedAddr: any) => {
    // 1. Preenche o estado visualmente
    setAddress({
        cep: savedAddr.zip_code,
        rua: savedAddr.street,
        numero: savedAddr.number,
        bairro: savedAddr.neighborhood,
        cidade: savedAddr.city,
        complemento: savedAddr.complement || "",
        referencia: "" 
    });

    // 2. Dispara o cálculo (passando CEP direto)
    handleBuscarCep(savedAddr.zip_code);
  };

  // Quando o usuário digita o número manualmente e sai do campo, salvamos também
  const handleNumeroBlur = () => {
    if (address.cep && address.numero && step === 2) {
        salvarNoHistorico(address);
    }
  };

  return (
    <div className="w-full space-y-4">
      
      {/* SEÇÃO 1: ENDEREÇOS SALVOS (GLASS CARDS) */}
      {step === 1 && savedAddresses.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2 mb-3 text-slate-500">
                <History className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Usados Recentemente</span>
            </div>
            <div className="grid gap-2">
                {savedAddresses.map((addr) => (
                    <button
                        key={addr.id}
                        onClick={() => handleUseSavedAddress(addr)}
                        disabled={loading}
                        className="group relative flex items-center justify-between p-3 text-left w-full
                                   bg-white/40 hover:bg-white/80 active:bg-white
                                   border border-white/20 hover:border-slate-300
                                   backdrop-blur-md rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 p-1.5 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
                                <MapPin className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-800" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 leading-none mb-1">
                                    {addr.street}, {addr.number}
                                </p>
                                <p className="text-[11px] text-slate-500 font-medium">
                                    {addr.neighborhood}
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                ))}
            </div>
            
            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200/60" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-50/50 px-2 text-slate-400 font-bold text-[10px]">Ou busque outro</span>
                </div>
            </div>
        </div>
      )}

      {/* SEÇÃO 2: INPUT DE CEP E BUSCA */}
      <div className="flex gap-2">
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
                    className="bg-white border-slate-200 focus:bg-white text-slate-900 placeholder:text-slate-400 shadow-sm font-medium h-11"
                    disabled={step === 2 || loading} 
                />
            </div>
            {step === 1 && (
                <Button 
                    onClick={() => handleBuscarCep()} 
                    disabled={loading || address.cep.length < 9} 
                    size="icon" 
                    className="h-11 w-11 bg-slate-900 hover:bg-slate-800 text-white shadow-md rounded-lg transition-all"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                </Button>
            )}
            {step === 2 && (
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => { setStep(1); setFreteCalculado(null); setErroMsg(null); setAddress(prev => ({...prev, cep: ""})); }} 
                    className="h-11 w-11 border-red-200 text-red-500 hover:bg-red-50 bg-white rounded-lg"
                >
                    <RefreshCw className="h-4 w-4"/>
                </Button>
            )}
      </div>

      {erroMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{erroMsg}</span>
          </div>
      )}

      {/* SEÇÃO 3: FORMULÁRIO DE DETALHES (STEP 2) */}
      {step === 2 && freteCalculado !== null && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 bg-white/60 backdrop-blur-md p-5 rounded-xl border border-white/50 shadow-sm">
          
          <div className="border-b border-slate-100 pb-3 mb-2">
              <div className="flex justify-between items-start mb-1">
                 <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Local de Entrega</p>
                 <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Frete: R$ {freteCalculado.toFixed(2)}
                 </span>
              </div>
              
              {address.rua ? (
                  <p className="text-base font-bold text-slate-800 leading-tight">{address.rua}</p>
              ) : (
                  <Input value={address.rua} onChange={e => { const novo = {...address, rua: e.target.value}; setAddress(novo); aplicarFrete(novo, freteCalculado); }} placeholder="Nome da Rua" className="bg-white h-8 text-sm mb-1 font-bold" />
              )}
              
              <p className="text-xs text-slate-500 mt-1 font-medium">{address.bairro || "Bairro"} - {address.cidade || "Cidade"}</p>
          </div>

          <div className="flex gap-3">
              <div className="w-1/3 space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-600 uppercase">Número *</Label>
                  <Input 
                    value={address.numero} 
                    onChange={e => { const novo = {...address, numero: e.target.value}; setAddress(novo); aplicarFrete(novo, freteCalculado); }} 
                    onBlur={handleNumeroBlur} // Salva no histórico ao sair do campo
                    className="bg-white h-10 border-slate-200 focus:border-slate-400 text-slate-900 font-bold text-center" 
                    autoFocus 
                    placeholder="Nº" 
                  />
              </div>
              <div className="w-2/3 space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-600 uppercase">Complemento</Label>
                  <Input 
                    value={address.complemento} 
                    onChange={e => { const novo = {...address, complemento: e.target.value}; setAddress(novo); aplicarFrete(novo, freteCalculado); }} 
                    className="bg-white h-10 border-slate-200 focus:border-slate-400 text-slate-900" 
                    placeholder="Apto, Bloco, Casa 2..." 
                  />
              </div>
          </div>
          
          <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600 uppercase">Ponto de Referência</Label>
              <Input 
                value={address.referencia} 
                onChange={e => { const novo = {...address, referencia: e.target.value}; setAddress(novo); aplicarFrete(novo, freteCalculado); }} 
                className="bg-white h-10 border-slate-200 focus:border-slate-400 text-slate-900" 
                placeholder="Ex: Portão cinza, ao lado da padaria..." 
              />
          </div>
        </div>
      )}
    </div>
  );
}