import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // <--- NOVO IMPORT
import { Loader2, Search, RefreshCw, AlertCircle, MapPin, History, ArrowRight, ExternalLink } from "lucide-react";
import { getDistance } from "geolib";
import { useToast } from "@/components/ui/use-toast";
import { useDevice } from "@/hooks/useDevice";

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
  const deviceId = useDevice();
  
  const [loading, setLoading] = useState(false);
  const [storeAddress, setStoreAddress] = useState<{
    cep: string, rua?: string, numero?: string, bairro?: string, cidade?: string
  } | null>(null);
  
  const [step, setStep] = useState<1 | 2>(1); 
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [rules, setRules] = useState<DeliveryRule[]>([]);
  
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  
  // ESTADO PARA CHECKBOX "SEM NÚMERO"
  const [semNumero, setSemNumero] = useState(false);

  const [address, setAddress] = useState<AddressData>({
    cep: "", rua: "", numero: "", bairro: "", cidade: "", complemento: "", referencia: ""
  });

  const [freteCalculado, setFreteCalculado] = useState<number | null>(null);

  // 1. CARREGAMENTO LOJA
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

  // 2. CARREGAR HISTÓRICO
  useEffect(() => {
    async function fetchSavedAddresses() {
        if (!deviceId) return;
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

  // 3. EFEITO PARA TRATAR O "SEM NÚMERO"
  useEffect(() => {
    if (semNumero) {
        const novo = { ...address, numero: "S/N" };
        setAddress(novo);
        if (freteCalculado !== null) aplicarFrete(novo, freteCalculado);
    } else if (address.numero === "S/N") {
        const novo = { ...address, numero: "" };
        setAddress(novo);
        // Não aplica frete ainda pois numero ficou vazio
    }
  }, [semNumero]);

  const salvarNoHistorico = async (dados: AddressData) => {
    if (!deviceId || !dados.cep || !dados.numero) return;
    try {
        const { data } = await supabase
            .from("customer_addresses" as any)
            .select("id")
            .eq("device_id", deviceId)
            .eq("zip_code", dados.cep)
            .eq("number", dados.numero)
            .maybeSingle();

        const existing = data as any;

        if (existing && existing.id) {
            await supabase
                .from("customer_addresses" as any)
                .update({ last_used_at: new Date().toISOString() })
                .eq("id", existing.id);
        } else {
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
    } catch (e) { console.log(e); }
  };

  async function buscarCoordenadasPorTexto(rua: string, numero: string, bairro: string, cidade: string) {
    try {
        const query = `${rua}, ${numero || ''}, ${bairro || ''}, ${cidade}, Brazil`;
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`, {
             headers: { 'User-Agent': 'VianaEccomerce-App' }
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
        setErroMsg(`Indisponível para esta região (${distKm.toFixed(1)}km).`);
        setFreteCalculado(null);
      } else {
        aplicarFrete(novoEnderecoBase, regraAplicavel.price);
      }

    } catch (error: any) {
      if (error.message === "LOJA_SEM_ENDERECO") {
          setErroMsg("Erro na Loja: Endereço de origem não cadastrado.");
      } else {
          setErroMsg(`Rota indisponível para '${ruaDetectada}'.`);
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
    if (dadosEndereco.numero && dadosEndereco.numero !== "S/N") {
        salvarNoHistorico(dadosEndereco);
    }
  };

  const handleUseSavedAddress = (savedAddr: any) => {
    const isSN = savedAddr.number === "S/N";
    setSemNumero(isSN);
    setAddress({
        cep: savedAddr.zip_code,
        rua: savedAddr.street,
        numero: savedAddr.number,
        bairro: savedAddr.neighborhood,
        cidade: savedAddr.city,
        complemento: savedAddr.complement || "",
        referencia: "" 
    });
    handleBuscarCep(savedAddr.zip_code);
  };

  const handleNumeroBlur = () => {
    if (address.cep && address.numero && step === 2 && !semNumero) {
        salvarNoHistorico(address);
    }
  };

return (
    <div className="w-full space-y-4">
      
      {/* SEÇÃO 1: ENDEREÇOS SALVOS */}
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
                    className="group relative flex items-center justify-between p-3 text-left w-full bg-white/40 dark:bg-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-800/60 border border-white/20 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 backdrop-blur-md rounded-xl transition-all shadow-sm"
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1.5 rounded-full bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors">
                            <MapPin className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none mb-1">
                                {addr.street}, {addr.number}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                {addr.neighborhood}
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400" />
                </button>
                ))}
            </div>
            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200/60" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50/50 px-2 text-slate-400 font-bold text-[10px]"></span></div>
            </div>
        </div>
      )}

      {/* SEÇÃO 2: INPUT DE CEP */}
      <div className="space-y-1.5"> 
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
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white h-11 focus:ring-1 focus:ring-primary transition-all"
                        disabled={step === 2 || loading} 
                    />
                </div>
                {step === 1 ? (
                    <Button onClick={() => handleBuscarCep()} disabled={loading || address.cep.length < 9} size="icon" className="h-11 w-11 bg-slate-900 text-white rounded-lg">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                    </Button>
                ) : (
                    <Button variant="outline" size="icon" onClick={() => { setStep(1); setFreteCalculado(null); setErroMsg(null); }} className="h-11 w-11 border-red-200 text-red-500 bg-white rounded-lg">
                        <RefreshCw className="h-4 w-4"/>
                    </Button>
                )}
          </div>

          {step === 1 && (
            <div className="flex justify-end px-1">
                <a 
                    href="https://buscacepinter.correios.com.br/app/endereco/index.php" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-medium flex items-center gap-1 transition-colors"
                >
                    Não sabe seu CEP? Clique aqui para descobrir
                    <ExternalLink className="h-2.5 w-2.5" />
                </a>
            </div>
          )}
      </div>

      {erroMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{erroMsg}</span>
          </div>
      )}

      {/* SEÇÃO 3: FORMULÁRIO DE DETALHES */}
{/* SEÇÃO 3: FORMULÁRIO DE DETALHES */}
{step === 2 && freteCalculado !== null && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md p-5 rounded-xl border border-white/50 dark:border-white/5 shadow-sm">
            
            <div className="border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-2">
                <div className="flex justify-between items-start mb-1">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Local de Entrega</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1 shadow-sm">
                        <MapPin className="h-3 w-3" />
                        R$ {freteCalculado.toFixed(2)}
                    </span>
                </div>
                {address.rua ? (
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">{address.rua}</p>
                ) : (
                    <Input 
                    value={address.rua} 
                    onChange={e => { const novo = {...address, rua: e.target.value}; setAddress(novo); aplicarFrete(novo, freteCalculado); }} 
                    placeholder="Nome da Rua" 
                    className="bg-white dark:bg-slate-800 h-10 text-sm mb-1 font-bold dark:text-white border-slate-200 dark:border-slate-700" 
                    />
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{address.bairro || "Bairro"} - {address.cidade || "Cidade"}</p>
            </div>

            <div className="flex gap-3">
                <div className="w-1/3 space-y-2">
                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-200 uppercase">Número *</Label>
                    <Input 
                    value={address.numero} 
                    onChange={e => { 
                        const val = e.target.value.replace(/\D/g, ""); 
                        const novo = {...address, numero: val}; 
                        setAddress(novo); 
                        aplicarFrete(novo, freteCalculado); 
                    }} 
                    onBlur={handleNumeroBlur} 
                    disabled={semNumero}
                    className="bg-white dark:bg-slate-800 h-11 border-slate-200 dark:border-slate-700 font-bold text-center dark:text-white placeholder:dark:text-slate-500 focus:dark:bg-slate-700 transition-all shadow-sm" 
                    placeholder="Nº" 
                    inputMode="numeric"
                    />
                    
                    <div className="flex items-center space-x-2 pt-1">
                    <Checkbox 
                        id="semNumero" 
                        checked={semNumero}
                        onCheckedChange={(checked) => setSemNumero(checked === true)}
                        className="dark:border-slate-500 dark:data-[state=checked]:bg-primary dark:data-[state=checked]:border-primary"
                    />
                    <label htmlFor="semNumero" className="text-[10px] font-medium leading-none text-slate-500 dark:text-slate-400 cursor-pointer">
                        Sem número
                    </label>
                    </div>
                </div>

                <div className="w-2/3 space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-200 uppercase">
                        Complemento {semNumero && <span className="text-red-500">*</span>}
                    </Label>
                    <Input 
                    value={address.complemento} 
                    onChange={e => { const novo = {...address, complemento: e.target.value}; setAddress(novo); aplicarFrete(novo, freteCalculado); }} 
                    className={`bg-white dark:bg-slate-800 h-11 border-slate-200 dark:border-slate-700 dark:text-white placeholder:dark:text-slate-500 focus:dark:bg-slate-700 transition-all shadow-sm ${semNumero && !address.complemento ? "border-red-300 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20" : ""}`}
                    placeholder={semNumero ? "Obrigatório" : "Apto, Bloco..."} 
                    />
                </div>
            </div>
            
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-200 uppercase">
                    Ponto de Referência {semNumero && <span className="text-red-500">*</span>}
                </Label>
                <Input 
                value={address.referencia} 
                onChange={e => { const novo = {...address, referencia: e.target.value}; setAddress(novo); aplicarFrete(novo, freteCalculado); }} 
                className={`bg-white dark:bg-slate-800 h-11 border-slate-200 dark:border-slate-700 dark:text-white placeholder:dark:text-slate-500 focus:dark:bg-slate-700 transition-all shadow-sm ${semNumero && !address.referencia ? "border-red-300 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20" : ""}`}
                placeholder={semNumero ? "Obrigatório" : "Ex: Ao lado da padaria..."} 
                />
            </div>
        </div>
        )}
    </div>
  );
}
