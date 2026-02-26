import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SoundSettingsCard } from "./SoundSettingsCard";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Store, MapPin, Truck, Bell, Save, Loader2, Search, 
  Camera, ImageIcon, CreditCard, Wallet, AlertCircle, CheckCircle2 
} from "lucide-react";
import { toast } from "sonner";
import { DeliverySettings } from "./DeliverySettings"; 
import { SubscriptionSettings } from "./SubscriptionSettings"; 
import { formatPhone } from "@/lib/utils"; 

// CONFIGURAÇÕES DA SUA PLATAFORMA (Substitua pelo seu Client ID do Mercado Pago)
const MP_CLIENT_ID = "680998988261571"; 
const REDIRECT_URI = window.location.origin + "/admin";

export function StoreSettings({ store }: { store: any }) {
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
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

  // --- LÓGICA DE CAPTURA DO CÓDIGO MERCADO PAGO ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && store?.id) {
      const handleTokenExchange = async () => {
        try {
          toast.loading("Finalizando conexão com Mercado Pago...");
          
          const { error } = await supabase.functions.invoke('exchange-mp-token', {
            body: { code, storeId: store.id }
          });

          if (error) throw error;

          toast.success("Conta conectada com sucesso! 🚀");
          
          // Limpa a URL para segurança e estética
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Recarrega os dados para mostrar o estado de "Conectado"
          setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
          console.error(err);
          toast.error("Erro ao conectar conta. Tente novamente.");
        }
      };

      handleTokenExchange();
    }
  }, [store?.id]);

  const handleConnectMP = () => {
    const authUrl = `https://auth.mercadopago.com.br/authorization?client_id=${MP_CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.location.href = authUrl;
  };
  
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
        <TabsList className="bg-white/40 backdrop-blur-md border border-white/60 p-1.5 h-auto flex flex-nowrap overflow-x-auto gap-2 justify-start rounded-2xl shadow-sm w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <TabsTrigger value="dados" className="rounded-xl px-4 py-2 data-[state=active]:bg-white shadow-sm transition-all whitespace-nowrap shrink-0">
            <Store className="h-4 w-4 mr-2" /> Loja & Morada
          </TabsTrigger>
          <TabsTrigger value="entrega" className="rounded-xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-orange-600 shadow-sm transition-all whitespace-nowrap shrink-0">
            <Truck className="h-4 w-4 mr-2" /> Logística de Entrega
          </TabsTrigger>
          <TabsTrigger value="pagamentos" className="rounded-xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 shadow-sm transition-all whitespace-nowrap shrink-0">
            <Wallet className="h-4 w-4 mr-2" /> Pagamentos (Mercado Pago)
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="rounded-xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 shadow-sm transition-all whitespace-nowrap shrink-0">
            <Bell className="h-4 w-4 mr-2" /> Notificações
          </TabsTrigger>
          <TabsTrigger value="assinatura" className="rounded-xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600 shadow-sm transition-all whitespace-nowrap shrink-0">
            <CreditCard className="h-4 w-4 mr-2" /> Assinatura
          </TabsTrigger>
        </TabsList>

        {/* --- DADOS --- */}
        <TabsContent value="dados" className="space-y-6 outline-none">
          {/* Identidade Visual */}
          <Card className="bg-white/60 backdrop-blur-xl border-white/50 shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/40 bg-white/10">
              <CardTitle>Identidade Visual</CardTitle>
              <CardDescription>Logo e banner que aparecem no seu cardápio digital.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
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

          {/* Perfil */}
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
            <CardHeader><div className="flex items-center gap-2 text-indigo-900"><MapPin className="h-5 w-5" /><CardTitle>Geolocalização</CardTitle></div></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>CEP</Label>
                <div className="relative">
                  <Input className="bg-white/80 border-indigo-200 focus:ring-indigo-500 rounded-xl pr-10" value={formData.zip_code} onChange={handleCepChange} maxLength={9} />
                  <div className="absolute right-3 top-2.5">{loadingCep ? <Loader2 className="h-5 w-5 animate-spin text-indigo-600"/> : <Search className="h-5 w-5 text-indigo-300"/>}</div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2"><Label>Rua / Avenida</Label><Input className="bg-white/80 border-indigo-200 rounded-xl" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} /></div>
              <div className="space-y-2"><Label>Número</Label><Input className="bg-white/80 border-indigo-200 rounded-xl" value={formData.street_number} onChange={e => setFormData({...formData, street_number: e.target.value})} /></div>
              <div className="space-y-2"><Label>Bairro</Label><Input className="bg-white/80 border-indigo-200 rounded-xl" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} /></div>
              <div className="space-y-2"><Label>Cidade</Label><Input className="bg-white/80 border-indigo-200 rounded-xl" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading} className="px-8 py-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-xl transition-all">
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Save className="h-5 w-5 mr-2"/>}
              Guardar Configurações
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="entrega" className="outline-none">
          <DeliverySettings storeId={store.id} />
        </TabsContent>

        {/* --- ABA DE PAGAMENTOS (OAUTH INTEGRADO) --- */}
{/* --- ABA DE PAGAMENTOS (OAUTH INTEGRADO) --- */}
        <TabsContent value="pagamentos" className="space-y-6 outline-none animate-in fade-in duration-300">
          <Card className="bg-white/60 backdrop-blur-xl border-white/50 shadow-lg rounded-3xl overflow-hidden border-blue-100">
            <CardHeader className="border-b border-white/40 bg-blue-50/50">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Wallet className="h-6 w-6 text-blue-600" />
                Integração Mercado Pago
              </CardTitle>
              <CardDescription className="text-blue-700/70">
                Conecte sua conta para aceitar PIX e Cartão de Crédito automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              
              {/* CONEXÃO OAUTH */}
              <div className="flex flex-col items-center justify-center py-10 space-y-6 border-2 border-dashed border-blue-100 rounded-[2rem] bg-blue-50/30">
                <div className="bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-500/20 text-white">
                  <CreditCard className="h-10 w-10" />
                </div>
                
                <div className="text-center space-y-2 px-6">
                  <h3 className="text-lg font-black text-slate-900 uppercase italic">Conexão Rápida</h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Autorize o Hub a processar seus pagamentos. Você receberá o dinheiro direto na sua conta Mercado Pago.
                  </p>
                </div>

                {formData.mp_access_token ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-[11px] font-black uppercase tracking-widest">Conta Conectada</span>
                    </div>
                    <Button variant="outline" onClick={handleConnectMP} className="rounded-xl text-[10px] font-bold h-9">
                      Alterar Conta
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleConnectMP} className="bg-[#009EE3] hover:bg-[#007EB5] text-white font-black rounded-2xl px-10 h-14 shadow-lg transition-all active:scale-95">
                    CONECTAR MERCADO PAGO
                  </Button>
                )}
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