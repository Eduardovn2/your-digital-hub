import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, Loader2, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function ShippingCalculator({ storeId, storeAddress }: { storeId: string, storeAddress: string }) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const calculateDistance = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length < 8) {
      toast.error("CEP inválido.");
      return;
    }
    
    setLoading(true);
    setDeliveryFee(null);

    try {
      console.log("📍 Iniciando cálculo...");

      // 1. Geolocalização do Cliente
      const resClient = await fetch(`https://cep.awesomeapi.com.br/json/${cleanCep}`);
      const dataClient = await resClient.json();
      if (!dataClient.lat) throw new Error("CEP do cliente não encontrado.");

      // 2. Geolocalização da Loja
      const resStore = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(storeAddress)}`,
        { headers: { 'User-Agent': 'VianaHub-App' } }
      );
      const dataStore = await resStore.json();
      if (!dataStore[0]) throw new Error("Endereço da loja não encontrado no mapa.");

      const lat1 = parseFloat(dataClient.lat);
      const lon1 = parseFloat(dataClient.lng);
      const lat2 = parseFloat(dataStore[0].lat);
      const lon2 = parseFloat(dataStore[0].lon);

      // Distância (Haversine)
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distKM = R * c * 1.2; // +20% margem de segurança

      setDistance(distKM);
      console.log(`📏 Distância calculada: ${distKM.toFixed(2)} km`);

      // 3. BUSCA NA TABELA CERTA (delivery_rules)
      // Usando 'min_distance' e 'max_distance' que é como o Admin salva
      const { data, error } = await supabase
        .from("delivery_rules" as any)
        .select("fee")
        .eq("store_id", storeId)
        .lte("min_distance", distKM)  // <--- Correção aqui
        .gte("max_distance", distKM)  // <--- Correção aqui
        .maybeSingle() as any;

      if (error) {
        console.error("Erro banco:", error);
        throw new Error("Erro ao consultar tabela de regras.");
      }

      if (data && typeof data.fee === 'number') {
        setDeliveryFee(data.fee);
        toast.success(`Frete: R$ ${data.fee.toFixed(2)}`);
      } else {
        // Se não achar regra, avisa que está fora da área
        toast.warning(`Fora da área de entrega configurada (${distKM.toFixed(1)}km).`);
        setDeliveryFee(null); 
      }

    } catch (error: any) {
      console.error("Erro:", error);
      toast.error("Erro ao calcular. Tente novamente.");
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
        <h3 className="font-bold">Cálculo de Frete</h3>
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
        <div className="mt-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2">
          <div className="flex justify-between items-center text-sm text-slate-600 mb-1">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/> Distância</span>
            <strong>{distance.toFixed(1)} km</strong>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
            <span className="text-xs font-bold uppercase text-slate-400">Total</span>
            {deliveryFee !== null ? (
              <span className="text-xl font-black text-primary">R$ {deliveryFee.toFixed(2)}</span>
            ) : (
              <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">
                Indisponível
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}