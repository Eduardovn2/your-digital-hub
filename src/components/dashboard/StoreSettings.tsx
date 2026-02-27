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
  ChevronRight, Sparkles, Settings, Info, Clock, User,
  Instagram
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
    instagram: store?.instagram || "",
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

  // --- LÓGICA MERCADO PAGO (PRESERVADA) ---
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
  
  // --- UPLOADS (PRESERVADOS) ---
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

  // --- CEP (PRESERVADO) ---
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
          toast.success("Morada localizada!");
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
      

{/* HEADER FIXO DE GESTÃO */}
      <div className="flex items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/80 p-4 md:p-6 rounded-3xl md:rounded-[2rem] border border-slate-100 shadow-sm sticky top-0 z-30 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 md:p-3 bg-indigo-600 rounded-xl md:rounded-2xl shadow-md shadow-indigo-200/50">
            <Settings className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Configurações</h2>
            <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 hidden sm:block">Painel Administrativo</p>
          </div>
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={loading} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 md:h-12 px-4 md:px-8 rounded-xl font-black shadow-lg shadow-indigo-200/50 transition-all active:scale-95 text-xs md:text-sm shrink-0"
        >
          {loading ? (
            <Loader2 className="animate-spin h-4 w-4 md:mr-2" />
          ) : (
            <Save className="h-4 w-4 md:mr-2" />
          )}
          
          {/* Mostra texto completo no PC, e texto curto no Mobile */}
          <span className="hidden md:inline">GUARDAR ALTERAÇÕES</span>
          <span className="inline md:hidden ml-2">SALVAR</span>
        </Button>
      </div>

<Tabs defaultValue="perfil" className="space-y-8 w-full">
        
        {/* NAVEGAÇÃO DE ABAS ORGANIZADA COM AVISO MOBILE */}
        <div className="space-y-2">
          
          <div className="flex md:hidden items-center justify-end gap-1 px-2 text-[10px] font-black uppercase tracking-wider text-indigo-500 animate-pulse">
            <span>Deslize as opções</span>
            <ChevronRight className="h-3 w-3" />
          </div>

          <div className="relative w-full">
            {/* O SEGREDO É O JUSTIFY-START: Garante que a primeira aba nunca some */}
            <TabsList className="bg-slate-100/50 dark:bg-slate-900 p-1.5 flex justify-start flex-nowrap overflow-x-auto gap-2 rounded-2xl w-full no-scrollbar snap-x snap-mandatory">
             {[
                { id: "perfil", label: "Perfil", icon: User, color: "text-indigo-500" },
                { id: "horarios", label: "Funcionamento", icon: Clock, color: "text-amber-500" },
                { id: "entrega", label: "Endereço & Entrega", icon: MapPin, color: "text-emerald-500" }, 
                { id: "pagamentos", label: "Pagamentos", icon: Wallet, color: "text-blue-500" },
                { id: "notificacoes", label: "Alertas", icon: Bell, color: "text-pink-500" },
                { id: "assinatura", label: "Plano", icon: CreditCard, color: "text-purple-500" }
              ].map(tab => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="rounded-xl px-5 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md font-bold text-slate-500 transition-all shrink-0 snap-start h-auto"
                >
                  <tab.icon className={`h-4 w-4 mr-2 ${tab.color}`} /> {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent pointer-events-none md:hidden rounded-r-2xl" />
          </div>
        </div>

        {/* --- ABA 1: PERFIL (BRANDING) --- */}
        <TabsContent value="perfil" className="outline-none animate-in slide-in-from-bottom-2 duration-500">
          <div className="max-w-4xl mx-auto space-y-8">
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <div className="relative h-48 bg-slate-100 group">
                {formData.banner_url ? (
                  <img src={formData.banner_url} className="w-full h-full object-cover" alt="Banner" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 flex-col gap-2">
                    <ImageIcon className="h-10 w-10" />
                    <span className="text-[10px] font-black uppercase">Banner de Capa</span>
                  </div>
                )}
                <label className="absolute bottom-4 right-4 bg-white/90 backdrop-blur shadow-lg p-3 rounded-xl cursor-pointer hover:scale-110 transition-all border border-slate-100">
                  <Camera className="h-5 w-5 text-indigo-600" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'banner')} />
                </label>
                <div className="absolute -bottom-10 left-8">
                  <div className="relative h-28 w-28 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white group/logo">
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
<CardContent className="pt-16 pb-10 px-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest text-slate-400">Nome da Loja</Label>
                    <Input className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner text-lg font-black" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest text-slate-400">WhatsApp de Pedidos</Label>
                    <Input className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner font-mono text-lg font-black text-indigo-600" value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} />
                  </div>
                </div>

                {/* Bloco dividido para Descrição e Instagram */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="font-black text-xs uppercase tracking-widest text-slate-400">Descrição / Biografia</Label>
                    <Input className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner font-medium" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Uma frase curta que define o seu negócio..." />
                  </div>
                  {/* --- NOVO CAMPO: INSTAGRAM --- */}
                  <div className="space-y-2">
                    {/* Removido o <Instagram /> daqui para evitar o aviso de deprecated */}
                    <Label className="font-black text-xs uppercase tracking-widest text-slate-400">
                      Instagram da Loja
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-4 text-slate-400 font-bold">@</span>
                      <Input 
                        className="h-14 pl-9 rounded-2xl bg-slate-50 border-none shadow-inner font-bold text-pink-600 placeholder:text-slate-300" 
                        value={formData.instagram} 
                        onChange={e => setFormData({...formData, instagram: e.target.value})} 
                        placeholder="sualoja" 
                      />
                    </div>
                  </div>
                  {/* ----------------------------- */}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- ABA 2: FUNCIONAMENTO --- */}
        <TabsContent value="horarios" className="outline-none animate-in slide-in-from-bottom-2 duration-500">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="border-none shadow-lg bg-white rounded-[2rem] overflow-hidden">
              <div className="p-1 bg-emerald-500 w-full" />
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-black text-slate-800 tracking-tight uppercase">Loja visível no Hub</span>
                </div>
                <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full border border-emerald-100">ATIVO</span>
              </CardContent>
            </Card>
            <StoreHoursSettings storeId={store.id} />
          </div>
        </TabsContent>


{/* --- ABA 3: ENDEREÇO E LOGÍSTICA UNIFICADA --- */}
        <TabsContent value="entrega" className="outline-none animate-in slide-in-from-bottom-2 duration-500 space-y-8">
          
          {/* 1. CARTÃO DE ENDEREÇO DA LOJA */}
          <div className="max-w-4xl mx-auto">
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-emerald-50/30 border-b border-emerald-100/50 pb-6">
                <CardTitle className="text-xl font-black flex items-center gap-2 text-emerald-900">
                  <MapPin className="h-6 w-6 text-emerald-600" /> Local de Origem
                </CardTitle>
                <CardDescription>De onde os seus pedidos irão sair. Usado para calcular rotas e distâncias.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <Label className="font-black text-xs uppercase text-slate-400">CEP</Label>
                  <div className="relative">
                    <Input className="h-14 rounded-2xl bg-slate-50 border-none pr-10 font-black text-lg shadow-inner focus:ring-emerald-500" value={formData.zip_code} onChange={handleCepChange} maxLength={9} />
                    <div className="absolute right-4 top-4.5">{loadingCep ? <Loader2 className="animate-spin text-emerald-600 h-5 w-5"/> : <Search className="text-slate-300 h-5 w-5"/>}</div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="font-black text-xs uppercase text-slate-400">Rua / Logradouro</Label>
                  <Input className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner font-bold focus:ring-emerald-500" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                </div>
                <div className="space-y-2"><Label className="font-black text-xs uppercase text-slate-400">Número</Label><Input className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner text-center font-black focus:ring-emerald-500" value={formData.street_number} onChange={e => setFormData({...formData, street_number: e.target.value})} /></div>
                <div className="space-y-2"><Label className="font-black text-xs uppercase text-slate-400">Bairro</Label><Input className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner font-bold focus:ring-emerald-500" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} /></div>
                <div className="space-y-2"><Label className="font-black text-xs uppercase text-slate-400">Cidade</Label><Input className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner font-bold focus:ring-emerald-500" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
              </CardContent>
            </Card>
          </div>

          {/* 2. COMPONENTE DE LOGÍSTICA E TAXAS DE ENTREGA */}
          <div className="max-w-4xl mx-auto">
            <DeliverySettings storeId={store.id} />
          </div>

        </TabsContent>


        {/* --- ABA DE PAGAMENTOS (MERCADO PAGO TOTALMENTE INTEGRADO) --- */}
        <TabsContent value="pagamentos" className="space-y-6 outline-none animate-in slide-in-from-bottom-2 duration-500">
          <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border-blue-100 max-w-4xl mx-auto">
            <div className="h-2 bg-[#009EE3] w-full" />
            <CardHeader className="bg-blue-50/50 pb-8 pt-10 text-center">
              <div className="bg-[#009EE3] w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20 mb-6">
                 <Wallet className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-black text-blue-900">Pagamentos Mercado Pago</CardTitle>
              <CardDescription className="max-w-md mx-auto text-blue-700/70 font-medium">
                Receba via PIX e Cartão diretamente na sua conta oficial.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10">
              <div className="flex flex-col items-center justify-center py-12 space-y-10 border-4 border-dashed border-blue-50 rounded-[3rem] bg-blue-50/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-xl px-4 text-center md:text-left">
                    <div className="space-y-2">
                        <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Segurança</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Conexão oficial via Mercado Pago Connect.</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest flex items-center gap-2"><Sparkles className="h-4 w-4" /> Rapidez</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">O dinheiro das vendas cai na sua conta na hora.</p>
                    </div>
                </div>

                {formData.mp_access_token ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3 bg-emerald-500 text-white px-10 py-4 rounded-[2rem] shadow-xl shadow-emerald-500/20 animate-in zoom-in-95 duration-500">
                      <CheckCircle2 className="h-6 w-6" />
                      <span className="text-sm font-black uppercase tracking-widest">Integração Conectada</span>
                    </div>
                    <Button variant="ghost" onClick={handleConnectMP} className="text-slate-400 hover:text-blue-600 font-bold text-[10px] uppercase underline decoration-2 underline-offset-4">
                      Trocar conta do Mercado Pago
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