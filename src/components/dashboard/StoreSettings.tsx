import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SoundSettingsCard } from "./SoundSettingsCard";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Store, MapPin, Truck, Bell, Save, Loader2, Search, Camera, ImageIcon, CreditCard, Wallet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { DeliverySettings } from "./DeliverySettings"; 
import { SubscriptionSettings } from "./SubscriptionSettings"; 
import { formatPhone } from "@/lib/utils"; 

export function StoreSettings({ store }: { store: any }) {
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  // ADICIONÁMOS AQUI OS NOVOS CAMPOS DO MERCADO PAGO NO ESTADO INICIAL
  const [formData, setFormData] = useState({
    name: store?.name || "",
    description: store?.description || "",
    phone: formatPhone(store?.phone || ""),
    zip_code: store?.zip_code || "",
    street: store?.street || "",
    street_number: store?.street_number || "",
    neighborhood: store?.neighborhood || "",
    city: store?.city || "",
    complement: store?.complement || "",
    logo_url: store?.logo_url || "",
    banner_url: store?.banner_url || "",
    mp_access_token: store?.mp_access_token || "",
    mp_public_key: store?.mp_public_key || ""
  });
  
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      type === 'logo' ? setUploadingLogo(true) : setUploadingBanner(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${store.id}/${type}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('store-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('store-assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'banner_url']: publicUrl }));
      
      await supabase.from("stores").update({
        [type === 'logo' ? 'logo_url' : 'banner_url']: publicUrl
      }).eq("id", store.id);

      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} atualizado!`);
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      type === 'logo' ? setUploadingLogo(false) : setUploadingBanner(false);
    }
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        phone: formData.phone.replace(/\D/g, "")
      })
      .eq("id", store.id);

    if (error) {
      toast.error("Erro ao atualizar as configurações.");
    } else {
      toast.success("Definições guardadas com sucesso!");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Configurações do Hub</h2>
      </div>

      <Tabs defaultValue="dados" className="space-y-6">
        <TabsList className="bg-white/40 backdrop-blur-md border border-white/60 p-1.5 h-auto flex flex-wrap gap-2 justify-start rounded-2xl shadow-sm w-full">
          <TabsTrigger value="dados" className="rounded-xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
            <Store className="h-4 w-4 mr-2" /> Loja & Morada
          </TabsTrigger>
          <TabsTrigger value="entrega" className="rounded-xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-md transition-all">
            <Truck className="h-4 w-4 mr-2" /> Logística de Entrega
          </TabsTrigger>
          
          {/* NOVO SEPARADOR: PAGAMENTOS */}
          <TabsTrigger value="pagamentos" className="rounded-xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all">
            <Wallet className="h-4 w-4 mr-2" /> Pagamentos (Mercado Pago)
          </TabsTrigger>

          <TabsTrigger value="notificacoes" className="rounded-xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all">
            <Bell className="h-4 w-4 mr-2" /> Notificações
          </TabsTrigger>
          <TabsTrigger value="assinatura" className="rounded-xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-md transition-all ml-auto">
            <CreditCard className="h-4 w-4 mr-2" /> Assinatura
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-6 outline-none">
          {/* Identidade Visual */}
          <Card className="bg-white/60 backdrop-blur-xl border-white/50 shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/40 bg-white/10">
              <CardTitle>Identidade Visual</CardTitle>
              <CardDescription>Logo e banner que aparecem no seu cardápio digital.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Upload do Logo */}
                <div className="space-y-3">
                  <Label>Logo da Loja</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-100 flex-shrink-0">
                      {formData.logo_url ? (
                        <img src={formData.logo_url} className="h-full w-full object-cover" alt="Logo" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-400"><ImageIcon /></div>
                      )}
                      {uploadingLogo && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="relative cursor-pointer overflow-hidden rounded-xl">
                        <Camera className="h-4 w-4 mr-2" /> {uploadingLogo ? "Subindo..." : "Mudar Logo"}
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleUpload(e, 'logo')} />
                      </Button>
                      <p className="text-[10px] text-slate-500">Recomendado: 512x512px (Quadrado)</p>
                    </div>
                  </div>
                </div>

                {/* Upload do Banner */}
                <div className="space-y-3">
                  <Label>Banner de Capa</Label>
                  <div className="relative h-24 w-full rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-100 group">
                    {formData.banner_url ? (
                      <img src={formData.banner_url} className="h-full w-full object-cover" alt="Banner" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400"><ImageIcon /></div>
                    )}
                    <label className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                       <Camera className="text-white h-6 w-6" />
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'banner')} />
                    </label>
                    {uploadingBanner && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}
                  </div>
                  <p className="text-[10px] text-slate-500">Recomendado: 1200x400px (Horizontal)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Perfil da Loja */}
          <Card className="bg-white/60 backdrop-blur-xl border-white/50 shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/40 bg-white/20">
              <CardTitle>Perfil da Loja</CardTitle>
              <CardDescription>Dados públicos visualizados pelos clientes.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome Comercial</Label>
                  <Input className="bg-white/50 border-white/80 focus:bg-white transition-all rounded-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp (com DDD)</Label>
                  <Input className="bg-white/50 border-white/80 focus:bg-white transition-all rounded-xl" value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} maxLength={15} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição da Loja</Label>
                <Input className="bg-white/50 border-white/80 focus:bg-white transition-all rounded-xl" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card className="bg-indigo-50/40 backdrop-blur-xl border-indigo-100/50 shadow-lg rounded-3xl">
            <CardHeader>
              <div className="flex items-center gap-2 text-indigo-900">
                <MapPin className="h-5 w-5" />
                <CardTitle>Geolocalização</CardTitle>
              </div>
              <CardDescription className="text-indigo-700/70">Precisão para cálculo de frete por KM.</CardDescription>
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

        {/* NOVA ABA: PAGAMENTOS (MERCADO PAGO) */}
        <TabsContent value="pagamentos" className="space-y-6 outline-none animate-in fade-in duration-300">
          <Card className="bg-white/60 backdrop-blur-xl border-white/50 shadow-lg rounded-3xl overflow-hidden border-blue-100">
            <CardHeader className="border-b border-white/40 bg-blue-50/50">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Wallet className="h-6 w-6 text-blue-600" />
                Integração Mercado Pago
              </CardTitle>
              <CardDescription className="text-blue-700/70">
                Configure as suas credenciais para aceitar PIX e Cartão de Crédito com Checkout Transparente. O dinheiro vai direto para a sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold">Onde encontrar as chaves?</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  Aceda ao seu painel do Mercado Pago &gt; Seu Negócio &gt; Configurações &gt; Gestão e Administração &gt; Credenciais. Utilize sempre as suas <b>Credenciais de Produção</b>.
                </AlertDescription>
              </Alert>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Public Key (Chave Pública)</Label>
                  <Input 
                    placeholder="APP_USR-..." 
                    value={formData.mp_public_key}
                    onChange={e => setFormData({...formData, mp_public_key: e.target.value})}
                    className="bg-white/80 border-blue-100 focus:bg-white rounded-xl font-mono text-sm"
                  />
                  <p className="text-[10px] text-slate-500">Usada para gerar o formulário de pagamento seguro na sua loja.</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Access Token (Chave Privada)</Label>
                  <Input 
                    type="password"
                    placeholder="APP_USR-..." 
                    value={formData.mp_access_token}
                    onChange={e => setFormData({...formData, mp_access_token: e.target.value})}
                    className="bg-white/80 border-blue-100 focus:bg-white rounded-xl font-mono text-sm"
                  />
                  <p className="text-[10px] text-slate-500">Mantenha em segredo. Usada pelos nossos servidores para confirmar os seus recebimentos via PIX.</p>
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-white/50">
                <Button onClick={handleSave} disabled={loading} className="px-6 py-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Save className="h-5 w-5 mr-2"/>}
                  Guardar Chaves
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-6 outline-none">
          <SoundSettingsCard />
        </TabsContent>

        <TabsContent value="assinatura" className="outline-none animate-in fade-in duration-300">
          <SubscriptionSettings />
        </TabsContent>

      </Tabs>
    </div>
  );
}