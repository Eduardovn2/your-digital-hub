import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, Clock, Truck, Palette, Printer } from "lucide-react";
import { StoreHoursSettings } from "./StoreHoursSettings";
// import { DeliverySettings } from "./DeliverySettings"; // Vamos criar em breve
// import { AppearanceSettings } from "./AppearanceSettings"; // Vamos criar em breve
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface StoreSettingsProps {
  store: any; // Tipar corretamente com seu tipo Store
}

export function StoreSettings({ store }: StoreSettingsProps) {
  // Estado local para form de dados básicos
  const [formData, setFormData] = useState({
    name: store.name || "",
    description: store.description || "",
    phone: store.phone || "",
    address: store.address || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveBasic = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("stores")
        .update(formData)
        .eq("id", store.id);

      if (error) throw error;
      toast.success("Dados atualizados com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-fade-in">
      <Tabs defaultValue="hours" orientation="vertical" className="w-full flex flex-col md:flex-row gap-6">
        
        {/* Menu Lateral de Configurações */}
        <TabsList className="flex md:flex-col justify-start h-auto bg-white p-2 rounded-xl border w-full md:w-64 space-y-1">
          <TabsTrigger value="general" className="w-full justify-start gap-2 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Store className="h-4 w-4" /> Dados Gerais
          </TabsTrigger>
          <TabsTrigger value="hours" className="w-full justify-start gap-2 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Clock className="h-4 w-4" /> Horários
          </TabsTrigger>
          <TabsTrigger value="delivery" className="w-full justify-start gap-2 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Truck className="h-4 w-4" /> Entrega
          </TabsTrigger>
          <TabsTrigger value="appearance" className="w-full justify-start gap-2 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Palette className="h-4 w-4" /> Aparência
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo */}
        <div className="flex-1">
          
          {/* ABA GERAL */}
          <TabsContent value="general" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Loja</CardTitle>
                <CardDescription>Informações básicas visíveis para o cliente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Loja</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço Físico</Label>
                    <Input 
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                   <Button onClick={handleSaveBasic} disabled={isSaving}>
                     {isSaving ? "Salvando..." : "Salvar Alterações"}
                   </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA HORÁRIOS */}
          <TabsContent value="hours" className="mt-0">
             <StoreHoursSettings storeId={store.id} />
          </TabsContent>

          {/* ABA ENTREGA (Placeholder) */}
          <TabsContent value="delivery" className="mt-0">
             <Card>
               <CardHeader><CardTitle>Em breve</CardTitle></CardHeader>
               <CardContent>Configurações de zonas de entrega aqui.</CardContent>
             </Card>
          </TabsContent>

          {/* ABA APARÊNCIA (Placeholder) */}
          <TabsContent value="appearance" className="mt-0">
             <Card>
               <CardHeader><CardTitle>Em breve</CardTitle></CardHeader>
               <CardContent>Upload de logo e banner aqui.</CardContent>
             </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}