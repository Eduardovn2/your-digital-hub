import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search } from "lucide-react";

// Recebe o ID da loja via Props (Correção Fundamental)
interface Props {
  storeId: string;
}

interface StoreData {
    zip_code?: string;
    address?: string;
    street_number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
}

export function StoreAddressSettings({ storeId }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    zip_code: "",
    address: "",
    street_number: "",
    complement: "",
    neighborhood: "",
    city: ""
  });

  // Carrega os dados da loja ESPECÍFICA (storeId)
  useEffect(() => {
    async function loadData() {
      if (!storeId) return;

      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("id", storeId) // <--- O PULO DO GATO ESTÁ AQUI
        .single();
      
      const store = data as unknown as StoreData;

      if (store) {
        setFormData({
          zip_code: store.zip_code || "",
          address: store.address || "",
          street_number: store.street_number || "",
          complement: store.complement || "",
          neighborhood: store.neighborhood || "",
          city: store.city || ""
        });
      }
    }
    loadData();
  }, [storeId]);

  const buscarCep = async () => {
    const cep = formData.zip_code.replace(/\D/g, "");
    if (cep.length !== 8) return;

    setLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
      const data = await res.json();
      
      if (data.street) {
        setFormData(prev => ({
          ...prev,
          address: data.street,
          neighborhood: data.neighborhood,
          city: data.city
        }));
      }
    } catch (error) {
      toast({ title: "Erro", description: "CEP não encontrado", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        const updateData = {
            zip_code: formData.zip_code,
            address: formData.address,
            street_number: formData.street_number,
            complement: formData.complement,
            neighborhood: formData.neighborhood,
            city: formData.city
        };

        const { error } = await supabase
            .from("stores")
            .update(updateData as any)
            .eq("id", storeId);

        if (error) throw error;

        // --- AQUI ESTÁ O POPUP QUE VOCÊ PEDIU ---
        window.alert("✅ Endereço atualizado com sucesso!");
        
        // Mantemos o toast caso você arrume o visual depois
        toast({ title: "Sucesso", description: "Endereço atualizado com sucesso!" });

    } catch (error) {
        console.error(error);
        // Popup de erro também
        window.alert("❌ Erro ao salvar o endereço. Tente novamente.");
        toast({ title: "Erro", description: "Falha ao salvar", variant: "destructive" });
    } finally {
        setSaving(false);
    }
  };


  return (
    <Card className="mt-6 border-orange-100 shadow-sm">
      <CardHeader className="bg-orange-50/50 pb-4">
        <CardTitle className="text-lg text-orange-900">Endereço da Loja (Origem)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>CEP</Label>
                <div className="flex gap-2">
                    <Input 
                        value={formData.zip_code} 
                        onChange={e => setFormData({...formData, zip_code: e.target.value})}
                        onBlur={buscarCep}
                        placeholder="00000-000"
                    />
                    <Button size="icon" variant="outline" onClick={buscarCep} disabled={loading} type="button">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                    </Button>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={formData.city} readOnly className="bg-slate-50"/>
            </div>
        </div>

        <div className="space-y-2">
            <Label>Endereço (Rua/Av)</Label>
            <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}/>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Número</Label>
                <Input value={formData.street_number} onChange={e => setFormData({...formData, street_number: e.target.value})}/>
            </div>
            <div className="space-y-2">
                <Label>Bairro</Label>
                <Input value={formData.neighborhood} readOnly className="bg-slate-50"/>
            </div>
        </div>

        <div className="space-y-2">
            <Label>Complemento</Label>
            <Input value={formData.complement} onChange={e => setFormData({...formData, complement: e.target.value})}/>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Endereço
        </Button>
      </CardContent>
    </Card>
  );
}