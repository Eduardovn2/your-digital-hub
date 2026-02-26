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
  Camera, ImageIcon, CreditCard, Wallet, AlertCircle, CheckCircle2,
  ChevronRight, Layers, Sparkles,
  Settings
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
          toast.loading("Finalizando conexão com Mercado Pago...");
          const { error } = await supabase.functions.invoke('exchange-mp-token', {
            body: { code, storeId: store.id }
          });
          if (error) throw error;
          toast.success("Conta conectada com sucesso! 🚀");
          window.history.replaceState({}, document.title, window.location.pathname);
          setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
          console.error(err);
          toast.error("Erro ao conectar conta.");
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
      const { error: uploadError } = await supabase.storage.from('store-assets').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('store-assets').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'banner_url']: publicUrl }));
      await supabase.from("stores").update({ [type === 'logo' ? 'logo_url' : 'banner_url']: publicUrl }).eq("id", store.id);
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
      .update({ ...formData, phone: formData.phone.replace(/\D/g, "") })
      .eq("id", store.id);
    if (error) toast.error("Erro ao atualizar.");
    else toast.success("Definições guardadas!");
    setLoading(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
            <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Configurações</h2>
            <p className="text-sm text-slate-500 font-medium">Gerencie a identidade e logística do seu Hub</p>
        </div>
      </div>

      <Tabs defaultValue="dados" className="space-y-8">
        {/* --- MENU DE ABAS GOURMETIZADO --- */}
        <div className="space-y-1">
          <div className="flex md:hidden items-center justify-end gap-1 px-2 text-[9px] font-black uppercase tracking-wider text-indigo-500 animate-pulse">
            <span>Deslize para ver mais</span>
            <ChevronRight className="h-3 w-3" />
          </div>

          <div className="relative w-full">
            <TabsList className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 h-auto flex flex-nowrap overflow-x-auto gap-2 justify-start rounded-2xl shadow-inner w-full no-scrollbar">
              <TabsTrigger value="dados" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all whitespace-nowrap shrink-0 font-bold text-slate-500">
                <Store className="h-4 w-4 mr-2 text-indigo-500" /> Loja & Morada
              </TabsTrigger>
              <TabsTrigger value="entrega" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-md transition-all whitespace-nowrap shrink-0 font-bold text-slate-500">
                <Truck className="h-4 w-4 mr-2 text-orange-500" /> Logística
              </TabsTrigger>
              <TabsTrigger value="pagamentos" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all whitespace-nowrap shrink-0 font-bold text-slate-500">
                <Wallet className="h-4 w-4 mr-2 text-blue-500" /> Pagamentos
              </TabsTrigger>
              <TabsTrigger value="notificacoes" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-md transition-all whitespace-nowrap shrink-0 font-bold text-slate-500">
                <Bell className="h-4 w-4 mr-2 text-pink-500" /> Notificações
              </TabsTrigger>
              <TabsTrigger value="assinatura" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-md transition-all whitespace-nowrap shrink-0 font-bold text-slate-500">
                <CreditCard className="h-4 w-4 mr-2 text-emerald-500" /> Assinatura
              </TabsTrigger>
            </TabsList>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent pointer-events-none md:hidden rounded-r-2xl" />
          </div>
        </div>

{/* --- DADOS --- */}
        <TabsContent value="dados" className="space-y-6 outline-none animate-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. SIDEBAR DE DICAS (Agora aparece PRIMEIRO no mobile: order-1) */}
            <div className="space-y-6 order-1 md:order-2">
                <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-3xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-tighter">
                            <Sparkles className="h-4 w-4" /> Dica de Mestre
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-indigo-100/80 leading-relaxed font-medium">
                        Lojas com Banner e Logo personalizados vendem até <span className="text-white font-black">40% mais</span>. Certifique-se de usar fotos reais dos seus produtos!
                    </CardContent>
                </Card>
                
                <Card className="border-none shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                   <div className="p-1 bg-emerald-500 w-full" />
                   <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Estado da Loja</CardTitle>
                   </CardHeader>
                   <CardContent className="flex items-center gap-3">
                       <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="font-bold text-slate-700 dark:text-slate-200">Sua loja está online</span>
                   </CardContent>
                </Card>
            </div>

            {/* 2. FORMULÁRIOS (Agora aparece DEPOIS no mobile: order-2) */}
            <div className="md:col-span-2 space-y-6 order-2 md:order-1">
                {/* Identidade Visual */}
                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden rounded-3xl">
                    <div className="h-1.5 bg-indigo-500 w-full" />
                    <CardHeader>
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                                <ImageIcon className="h-5 w-5 text-indigo-600" />
                            </div>
                            Identidade Visual
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Logo da Loja</Label>
                                <div className="flex items-center gap-4">
                                    <div className="relative h-24 w-24 rounded-3xl overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100 flex-shrink-0">
                                        {formData.logo_url ? (
                                            <img src={formData.logo_url} className="h-full w-full object-cover" alt="Logo" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-300"><ImageIcon className="h-8 w-8" /></div>
                                        )}
                                        {uploadingLogo && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>}
                                    </div>
                                    <Button variant="outline" size="sm" className="relative cursor-pointer rounded-xl font-bold border-indigo-100 hover:bg-indigo-50">
                                        Substituir
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleUpload(e, 'logo')} />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Banner de Capa</Label>
                                <div className="relative h-24 w-full rounded-3xl overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100 group">
                                    {formData.banner_url ? (
                                        <img src={formData.banner_url} className="h-full w-full object-cover" alt="Banner" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-slate-300"><ImageIcon className="h-8 w-8" /></div>
                                    )}
                                    <label className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                        <Camera className="text-white h-6 w-6" />
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'banner')} />
                                    </label>
                                    {uploadingBanner && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Perfil */}
                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden rounded-3xl">
                    <div className="h-1.5 bg-blue-500 w-full" />
                    <CardHeader>
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                                <Store className="h-5 w-5 text-blue-600" />
                            </div>
                            Perfil Público
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="font-bold">Nome Comercial</Label>
                                <Input className="bg-slate-50 border-none h-12 rounded-xl focus:bg-white transition-all shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">WhatsApp</Label>
                                <Input className="bg-slate-50 border-none h-12 rounded-xl focus:bg-white transition-all shadow-inner font-mono" value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} maxLength={15} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Breve Descrição</Label>
                            <Input className="bg-slate-50 border-none h-12 rounded-xl focus:bg-white transition-all shadow-inner" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                    </CardContent>
                </Card>

                {/* Endereço */}
                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden rounded-3xl">
                    <div className="h-1.5 bg-emerald-500 w-full" />
                    <CardHeader>
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                                <MapPin className="h-5 w-5 text-emerald-600" />
                            </div>
                            Localização
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="font-bold">CEP</Label>
                            <div className="relative">
                                <Input className="bg-slate-50 border-none h-12 rounded-xl pr-10 shadow-inner" value={formData.zip_code} onChange={handleCepChange} maxLength={9} />
                                <div className="absolute right-3 top-3.5">{loadingCep ? <Loader2 className="h-5 w-5 animate-spin text-indigo-600"/> : <Search className="h-5 w-5 text-slate-300"/>}</div>
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label className="font-bold">Rua / Logradouro</Label>
                            <Input className="bg-slate-50 border-none h-12 rounded-xl shadow-inner" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                        </div>
                        <div className="space-y-2"><Label className="font-bold">Número</Label><Input className="bg-slate-50 border-none h-12 rounded-xl shadow-inner text-center" value={formData.street_number} onChange={e => setFormData({...formData, street_number: e.target.value})} /></div>
                        <div className="space-y-2"><Label className="font-bold">Bairro</Label><Input className="bg-slate-50 border-none h-12 rounded-xl shadow-inner" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} /></div>
                        <div className="space-y-2"><Label className="font-bold">Cidade</Label><Input className="bg-slate-50 border-none h-12 rounded-xl shadow-inner" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={loading} className="px-10 py-7 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-2xl transition-all hover:scale-105 active:scale-95 font-black uppercase tracking-widest text-xs">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Save className="h-5 w-5 mr-2 text-indigo-400"/>}
                        Guardar Alterações
                    </Button>
                </div>
            </div>

          </div>
        </TabsContent>

        <TabsContent value="entrega" className="outline-none animate-in slide-in-from-bottom-2 duration-500">
          <DeliverySettings storeId={store.id} />
        </TabsContent>

        {/* --- PAGAMENTOS GOURMET --- */}
        <TabsContent value="pagamentos" className="space-y-6 outline-none animate-in slide-in-from-bottom-2 duration-500">
          <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <div className="h-2 bg-[#009EE3] w-full" />
            <CardHeader className="bg-[#009EE3]/5 pb-8 pt-10 text-center">
              <div className="bg-[#009EE3] w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20 mb-6">
                 <Wallet className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-black text-[#00445f]">Integração Mercado Pago</CardTitle>
              <CardDescription className="max-w-md mx-auto text-blue-600/60 font-medium">
                Aceite pagamentos via PIX e Cartão de forma automática e receba o dinheiro instantaneamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10">
              <div className="flex flex-col items-center justify-center py-10 space-y-8 border-4 border-dashed border-blue-50 rounded-[3rem] bg-blue-50/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-xl px-4 text-center md:text-left">
                    <div className="space-y-2">
                        <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest">Segurança Total</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Seus dados são processados diretamente pelos servidores do Mercado Pago.</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest">Taxas Baixas</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Aproveite as menores taxas de transação do mercado para o seu delivery.</p>
                    </div>
                </div>

                {formData.mp_access_token ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3 bg-emerald-500 text-white px-8 py-3 rounded-2xl shadow-lg shadow-emerald-500/20 animate-bounce">
                      <CheckCircle2 className="h-6 w-6" />
                      <span className="text-sm font-black uppercase tracking-widest">Integração Ativa</span>
                    </div>
                    <Button variant="ghost" onClick={handleConnectMP} className="text-slate-400 hover:text-blue-600 font-bold text-xs uppercase underline decoration-2 underline-offset-4">
                      Reconectar ou alterar conta
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleConnectMP} className="bg-[#009EE3] hover:bg-[#007EB5] text-white font-black rounded-[2rem] px-12 h-16 shadow-2xl transition-all hover:scale-105 active:scale-95 group">
                    <CreditCard className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    CONECTAR MINHA CONTA AGORA
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-6 outline-none animate-in slide-in-from-bottom-2 duration-500">
          <SoundSettingsCard />
        </TabsContent>

        <TabsContent value="assinatura" className="outline-none animate-in slide-in-from-bottom-2 duration-500">
          <SubscriptionSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}