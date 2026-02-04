import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Truck, Plus, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface DeliveryRule {
  id: string;
  max_km: number;
  price: number;
}

export function DeliverySettings({ storeId }: { storeId: string }) {
  const [rules, setRules] = useState<DeliveryRule[]>([]);
  const [newKm, setNewKm] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [loadingRules, setLoadingRules] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    const { data, error } = await supabase
      .from("delivery_rules" as any)
      .select("*")
      .order("max_km", { ascending: true });

    if (error) console.error(error);
    if (data) setRules(data as any);
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
      .insert({ max_km: kmValue, price: priceValue });

    if (error) {
      toast.error("Erro ao salvar.");
    } else {
      toast.success("Regra adicionada!");
      setNewKm("");
      setNewPrice("");
      fetchRules();
    }
    setLoadingRules(false);
  }

  async function handleDeleteRule(id: string) {
    const { error } = await supabase.from("delivery_rules" as any).delete().eq("id", id);
    if (!error) {
      toast.success("Removido.");
      fetchRules();
    }
  }

  return (
    <Card className="bg-white/60 backdrop-blur-xl border-white/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2 text-slate-800">
          <Truck className="h-5 w-5 text-orange-600" />
          <CardTitle>Tabela de Fretes</CardTitle>
        </div>
        <CardDescription>
          Defina o valor cobrado por raio de distância.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Input */}
        <div className="flex gap-4 mb-6 items-end bg-white/50 p-4 rounded-xl border border-white/60 shadow-sm">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 ml-1">Até (KM)</label>
            <Input type="number" placeholder="Ex: 5" value={newKm} onChange={e => setNewKm(e.target.value)} className="bg-white/80 border-slate-200" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 ml-1">Preço (R$)</label>
            <Input type="number" placeholder="Ex: 10.00" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="bg-white/80 border-slate-200" />
          </div>
          <Button onClick={handleAddRule} disabled={loadingRules} className="bg-green-600 hover:bg-green-700 text-white shadow-md">
            {loadingRules ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} Add
          </Button>
        </div>

        {/* Tabela */}
        <div className="border border-slate-100 rounded-xl overflow-hidden bg-white/40">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead>Raio</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Apagar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-slate-400 py-8">Nenhuma regra.</TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id} className="hover:bg-white/60">
                    <TableCell className="font-medium flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-slate-400" /> Até {rule.max_km} km
                    </TableCell>
                    <TableCell className="font-bold text-green-700">R$ {rule.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8">
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
  );
}