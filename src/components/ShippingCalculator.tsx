import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, Loader2, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Interface manual para a tabela que falta nos tipos globais
interface DeliveryRule {
  price: number;
  max_km: number;
}

export function ShippingCalculator({ 
  storeId, 
  storeAddress, 
  onFeeChange 
}: { 
  storeId: string, 
  storeAddress: string,
  onFeeChange?: (fee: number | null) => void 
}) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const calculateDistance = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length < 8) {
      toast.error("CEP inválido.");
      return;
    }
    
    setLoading(true);
    setDeliveryFee(null);
    setErrorMsg(null);
    if (onFeeChange) onFeeChange(null);

    try {
      console.log("📍 Iniciando cálculo exato...");

      // 1. Geolocalização do Cliente (BrasilAPI V2)
      const resClient = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
      if (!resClient.ok) throw new Error("CEP não encontrado.");
      
      const dataClient = await resClient.json();
      if (!dataClient.location?.coordinates) throw new Error("Coordenadas do CEP não encontradas.");

      const lat1 = parseFloat(dataClient.location.coordinates.latitude);
      const lon1 = parseFloat(dataClient.location.coordinates.longitude);

      // 2. Geolocalização da Loja (Nominatim)
      const resStore = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(storeAddress + ", Brasil")}&limit=1`,
        { headers: { 'User-Agent': 'VianaEccomerce-App' } }
      );
      const dataStore = await resStore.json();
      if (!dataStore[0]) throw new Error("Endereço da loja não localizado no mapa.");

      const lat2 = parseFloat(dataStore[0].lat);
      const lon2 = parseFloat(dataStore[0].lon);

      // 3. Cálculo Haversine (Distância Real)
      const R = 6371; 
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      
      const distKM = R * c; 

      setDistance(distKM);
      console.log(`📏 Distância Exata: ${distKM.toFixed(2)} km`);

      // 4. Busca a regra (Com Bypass de Tipagem)
      const { data: rawData, error } = await supabase
        .from("delivery_rules" as any)
        .select("price, max_km")
        .eq("store_id", storeId)
        .gte("max_km", distKM) 
        .order("max_km", { ascending: true }) 
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro banco:", error);
        throw new Error("Erro ao consultar taxas.");
      }

      // FALLBACK: regras padrão se banco vazio
      const FALLBACK_RULES: DeliveryRule[] = [
        { price: 0, max_km: 50 }
      ];
      
      const data = rawData as DeliveryRule | null;
      
      let finalRule: DeliveryRule;
      if (data) {
        finalRule = data;
      } else {
        console.warn("⚠️ Sem delivery_rules no banco, usando fallback");
        finalRule = FALLBACK_RULES[0];
        toast.warning("Taxas padrão ativadas (configure no dashboard)");
      }

      setDeliveryFee(finalRule.price);
      if (onFeeChange) onFeeChange(finalRule.price);
      toast.success(`Frete: R$ ${finalRule.price.toFixed(2)} (${distKM.toFixed(1)}km)`);

    } catch (error: any) {
      console.error("Erro:", error);
      const msg = error.message || "Erro ao calcular frete.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-6 rounded-[2rem] shadow-xl">
      <div className="flex items-center gap-3 mb-4 text-slate-800">
        <div className="bg-primary/10 p-2 rounded-xl">
          <Truck className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-bold">Entrega</h3>
      </div>

      <div className="flex gap-2 mb-2">
        <Input 
          placeholder="Seu CEP" 
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          maxLength={9}
          className="rounded-xl border-slate-200 bg-white/50 h-11"
        />
        <Button onClick={calculateDistance} disabled={loading} className="rounded-xl px-6 h-11 bg-primary text-white hover:bg-primary/90">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Calcular"}
        </Button>
      </div>

      {distance !== null && (
        <div className={`mt-4 p-4 rounded-2xl border animate-in slide-in-from-top-2 duration-300 ${errorMsg ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200"}`}>
          <div className="flex justify-between items-center text-sm mb-2 opacity-90">
            <span className="flex items-center gap-1.5 font-medium"><MapPin className="h-3.5 w-3.5" /> Distância</span>
            <strong className="text-lg font-black">{distance.toFixed(1)} km</strong>
          </div>
          
          <div className="flex justify-between items-center pt-3 border-t border-slate-200/50">
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">Valor Frete</span>
            {errorMsg ? (
              <span className="text-sm font-bold bg-white px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 border border-red-200">
                <AlertCircle className="h-3.5 w-3.5" /> Indisponível
              </span>
            ) : (
              <span className="text-2xl font-black text-emerald-600 flex items-baseline gap-1.5">
                R$ {deliveryFee?.toFixed(2)}
              </span>
            )}
          </div>
          
          {errorMsg && (
            <p className="text-xs mt-3 text-center font-semibold opacity-90 px-1 leading-relaxed">
              {errorMsg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
