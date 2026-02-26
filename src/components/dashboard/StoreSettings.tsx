import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SoundSettingsCard } from "./SoundSettingsCard";
import { Label } from "@/components/ui/label";
import { StoreHoursSettings } from "./StoreHoursSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, MapPin, Truck, Bell, Save, Loader2, Search, 
  Camera, ImageIcon, CreditCard, Wallet, CheckCircle2,
  ChevronRight, Sparkles, Settings, Globe, Info
} from "lucide-react";
import { toast } from "sonner";
import { DeliverySettings } from "./DeliverySettings"; 
import { SubscriptionSettings } from "./SubscriptionSettings"; 
import { formatPhone } from "@/lib/utils"; 

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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && store?.id) {
      const handleTokenExchange = async () => {
        try {
          toast.loading("Conectando Mercado Pago...");
          const { error } = await supabase.functions.invoke('exchange-mp-token', {
            body: { code, storeId: store.id }
          });
          if (error) throw error;
          toast.success("Conectado! 🚀");
          window.history.replaceState({}, document.title, window.location.pathname);
          setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
          toast.error("Erro na conexão.");
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
      const { error: uploadError } = await supabase.storage.from('store-assets').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('store-assets').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'banner_url']: publicUrl }));
      await supabase.from("stores").update({ [type === 'logo' ? 'logo_url' : 'banner_url']: publicUrl }).eq("id", store.id);
      toast.success("Imagem atualizada!");
    } catch (error: any) {
      toast.error("Erro no upload.");
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
          setFormData(prev => ({ ...prev, street: data.street || prev.street, neighborhood: data.neighborhood || prev.neighborhood, city: data.city || prev.city }));
          toast.success("Endereço localizado!");
        }
      } finally { setLoadingCep(false); }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from("stores").update({ ...formData, phone: formData.phone.replace(/\D/g, "") }).eq("id", store.id);
    if (error) toast.error("Erro ao salvar.");
    else toast.success("Configurações salvas!");
    setLoading(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* HEADER SIMPLIFICADO E ELEGANTE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Painel de Configurações</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Gestão do Hub: {store?.name}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading} className="bg-slate-900 hover:bg-black text-white h-12 px-8 rounded-xl font-black shadow-xl transition-all">
          {loading ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 h-4 w-4"/>}
          SALVAR TUDO
        </Button>
      </div>

      <Tabs defaultValue="dados" className="space-y-8">
        {/* NAVEGAÇÃO DE ABAS REFINADA */}
        <div className="relative">
          <TabsList className="bg-slate-100/50 dark:bg-slate-900 p-1.5 h-auto flex flex-nowrap overflow-x-auto gap-2 rounded-2xl w-full no-scrollbar">
            {[
              { id: "dados", label: "Geral", icon: Store, color: "text-indigo-500" },
              { id: "entrega", label: "Logística", icon: Truck, color: "text-orange-500" },
              { id: "pagamentos", label: "Pagamentos", icon: Wallet, color: "text-blue-500" },
              { id: "notificacoes", label: "Alertas", icon: Bell, color: "text-pink-500" },
              { id: "assinatura", label: "Plano", icon: CreditCard, color: "text-emerald-500" }
            ].map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="rounded-xl px-5 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md font-bold text-slate-500 transition-all shrink-0">
                <tab.icon className={`h-4 w-4 mr-2 ${tab.color}`} /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* --- CONTEÚDO DA ABA GERAL --- */}
        <TabsContent value="dados" className="outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUNA ESQUERDA: IDENTIDADE (8 colunas no desktop) */}
            <div className="lg:col-span-8 space-y-8 order-2 lg:order-1">
              
              {/* Card de Branding (Banner e Logo) */}
              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <div className="relative h-48 bg-slate-100 group">
                  {formData.banner_url ? (
                    <img src={formData.banner_url} className="w-full h-full object-cover" alt="Banner" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 flex-col gap-2">
                      <ImageIcon className="h-10 w-10" />
                      <span className="text-[10px] font-black uppercase">Sem Banner de Capa</span>
                    </div>
                  )}
                  <label className="absolute bottom-4 right-4 bg-white/90 backdrop-blur shadow-lg p-3 rounded-xl cursor-pointer hover:scale-110 transition-all border border-slate-100">
                    <Camera className="h-5 w-5 text-indigo-600" />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'banner')} />
                  </label>

                  {/* Logo Sobreposto */}
                  <div className="absolute -bottom-10 left-8">
                    <div className="relative h-24 w-24 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white group/logo">
                      {formData.logo_url ? (
                        <img src={formData.logo_url} className="w-full h-full object-cover" alt="Logo" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300"><Store /></div>
                      )}
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                        <Camera className="text-white h-6 w-6" />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'logo')} />
                      </label>
                    </div>
                  </div>
                </div>

                <CardContent className="pt-16 pb-8 px-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase tracking-widest text-slate-400">Nome da Loja</Label>
                      <Input className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-xs uppercase tracking-widest text-slate-400">WhatsApp de Pedidos</Label>
                      <Input className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white font-mono font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest text-slate-400">Bio / Descrição Curta</Label>
                    <Input className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white font-medium" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: O melhor hambúrguer artesanal da região." />
                  </div>
                </CardContent>
              </Card>

              {/* Card de Localização */}
              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-50 pb-4">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-emerald-500" /> Endereço de Origem
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs">CEP</Label>
                    <div className="relative">
                      <Input className="h-12 rounded-xl bg-slate-50 border-none pr-10 font-bold" value={formData.zip_code} onChange={handleCepChange} maxLength={9} />
                      <div className="absolute right-3 top-3.5">{loadingCep ? <Loader2 className="animate-spin text-indigo-600 h-5 w-5"/> : <Search className="text-slate-300 h-5 w-5"/>}</div>
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="font-bold text-xs">Rua / Logradouro</Label>
                    <Input className="h-12 rounded-xl bg-slate-50 border-none font-medium" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                  </div>
                  <div className="space-y-2"><Label className="font-bold text-xs">Número</Label><Input className="h-12 rounded-xl bg-slate-50 border-none text-center font-bold" value={formData.street_number} onChange={e => setFormData({...formData, street_number: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="font-bold text-xs">Bairro</Label><Input className="h-12 rounded-xl bg-slate-50 border-none font-medium" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="font-bold text-xs">Cidade</Label><Input className="h-12 rounded-xl bg-slate-50 border-none font-medium" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
                </CardContent>
              </Card>
            </div>

            {/* COLUNA DIREITA: OPERAÇÃO (4 colunas no desktop) */}
            <div className="lg:col-span-4 space-y-8 order-1 lg:order-2">
              
              {/* Estado da Loja Vivo */}
              <Card className="border-none shadow-lg bg-white rounded-[2rem] overflow-hidden">
                <div className="p-1 bg-emerald-500 w-full" />
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-emerald-500 animate-ping absolute" />
                    <div className="h-4 w-4 rounded-full bg-emerald-500 relative" />
                    <span className="font-black text-slate-800 tracking-tight">LOJA ONLINE</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50 font-bold">ATIVO</Badge>
                </CardContent>
              </Card>

              {/* HORÁRIOS (O Coração da Operação) */}
              <StoreHoursSettings storeId={store.id} />

              {/* Dica de Mestre Compacta */}
              <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
                <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-white/10 group-hover:rotate-12 transition-transform" />
                <div className="relative z-10 space-y-3">
                  <h3 className="font-black flex items-center gap-2 text-sm uppercase tracking-tighter">
                    <Info className="h-4 w-4" /> Dica de Branding
                  </h3>
                  <p className="text-[11px] font-medium leading-relaxed text-indigo-50">
                    Lojas com Banner e Logo profissionais passam mais confiança e podem aumentar as vendas em até 40%. Capriche nas fotos!
                  </p>
                </div>
              </div>
            </div>

          </div>
        </TabsContent>

        {/* MANTENDO AS OUTRAS ABAS COM DESIGN CONSISTENTE */}
        <TabsContent value="entrega" className="outline-none animate-in slide-in-from-bottom-2 duration-500">
          <DeliverySettings storeId={store.id} />
        </TabsContent>

        <TabsContent value="pagamentos" className="outline-none animate-in slide-in-from-bottom-2 duration-500">
          {/* ... Conteúdo do Mercado Pago que você já tem ... */}
          <div className="max-w-3xl mx-auto">
             {/* Use o mesmo estilo de Card arredondado aqui */}
             <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                {/* ... (código do MP) ... */}
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="notificacoes" className="outline-none animate-in slide-in-from-bottom-2">
          <SoundSettingsCard />
        </TabsContent>

        <TabsContent value="assinatura" className="outline-none animate-in slide-in-from-bottom-2">
          <SubscriptionSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Pequeno Helper para Badge se não estiver importado
function Badge({ children, className, variant = "default" }: any) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${className}`}>
      {children}
    </span>
  )
}