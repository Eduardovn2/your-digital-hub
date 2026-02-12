import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Truck, Bell, BellOff, Plus, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface DeliveryRule {
  id: string;
  max_km: number;
  price: number;
  store_id: string; // Adicionei tipagem para garantir
}

export function DeliverySettings({ storeId }: { storeId: string }) {
  const [rules, setRules] = useState<DeliveryRule[]>([]);
  const [newKm, setNewKm] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [loadingRules, setLoadingRules] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    if (storeId) {
      fetchRules();
    }
    if ("Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, [storeId]); // Adicionado storeId na dependência para recarregar se mudar a loja

  async function fetchRules() {
    const { data, error } = await supabase
      .from("delivery_rules" as any)
      .select("*")
      .eq("store_id", storeId) // CORREÇÃO CRÍTICA: Filtra apenas regras desta loja
      .order("max_km", { ascending: true });

    if (error) {
      console.error("Erro ao buscar regras:", error);
      return;
    }

    if (data) {
      setRules(data as any);
    }
  }

  async function handleAddRule() {
    if (!newKm || !newPrice) {
      toast.error("Preencha KM e Valor.");
      return;
    }

    if (!storeId) {
      toast.error("Erro: Loja não identificada.");
      return;
    }

    setLoadingRules(true);
    
    const kmValue = parseFloat(newKm.replace(",", "."));
    const priceValue = parseFloat(newPrice.replace(",", "."));

    // CORREÇÃO CRÍTICA: Envia o store_id junto com a regra
    const { error } = await supabase
      .from("delivery_rules" as any)
      .insert({
        store_id: storeId, 
        max_km: kmValue,
        price: priceValue
      });

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar regra.");
    } else {
      toast.success("Regra adicionada com sucesso!");
      setNewKm("");
      setNewPrice("");
      fetchRules();
    }
    setLoadingRules(false);
  }

  async function handleDeleteRule(id: string) {
    const { error } = await supabase
      .from("delivery_rules" as any)
      .delete()
      .eq("id", id);
      
    if (!error) {
      toast.success("Regra removida.");
      fetchRules();
    } else {
      toast.error("Erro ao remover.");
    }
  }

  const handleEnableNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Este navegador não suporta notificações em standby.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permissão de notificação negada.");
        return;
      }
      await navigator.serviceWorker.ready;
      setPushEnabled(true);
      toast.success("Notificações em standby ativadas!");
    } catch (error) {
      toast.error("Erro ao ativar notificações.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* CARD DE TAXAS DE ENTREGA */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <CardTitle>Taxas de Entrega por Distância</CardTitle>
          </div>
          <CardDescription>
            Configure quanto cobrar baseado na distância (raio em KM). O sistema usará estas regras automaticamente no checkout.
          </CardDescription>
        </CardHeader>
        <CardContent>
          
          <div className="flex gap-4 mb-6 items-end bg-slate-50 p-4 rounded-lg border">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500">Até quantos KM?</label>
              <Input 
                type="number" 
                placeholder="Ex: 5" 
                value={newKm} 
                onChange={e => setNewKm(e.target.value)} 
                className="bg-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500">Valor (R$)</label>
              <Input 
                type="number" 
                placeholder="Ex: 10.00" 
                value={newPrice} 
                onChange={e => setNewPrice(e.target.value)} 
                className="bg-white"
              />
            </div>
            <Button onClick={handleAddRule} disabled={loadingRules} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
              {loadingRules ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Adicionar Regra
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Raio de Entrega</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500 py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Truck className="h-8 w-8 text-slate-200" />
                        <p>Nenhuma regra configurada.</p>
                        <p className="text-xs text-slate-400">Adicione uma regra acima para começar a vender.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule, index) => (
                    <TableRow key={rule.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        Até {rule.max_km} km
                        {index === rules.length - 1 && <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">LIMITE MÁXIMO</span>}
                      </TableCell>
                      <TableCell className="font-bold text-slate-700">
                        R$ {rule.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}