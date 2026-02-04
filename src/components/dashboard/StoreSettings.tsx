import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, MapPin, Truck, Bell, Save, Loader2, BellOff, Search } from "lucide-react";
import { toast } from "sonner";
import { DeliverySettings } from "./DeliverySettings"; 

export function StoreSettings({ store }: { store: any }) {
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false); // Novo estado para loading do CEP
  
  // --- NOTIFICAÇÕES ---
  const [pushEnabled, setPushEnabled] = useState(false);
  
  useEffect(() => {
    if ("Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Este navegador não suporta notificações em standby.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permissão negada.");
        return;
      }
      await navigator.serviceWorker.ready;
      setPushEnabled(true);
      toast.success("Notificações ativadas!");
    } catch (error) {
      toast.error("Erro ao ativar.");
    }
  };

  // --- DADOS ---
  const [formData, setFormData] = useState({
    name: store?.name || "",
    description: store?.description || "",
    phone: store?.phone || "",
    zip_code: store?.zip_code || "",
    street: store?.street || "",
    street_number: store?.street_number || "",
    neighborhood: store?.neighborhood || "",
    complement: store?.complement || ""
  });

  // FUNÇÃO NOVA: Busca o CEP automaticamente
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Atualiza o valor digitado
    let valor = e.target.value;
    // Mascara simples 00000-000
    valor = valor.replace(/\D/g, "");
    if (valor.length > 5) valor = valor.replace(/^(\d{5})(\d)/, "$1-$2");
    
    setFormData(prev => ({ ...prev, zip_code: valor }));

    // 2. Se tiver 8 numeros, busca na API
    const cepLimpo = valor.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
        setLoadingCep(true);
        try {
            const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({
                    ...prev,
                    street: data.street || prev.street, // Preenche Rua
                    neighborhood: data.neighborhood || prev.neighborhood, // Preenche Bairro
                    // Mantem o resto
                }));
                toast.success("Endereço encontrado!");
            }
        } catch (error) {
            console.error("Erro ao buscar CEP", error);
        } finally {
            setLoadingCep(false);
        }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("stores")
      .update(formData)
      .eq("id", store.id);

    if (error) {
      toast.error("Erro ao salvar.");
    } else {
      toast.success("Loja atualizada!");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Configurações</h2>
      </div>

      <Tabs defaultValue="dados" className="space-y-6">
        
        <TabsList className="bg-white/40 backdrop-blur-md border border-white/50 p-1 h-auto flex flex-wrap gap-2 justify-start rounded-xl shadow-sm">
          <TabsTrigger value="dados" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Store className="h-4 w-4 mr-2" /> Dados & Endereço
          </TabsTrigger>
          <TabsTrigger value="entrega" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">
            <Truck className="h-4 w-4 mr-2" /> Entrega & Taxas
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
            <Bell className="h-4 w-4 mr-2" /> Notificações
          </TabsTrigger>
        </TabsList>

        {/* --- ABA 1: DADOS --- */}
        <TabsContent value="dados" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          
          <Card className="bg-white/60 backdrop-blur-xl border-white/50 shadow-sm">
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Nome e descrição da sua loja.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Nome da Loja</Label>
                <Input className="bg-white/50 border-white/60 focus:bg-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Descrição / Bio</Label>
                <Input className="bg-white/50 border-white/60 focus:bg-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50/40 backdrop-blur-xl border-blue-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2 text-blue-800">
                <MapPin className="h-5 w-5" />
                <CardTitle>Endereço da Loja</CardTitle>
              </div>
              <CardDescription className="text-blue-600/80">
                Digite o CEP para buscar o endereço automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* CAMPO DE CEP INTELIGENTE */}
                <div className="space-y-2 relative">
                  <Label>CEP</Label>
                  <div className="relative">
                    <Input 
                        className="bg-white/70 border-blue-200 focus:bg-white pr-10"
                        placeholder="00000-000"
                        value={formData.zip_code} 
                        onChange={handleCepChange}
                        maxLength={9}
                    />
                    <div className="absolute right-3 top-2.5 text-slate-400">
                        {loadingCep ? <Loader2 className="h-5 w-5 animate-spin text-blue-600"/> : <Search className="h-5 w-5"/>}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rua / Logradouro</Label>
                  <Input 
                    className="bg-white/70 border-blue-200 focus:bg-white"
                    placeholder="Nome da Rua"
                    value={formData.street} 
                    onChange={e => setFormData({...formData, street: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input 
                    className="bg-white/70 border-blue-200 focus:bg-white"
                    placeholder="Nº"
                    value={formData.street_number} 
                    onChange={e => setFormData({...formData, street_number: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input 
                    className="bg-white/70 border-blue-200 focus:bg-white"
                    placeholder="Bairro"
                    value={formData.neighborhood} 
                    onChange={e => setFormData({...formData, neighborhood: e.target.value})} 
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label>Complemento</Label>
                  <Input 
                    className="bg-white/70 border-blue-200 focus:bg-white"
                    placeholder="Opcional"
                    value={formData.complement} 
                    onChange={e => setFormData({...formData, complement: e.target.value})} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 shadow-lg">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2"/>}
              Salvar Tudo
            </Button>
          </div>
        </TabsContent>

        {/* --- ABA 2: ENTREGA --- */}
        <TabsContent value="entrega" className="animate-in fade-in slide-in-from-bottom-2">
          <DeliverySettings storeId={store.id} />
        </TabsContent>

        {/* --- ABA 3: NOTIFICAÇÕES --- */}
        <TabsContent value="notificacoes" className="animate-in fade-in slide-in-from-bottom-2">
          <Card className="bg-orange-50/40 backdrop-blur-xl border-orange-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2 text-orange-700">
                {pushEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                <CardTitle>Alertas em Tempo Real</CardTitle>
              </div>
              <CardDescription className="text-orange-600/80">
                Receba sons quando cair um novo pedido.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleEnableNotifications} 
                variant={pushEnabled ? "outline" : "default"}
                className={`w-full sm:w-auto ${pushEnabled ? "bg-white text-green-600 border-green-200" : "bg-orange-500 text-white"}`}
              >
                {pushEnabled ? "Ativados ✓" : "Ativar Alertas"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}