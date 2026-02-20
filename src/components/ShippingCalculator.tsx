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
      // Usamos 'as any' no .from() para ignorar o erro de tabela inexistente nos tipos
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

      // Convertemos o resultado 'any' para nossa interface
      const data = rawData as DeliveryRule | null;

      if (data) {
        setDeliveryFee(data.price);
        if (onFeeChange) onFeeChange(data.price);
        toast.success(`Frete: R$ ${data.price.toFixed(2)}`);
      } else {
        const msg = `Sem entrega para ${distKM.toFixed(1)}km.`;
        setErrorMsg(msg);
        toast.warning(msg);
      }

    } catch (error: any) {
      console.error("Erro:", error);
      toast.error(error.message || "Erro ao calcular frete.");
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
        <div className={`mt-4 p-4 rounded-2xl border animate-in slide-in-from-top-2 ${errorMsg ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100"}`}>
          
          <div className="flex justify-between items-center text-sm mb-1 opacity-80">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/> Distância</span>
            <strong>{distance.toFixed(1)} km</strong>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-black/5 mt-2">
            <span className="text-xs font-bold uppercase opacity-60">Valor</span>
            {errorMsg ? (
              <span className="text-xs font-bold bg-white px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                <AlertCircle className="h-3 w-3"/> Indisponível
              </span>
            ) : (
              <span className="text-xl font-black text-emerald-600 flex items-center gap-2">
                 R$ {deliveryFee?.toFixed(2)}
              </span>
            )}
          </div>
          
          {errorMsg && <p className="text-xs mt-2 text-center font-medium opacity-80">{errorMsg}</p>}
        </div>
      )}
    </div>
  );
}