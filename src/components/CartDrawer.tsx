import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useDevice } from "@/hooks/useDevice";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { 
  Loader2, ShoppingBag, CreditCard, Banknote, Trash2, Coins, 
  ImageOff, AlertTriangle, Clock, CheckCircle2, XCircle, 
  Bike, Package, ClipboardList, ArrowRight, Activity, BellRing, PackageCheck
} from "lucide-react";
import { DeliveryAddressForm, AddressData } from "@/components/DeliveryAddressForm";

const parseCurrency = (value: string) => {
  if (!value) return 0;
  return parseFloat(value.replace(",", ".")) || 0;
};

// Componente de Badge de Status (Texto e Ícones Ajustados)
const OrderStatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    pending: { 
        bg: "bg-slate-100", text: "text-slate-600", icon: Clock, 
        label: "Pendente" // Pedido #1
    },
    accepted: { 
        bg: "bg-blue-50", text: "text-blue-700", icon: Package, 
        label: "Preparando" // Pedido #2
    },
    ready: { 
        bg: "bg-purple-50", text: "text-purple-700", icon: PackageCheck, 
        label: "Preparando p/ Entrega" // Pedido #3 (Status 'Pronto' no admin)
    },
    delivering: { 
        bg: "bg-orange-50", text: "text-orange-700", icon: Bike, // Pedido #4 (Moto)
        label: "Em Entrega" 
    },
    completed: { 
        bg: "bg-green-50", text: "text-green-700", icon: CheckCircle2, 
        label: "Concluído" // Pedido #5
    },
    cancelled: { 
        bg: "bg-red-50", text: "text-red-700", icon: XCircle, 
        label: "Cancelado" 
    },
  };

  const current = styles[status] || styles.pending;
  const Icon = current.icon;

  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border shadow-sm bg-white">
      {/* Indicador de movimento (Pulso) para status ativos */}
      {!["completed", "cancelled"].includes(status) && (
        <span className="relative flex h-2 w-2 mr-1">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'delivering' ? 'bg-orange-400' : 'bg-blue-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'delivering' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
        </span>
      )}
      <Icon className={`h-3.5 w-3.5 ${current.text}`} />
      <span className={current.text}>{current.label}</span>
    </span>
  );
};

export default function CartDrawer() {
  const { items, removeFromCart, clearCart, storeId } = useCart();
  const { toast } = useToast();
  const deviceId = useDevice();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("cart");
  const [loading, setLoading] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [pagamento, setPagamento] = useState<"pix" | "card" | "money">("pix");
  const [trocoPara, setTrocoPara] = useState("");
  
  const [frete, setFrete] = useState<number | null>(null);
  const [enderecoCompleto, setEnderecoCompleto] = useState<AddressData | null>(null);

  const subtotalReal = items.reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0);
  const totalFinal = subtotalReal + (frete || 0);
  
  const isFormValid = items.length > 0 && nome.trim().length > 0 && telefone.trim().length > 0 && frete !== null && enderecoCompleto?.numero;

  // Lógica: Pega o último pedido. Se estiver concluído/cancelado, o banner some.
  const lastOrder = orderHistory[0];
  const activeOrder = lastOrder && !["completed", "cancelled"].includes(lastOrder.status) 
    ? lastOrder 
    : null;

  useEffect(() => {
    if (!deviceId || !open) return;

    fetchOrderHistory();

    const channel = supabase
      .channel(`customer-orders-${deviceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `device_id=eq.${deviceId}` },
        () => {
          fetchOrderHistory();
          toast({ title: "Status Atualizado", description: "Veja a atualização no seu pedido." });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [deviceId, open]);

  const fetchOrderHistory = async () => {
      if (!deviceId) return;
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setOrderHistory(data);
  };

  const handleAddressUpdate = (address: AddressData, valorFrete: number | null) => {
    setEnderecoCompleto(address);
    setFrete(valorFrete);
  };

  const handleFinalizar = async () => {
    if (!isFormValid) return;
    setLoading(true);

    try {
      const addressString = `${enderecoCompleto!.rua}, ${enderecoCompleto!.numero} - ${enderecoCompleto!.bairro}, ${enderecoCompleto!.cidade} (${enderecoCompleto!.cep})`;
      
      const orderPayload = {
        store_id: storeId,
        customer_name: nome,
        customer_phone: telefone,
        customer_address: addressString,
        delivery_fee: frete,
        total_amount: totalFinal,
        payment_method: pagamento,
        change_for: pagamento === "money" ? parseCurrency(trocoPara) : null,
        status: "pending",
        device_id: deviceId, 
        items: items
      };

    // MUDE PARA ISTO:
      const { data, error } = await supabase.from("orders" as any).insert([orderPayload]).select().single();
            if (error) throw error;

      toast({ title: "Pedido Enviado!", description: "Acompanhe o status agora mesmo." });
      clearCart();
      setActiveTab("orders"); 
      fetchOrderHistory();

    } catch (error: any) {
      toast({ title: "Erro ao enviar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="relative h-14 px-8 rounded-full bg-slate-900 text-white shadow-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95">
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            {activeOrder && (
              <span className="absolute -top-2 -right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
            )}
          </div>
          <span className="font-bold">Sacola (R$ {subtotalReal.toFixed(2)})</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-slate-50 p-0 border-l-0 shadow-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
            
            <SheetHeader className="px-6 pt-6 pb-2 bg-white border-b shadow-sm z-20">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1.5 rounded-xl h-14">
                    <TabsTrigger value="cart" className="rounded-lg text-xs font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        <ShoppingBag className="h-4 w-4 mr-2" /> Sacola
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="rounded-lg text-xs font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        <div className="flex items-center gap-1.5">
                            <ClipboardList className="h-4 w-4" />
                            Meus Pedidos
                            {activeOrder && <span className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />}
                        </div>
                    </TabsTrigger>
                </TabsList>
            </SheetHeader>

            <TabsContent value="cart" className="flex-1 flex flex-col overflow-hidden m-0 relative">
                <ScrollArea className="flex-1 px-6 pb-40">
                <div className="space-y-6 py-6">
                    
                    {/* BANNER DE ACOMPANHAMENTO DINÂMICO */}
                    {activeOrder && (
                        <div 
                            onClick={() => setActiveTab("orders")}
                            className="group cursor-pointer relative overflow-hidden p-5 rounded-2xl 
                                       bg-slate-900 text-white shadow-xl border border-white/5
                                       animate-in fade-in slide-in-from-top-4 duration-500"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <BellRing className="h-16 w-16 text-white" />
                            </div>
                            <div className="relative flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 bg-orange-500 rounded-full animate-ping" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {activeOrder.status === 'pending' && "Pedido Pendente"}
                                            {activeOrder.status === 'accepted' && "Em Preparo"}
                                            {activeOrder.status === 'ready' && "Aguardando Entrega"}
                                            {activeOrder.status === 'delivering' && "Saiu para Entrega"}
                                        </span>
                                    </div>
                                    
                                    <h4 className="text-white font-bold text-sm leading-tight">
                                        {activeOrder.status === 'pending' && "Aguardando a loja aceitar..."}
                                        {activeOrder.status === 'accepted' && "A cozinha já está preparando!"}
                                        {activeOrder.status === 'ready' && "Já vamos despachar seu pedido."}
                                        {activeOrder.status === 'delivering' && "O motoboy está a caminho!"}
                                    </h4>

                                    <div className="flex pt-1">
                                        <OrderStatusBadge status={activeOrder.status} />
                                    </div>
                                </div>
                                <ArrowRight className="h-6 w-6 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <h3 className="font-bold text-[11px] text-slate-400 uppercase tracking-widest">Resumo do Carrinho</h3>
                        {items.length === 0 && !activeOrder && (
                            <div className="text-center py-10 opacity-40">Sua sacola está vazia</div>
                        )}
                        {items.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl border shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {item.image_url ? <img src={item.image_url} className="h-full w-full object-cover" /> : <ImageOff className="text-slate-300 h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</p>
                                        <p className="text-xs text-slate-500 font-medium">{item.quantity}x R$ {Number(item.price).toFixed(2)}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500" onClick={() => removeFromCart(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* FORMULÁRIO */}
                    <div className="space-y-4 bg-white p-5 rounded-2xl border shadow-sm">
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Quem vai receber?</Label>
                            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" className="bg-slate-50 h-11" />
                            <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="WhatsApp" className="bg-slate-50 h-11" />
                        </div>
                        <Separator className="my-2" />
                        <DeliveryAddressForm onAddressComplete={handleAddressUpdate} storeId={storeId} />
                    </div>

                    {/* PAGAMENTO */}
                    <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Forma de Pagamento</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {['pix', 'card', 'money'].map((m) => (
                                <button key={m} onClick={() => setPagamento(m as any)} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${pagamento === m ? 'border-green-600 bg-green-50 text-green-700 shadow-md ring-1 ring-green-600' : 'border-slate-100 text-slate-500'}`}>
                                    {m === 'pix' && <Banknote className="h-5 w-5" />}
                                    {m === 'card' && <CreditCard className="h-5 w-5" />}
                                    {m === 'money' && <Coins className="h-5 w-5" />}
                                    <span className="text-[9px] font-black uppercase">{m}</span>
                                </button>
                            ))}
                        </div>
                        {pagamento === "money" && (
                             <div className="mt-2 animate-in fade-in">
                                <Label className="text-xs text-slate-600 mb-1.5 block font-bold">Troco para quanto?</Label>
                                <Input placeholder="Ex: 50,00" value={trocoPara} onChange={e => setTrocoPara(e.target.value)} className="bg-white border-slate-300" type="number" step="0.01"/>
                            </div>
                        )}
                    </div>
                </div>
                </ScrollArea>

                <div className="absolute bottom-0 w-full p-6 bg-white/95 backdrop-blur-md border-t z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <Button 
                        onClick={handleFinalizar}
                        disabled={loading || !isFormValid}
                        className={`w-full h-14 text-base font-black rounded-2xl shadow-xl transition-all ${!isFormValid ? "bg-slate-200 text-slate-400" : "bg-slate-900 hover:bg-black text-white"}`}
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isFormValid ? "Confirmar Pedido" : "Preencha todos os dados")}
                    </Button>
                </div>
            </TabsContent>

            <TabsContent value="orders" className="flex-1 overflow-hidden m-0 bg-slate-50/50">
                <ScrollArea className="h-full px-6 py-8">
                    {orderHistory.length === 0 ? (
                        <div className="text-center py-20">
                            <Activity className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 font-bold text-sm">Nenhum pedido recente.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-10">
                            {orderHistory.map((order) => (
                                <div key={order.id} className={`bg-white p-5 rounded-2xl border transition-all ${activeOrder?.id === order.id ? 'border-orange-200 shadow-orange-100/50 shadow-lg scale-[1.02]' : 'border-slate-100 shadow-sm'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Ref: #{order.id.slice(0, 4)}</span>
                                            <p className="text-xs font-bold text-slate-700">{new Date(order.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <OrderStatusBadge status={order.status} />
                                    </div>
                                    <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl">
                                        {(order.items || []).map((item: any, idx: number) => (
                                            <div key={idx} className="flex gap-2 text-sm text-slate-600">
                                                <span className="font-black text-slate-900">{item.quantity}x</span>
                                                <span className="line-clamp-1">{item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t">
                                        <span className="text-xs font-black text-slate-400 uppercase">Total</span>
                                        <span className="text-lg font-black text-slate-900">R$ {order.total_amount?.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}