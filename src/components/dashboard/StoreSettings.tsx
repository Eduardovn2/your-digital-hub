import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, MapPin, Truck, Bell, Save, Loader2, Search, BellOff } from "lucide-react";
import { toast } from "sonner";
import { DeliverySettings } from "./DeliverySettings"; 
import { formatPhone } from "@/lib/utils"; // <--- Importe a função

export function StoreSettings({ store }: { store: any }) {
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  
  const [formData, setFormData] = useState({
    name: store?.name || "",
    description: store?.description || "",
    phone: formatPhone(store?.phone || ""), // <--- Formata ao carregar
    zip_code: store?.zip_code || "",
    street: store?.street || "",
    street_number: store?.street_number || "",
    neighborhood: store?.neighborhood || "",
    city: store?.city || "",
    complement: store?.complement || ""
  });

  // ... (o restante dos useEffect e funções mantêm-se iguais até o return)
  // Vou colocar apenas a parte alterada do INPUT de telefone

  const handleEnableNotifications = async () => {
    // ... (mesmo código anterior)
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        toast.error("O navegador não suporta notificações em standby.");
        return;
      }
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          await navigator.serviceWorker.ready;
          setPushEnabled(true);
          toast.success("Notificações ativadas com sucesso!");
        }
      } catch (error) {
        toast.error("Erro ao configurar notificações.");
      }
  };
  
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (mesmo código anterior)
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 5) valor = valor.replace(/^(\d{5})(\d)/, "$1-$2");
    
    setFormData(prev => ({ ...prev, zip_code: valor }));

    const cepLimpo = valor.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
        if (res.ok) {
          const data = await res.json();
          setFormData(prev => ({
            ...prev,
            street: data.street || prev.street,
            neighborhood: data.neighborhood || prev.neighborhood,
            city: data.city || prev.city
          }));
          toast.success("Morada localizada!");
        }
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("stores")
      .update({
        ...formData,
        phone: formData.phone.replace(/\D/g, "") // Limpa antes de salvar no banco
      })
      .eq("id", store.id);

    if (error) {
      toast.error("Erro ao atualizar as configurações.");
    } else {
      toast.success("Definições da loja guardadas!");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Configurações do Hub</h2>
      </div>

      <Tabs defaultValue="dados" className="space-y-6">
        <TabsList className="bg-white/40 backdrop-blur-md border border-white/60 p-1.5 h-auto flex flex-wrap gap-2 justify-start rounded-2xl shadow-sm">
          <TabsTrigger value="dados" className="rounded-xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
            <Store className="h-4 w-4 mr-2" /> Loja & Morada
          </TabsTrigger>
          <TabsTrigger value="entrega" className="rounded-xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-md transition-all">
            <Truck className="h-4 w-4 mr-2" /> Logística de Entrega
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="rounded-xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all">
            <Bell className="h-4 w-4 mr-2" /> Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-6 outline-none">
          <Card className="bg-white/60 backdrop-blur-xl border-white/50 shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/40 bg-white/20">
              <CardTitle>Perfil da Loja</CardTitle>
              <CardDescription>Dados públicos visualizados pelos clientes no VianaHub.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome Comercial</Label>
                  <Input className="bg-white/50 border-white/80 focus:bg-white transition-all rounded-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                {/* 👇 AQUI ESTÁ O INPUT DE TELEFONE ATUALIZADO */}
                <div className="space-y-2">
                  <Label>WhatsApp (com DDD)</Label>
                  <Input 
                    className="bg-white/50 border-white/80 focus:bg-white transition-all rounded-xl" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} 
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>

              </div>
              <div className="space-y-2">
                <Label>Descrição da Loja</Label>
                <Input className="bg-white/50 border-white/80 focus:bg-white transition-all rounded-xl" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            </CardContent>
          </Card>

          {/* ... O RESTO DO CÓDIGO PERMANECE IGUAL AO SEU ORIGINAL ... */}
          
          <Card className="bg-indigo-50/40 backdrop-blur-xl border-indigo-100/50 shadow-lg rounded-3xl">
            <CardHeader>
              <div className="flex items-center gap-2 text-indigo-900">
                <MapPin className="h-5 w-5" />
                <CardTitle>Geolocalização</CardTitle>
              </div>
              <CardDescription className="text-indigo-700/70">Estes dados garantem a precisão do cálculo de frete por KM.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 relative">
                <Label>CEP</Label>
                <div className="relative">
                  <Input className="bg-white/80 border-indigo-200 focus:ring-indigo-500 rounded-xl pr-10" value={formData.zip_code} onChange={handleCepChange} maxLength={9} />
                  <div className="absolute right-3 top-2.5">
                    {loadingCep ? <Loader2 className="h-5 w-5 animate-spin text-indigo-600"/> : <Search className="h-5 w-5 text-indigo-300"/>}
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Rua / Avenida</Label>
                <Input className="bg-white/80 border-indigo-200 rounded-xl" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input className="bg-white/80 border-indigo-200 rounded-xl" value={formData.street_number} onChange={e => setFormData({...formData, street_number: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input className="bg-white/80 border-indigo-200 rounded-xl" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input className="bg-white/80 border-indigo-200 rounded-xl" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading} className="px-8 py-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl transition-all">
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Save className="h-5 w-5 mr-2"/>}
              Guardar Configurações
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="entrega" className="outline-none">
          <DeliverySettings storeId={store.id} />
        </TabsContent>

        <TabsContent value="notificacoes" className="outline-none">
          <Card className="bg-orange-50/40 backdrop-blur-xl border-orange-200 shadow-lg rounded-3xl">
            <CardHeader>
              <div className="flex items-center gap-2 text-orange-800">
                {pushEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                <CardTitle>Alertas de Sistema</CardTitle>
              </div>
              <CardDescription className="text-orange-700/70">Mantenha-se informado sobre novos pedidos em tempo real.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleEnableNotifications} variant={pushEnabled ? "outline" : "default"} className={`rounded-xl h-12 px-6 ${pushEnabled ? "bg-white text-green-600 border-green-200" : "bg-orange-600 hover:bg-orange-700 text-white"}`}>
                {pushEnabled ? "Notificações Ativas ✓" : "Ativar Alertas Push"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}