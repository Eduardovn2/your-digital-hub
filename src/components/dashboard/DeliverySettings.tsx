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
}

// AQUI ESTAVA O ERRO: Removemos o 'default'
export function DeliverySettings({ storeId }: { storeId: string }) {
  const [rules, setRules] = useState<DeliveryRule[]>([]);
  const [newKm, setNewKm] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [loadingRules, setLoadingRules] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    fetchRules();
    if ("Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  async function fetchRules() {
    const { data, error } = await supabase
      .from("delivery_rules" as any)
      .select("*")
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

    setLoadingRules(true);
    
    const kmValue = parseFloat(newKm.replace(",", "."));
    const priceValue = parseFloat(newPrice.replace(",", "."));

    const { error } = await supabase
      .from("delivery_rules" as any)
      .insert({
        max_km: kmValue,
        price: priceValue
      });

    if (error) {
      toast.error("Erro ao salvar regra.");
    } else {
      toast.success("Regra adicionada!");
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
      
      {/* CARD DE NOTIFICAÇÕES */}
      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader>
          <div className="flex items-center gap-2 text-orange-700">
            {pushEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            <CardTitle>Alertas em Tempo Real</CardTitle>
          </div>
          <CardDescription className="text-orange-600/80">
            Ative para receber avisos sonoros de novos pedidos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleEnableNotifications} 
            variant={pushEnabled ? "outline" : "default"}
            className={pushEnabled ? "bg-white" : "bg-orange-600 hover:bg-orange-700"}
          >
            {pushEnabled ? "Alertas Ativados" : "Ativar Alertas"}
          </Button>
        </CardContent>
      </Card>

      {/* CARD DE TAXAS DE ENTREGA */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <CardTitle>Taxas de Entrega por Distância</CardTitle>
          </div>
          <CardDescription>
            Configure quanto cobrar baseado na distância (raio em KM).
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
            <Button onClick={handleAddRule} disabled={loadingRules} className="bg-green-600 hover:bg-green-700 text-white">
              {loadingRules ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Adicionar
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead>Raio de Entrega</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                      Nenhuma regra configurada.
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule, index) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        Até {rule.max_km} km
                        {index === rules.length - 1 && <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 rounded-full border border-red-100">MÁXIMO</span>}
                      </TableCell>
                      <TableCell className="font-bold text-green-700">
                        R$ {rule.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)} className="text-red-500 hover:bg-red-50 h-8 w-8">
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