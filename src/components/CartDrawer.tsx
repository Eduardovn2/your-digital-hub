import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CartPayment } from "./cart/CartPayment";
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
import { useStoreHours, isStoreCurrentlyOpen } from "@/hooks/useStoreHours";
import { 
  Loader2, ShoppingBag, CreditCard, Banknote, Trash2, Coins, 
  ImageOff, AlertTriangle, Clock, CheckCircle2, XCircle, 
  Bike, Package, ClipboardList, ArrowRight, Activity, BellRing, 
  PackageCheck, UtensilsCrossed, HelpCircle, User, X,
  Timer, Lock
} from "lucide-react";
import { DeliveryAddressForm, AddressData } from "@/components/DeliveryAddressForm";

const OrderSkeleton = () => (
  <div className="p-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-900/40 mb-4 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="space-y-2">
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
    </div>
    <div className="space-y-2">
      <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
    </div>
  </div>
);

const parseCurrency = (value: string) => {
  if (!value) return 0;
  return parseFloat(value.replace(",", ".")) || 0;
};

const formatPhoneNumber = (value: string) => {
  // Remove tudo que não for número
  const numbers = value.replace(/\D/g, "");
  
  // Limita tamanho (11 dígitos: DDD + 9 números)
  const truncated = numbers.slice(0, 11);

  // Aplica a máscara (XX) XXXXX-XXXX
  if (truncated.length <= 2) return truncated;
  if (truncated.length <= 7) return `(${truncated.slice(0, 2)}) ${truncated.slice(2)}`;
  return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 7)}-${truncated.slice(7)}`;
};

// --- TRADUTOR DE STATUS ---
const normalizeStatus = (status: string | null | undefined) => {
  const s = (status || "").toLowerCase().trim();
  if (!s) return "pending";

  // Ordem importa: do mais específico para o mais genérico
  if (['cancel', 'recusado'].some(k => s.includes(k))) return "cancelled";
  if (['complet', 'conclui', 'finaliza', 'entregue', 'delivered', 'done'].some(k => s.includes(k))) return "completed";
  if (['saiu', 'caminho', 'moto', 'delivery', 'delivering'].some(k => s.includes(k))) return "delivering";
  if (['pronto', 'retirada', 'ready', 'balcao'].some(k => s.includes(k))) return "ready";
  if (['prepar', 'cozinha', 'forno', 'making', 'preparing'].some(k => s.includes(k))) return "preparing";
  // 'paid' = pagamento confirmado → pedido entra na fila da loja
  if (['aceito', 'fila', 'confirmado', 'confirmed', 'accepted', 'paid'].some(k => s.includes(k))) return "accepted";

  return "pending";
};

// --- BADGE ---
// Adicionamos o paymentMethod nas propriedades da etiqueta
const OrderStatusBadge = ({ status, paymentMethod }: { status: string, paymentMethod?: string }) => {
  const statusKey = normalizeStatus(status);
  
  // Verifica se o pagamento é em dinheiro
  const isDinheiro = ['dinheiro', 'cash'].includes((paymentMethod || "").toLowerCase());

  const styles = {
    pending: { 
       bg: "bg-slate-100 dark:bg-slate-800", 
       text: "text-slate-600 dark:text-slate-400", 
       icon: Clock, 
       // A MÁGICA: Se for dinheiro, muda a frase!
       label: isDinheiro ? "Aguardando Loja" : "Aguardando Pagamento" 
    },
    accepted: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", icon: ClipboardList, label: "Na Fila" },
    preparing: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", icon: UtensilsCrossed, label: "Preparando" },
    ready: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400", icon: PackageCheck, label: "Pronto p/ Entrega" },
    delivering: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-400", icon: Bike, label: "Em Entrega" },
    completed: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", icon: CheckCircle2, label: "Concluído" },
    cancelled: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", icon: XCircle, label: "Cancelado" },
  };

  const current = styles[statusKey as keyof typeof styles] || styles.pending;
  const Icon = current.icon;
  
  const isActive = !["completed", "cancelled"].includes(statusKey);

  return (
    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border shadow-sm transition-all duration-300 ${current.bg} ${current.text} border-black/5`}>
      {isActive && (
        <span className="relative flex h-2 w-2 mr-1">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusKey === 'delivering' ? 'bg-orange-400' : 'bg-blue-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${statusKey === 'delivering' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
        </span>
      )}
      <Icon className="h-3.5 w-3.5" />
      {current.label}
    </span>
  );
};

export default function CartDrawer() {
    const { items, total, storeId, clearCart, removeFromCart, customerId } = useCart();

    const [pixData, setPixData] = useState<{qr_code: string, qr_code_base64: string} | null>(null);
    const [showPixScreen, setShowPixScreen] = useState(false);

    const { toast } = useToast();


  
  const deviceId = useDevice();

  const { data: hoursData, isLoading: loadingHours } = useStoreHours(storeId);
    const isOpen = isStoreCurrentlyOpen(hoursData);

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("cart");
  const [loading, setLoading] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [pagamento, setPagamento] = useState<"pix" | "cartão" | "dinheiro">("pix");
  const [trocoPara, setTrocoPara] = useState("");
  
  const [frete, setFrete] = useState<number | null>(null);
  const [enderecoCompleto, setEnderecoCompleto] = useState<AddressData | null>(null);
  
  const [isRepaying, setIsRepaying] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const [hasMercadoPago, setHasMercadoPago] = useState(false);

// --- NOVO: BUSCA A CONFIGURAÇÃO ASSIM QUE O CARRINHO ABRE ---
  useEffect(() => {
    if (!storeId) return;
    
    const checkPaymentMethods = async () => {
      // Usamos select("*") para evitar que o TypeScript bloqueie a query
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("id", storeId)
        .single();
        
      // Forçamos o tipo com (data as any) para ele ignorar o aviso de tipagem
      setHasMercadoPago(!!(data as any)?.mp_access_token);
    };
    
    checkPaymentMethods();
  }, [storeId]);
  // -----------------------------------------------------------
  // -----------------------------------------------------------

  // Atualiza o relógio a cada 10 segundos para o cronômetro
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [open]);

const subtotalReal = items.reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0);
  const totalFinal = subtotalReal + (frete || 0);
  
  // --- FALTAVA ESTA LINHA (Cria a validação do telefone) ---
  const isPhoneValid = telefone.replace(/\D/g, "").length === 11; 
  // ---------------------------------------------------------

  const isAddressValid = enderecoCompleto?.numero 
    ? (enderecoCompleto.numero === "S/N" 
        ? !!enderecoCompleto.complemento && !!enderecoCompleto.referencia // Se S/N, exige compl. e ref.
        : true) 
    : false;

  const isFormValid = 
    items.length > 0 && 
    nome.trim().length > 0 && 
    isPhoneValid && // Agora o código sabe o que é isso
    frete !== null && 
    isAddressValid && 
    isOpen;

  // Lógica do Banner
  const lastOrder = orderHistory[0];
  const lastStatusKey = normalizeStatus(lastOrder?.status);
  const isFinished = ["completed", "cancelled"].includes(lastStatusKey);
  const activeOrder = lastOrder && !isFinished ? lastOrder : null;

useEffect(() => {
    // Se não tiver ID ou a sacola estiver fechada, não faz nada
    if (!deviceId || !open) return;

    // PASSO 1: Assim que abre, garante que o Skeleton está aparecendo
    setIsInitialLoading(true);

    let channel: any = null;

    // PERFORMANCE: Atrasamos a busca em 350ms (tempo da animação da gaveta)
    const timer = setTimeout(async () => {
        
        // PASSO 2: Busca os dados e ESPERA (await) eles chegarem
        await fetchOrderHistory(); 
        
        // PASSO 3: Dados chegaram! Pode esconder o Skeleton e mostrar a lista real
        setIsInitialLoading(false);
        
        // PASSO 4: Liga o canal de atualizações em tempo real (Realtime)
        channel = supabase
          .channel(`customer-orders-${deviceId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `device_id=eq.${deviceId}` }, () => {
              fetchOrderHistory();
              toast({ title: "🔔 Atualização", description: "O status do seu pedido mudou." });
          })
          .subscribe();
    }, 350);

    return () => { 
        clearTimeout(timer); // Cancela se fechar rápido (evita erros)
        if (channel) supabase.removeChannel(channel); 
    };
  }, [deviceId, open]);

const fetchOrderHistory = async () => {
    if (!deviceId) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(15);
    
    if (data) {
      let needsRefresh = false;
      const currentTime = Date.now();
      
      for (const order of data) {
        if (order.status === 'pending' && ['pix', 'cartão', 'card'].includes((order as any).payment_method?.toLowerCase())) {
          const diffMins = (currentTime - new Date(order.created_at).getTime()) / 60000;
          if (diffMins >= 5) {
            // Cancela no banco automaticamente se passou de 5 minutos!
            await supabase.from("orders").update({ status: 'cancelled' }).eq('id', order.id);
            needsRefresh = true;
          }
        }
      }

      if (needsRefresh) {
        const { data: refreshedData } = await supabase
          .from("orders")
          .select("*")
          .eq("device_id", deviceId)
          .order("created_at", { ascending: false })
          .limit(15);
        if (refreshedData) setOrderHistory(refreshedData);
      } else {
        setOrderHistory(data);
      }
    }
  };

  const handleAddressUpdate = (address: AddressData, valorFrete: number | null) => {
    setEnderecoCompleto(address);
    setFrete(valorFrete);
  };

const handleFinalizar = async () => {

    // --- ADICIONE ESTA TRAVA NO INÍCIO DA FUNÇÃO ---
  if (!isOpen) {
    toast({
      title: "Loja Fechada 🚫",
      description: "Desculpe, não estamos aceitando pedidos no momento.",
      variant: "destructive"
    });
    return;
  }

  if (!isFormValid) return;
  setLoading(true);

  try {
    const addressString = `${enderecoCompleto!.rua}, ${enderecoCompleto!.numero} - ${enderecoCompleto!.bairro}`;
    
    const itemsData = items.map((item) => ({
      product_id: item.id,
      product_name: item.name,
      product_price: Number(item.price),
      quantity: item.quantity,
      subtotal: Number(item.price) * (item.quantity || 1),
      notes: item.observation || null, // Bug #9: salva observação do item
    }));

    const orderPayload = {
      store_id: storeId,
      customer_name: nome,
      customer_phone: telefone.replace(/\D/g, ""),
      customer_address: addressString,
      delivery_fee: frete,
      subtotal: subtotalReal,
      total: totalFinal,
      payment_method: pagamento,
      change_for: pagamento === "dinheiro" ? parseCurrency(trocoPara) : null,
      status: "pending" as const,
      device_id: deviceId,
      items: itemsData 
    };

    // 1. Salva o pedido no banco primeiro (Sempre necessário)
    const { data: insertedOrder, error: orderError } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (orderError) throw orderError;

    // 2. BUSCA DADOS DA LOJA (Necessário para WhatsApp ou MP)
    const { data: storeData } = await supabase
      .from("stores")
      .select("phone, name, slug, mp_access_token")
      .eq("id", storeId)
      .single();

    // --- FLUXO HÍBRIDO DE PAGAMENTO ---

    // CASO A: DINHEIRO (WhatsApp direto)
    if (pagamento === "dinheiro") {
      enviarWhatsApp(insertedOrder.id, storeData);
      clearCart();
      setActiveTab("orders");
      setOpen(false);
    } 
    // CASO B: PIX OU CARTÃO (Chama Mercado Pago via Edge Function)
    else {
      const { data, error: funcError } = await supabase.functions.invoke('process-payment', {
        body: { orderId: insertedOrder.id, paymentMethod: pagamento, storeId }
      });

      if (funcError || data.error) throw new Error(data?.error || "Erro ao processar pagamento");

      if (pagamento === "pix") {
        setPixData(data);
        setShowPixScreen(true); // Abre a tela do QR Code dentro da sacola
        clearCart(); // Bug #11: limpa o carrinho após iniciar pagamento PIX
      } else if (pagamento === "cartão") {
        // Redireciona para o Checkout Pro do Mercado Pago
        window.location.href = data.init_point;
      }
    }

  } catch (error: any) {
    console.error("Erro:", error);
    toast({ title: "Erro no pedido", description: error.message, variant: "destructive" });
  } finally {
    setLoading(false);
  }
};

const handleRepay = async (order: any) => {
    setIsRepaying(order.id);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('process-payment', {
        body: { orderId: order.id, paymentMethod: order.payment_method, storeId: order.store_id }
      });

      if (funcError || data.error) throw new Error(data?.error || "Erro ao conectar com Mercado Pago");

      if (order.payment_method === 'pix') {
        setPixData(data);
        setShowPixScreen(true);
        setActiveTab("cart"); // Volta para a tela principal para mostrar o PIX
      } else {
        window.location.href = data.init_point;
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsRepaying(null);
    }
  };

// Função auxiliar para o WhatsApp (mantendo seu layout House Burguer)
const enviarWhatsApp = (orderId: string, storeData: any) => {
    // Bug #10: null check para evitar TypeError se phone for null
    const numeroLoja = (storeData?.phone ?? "").replace(/\D/g, "");
    const storeLink = `${window.location.origin}/${storeData.slug}`;
    
    const linhas = [
      `${storeData.name}`,
      ``,
      `Meu nome é ${nome}, Contato: ${telefone.replace(/\D/g, "")}`,
      ``,
      `Código do pedido: #${orderId.slice(0, 6).toUpperCase()}`,
      ``
    ];
    
    items.forEach(item => {
        linhas.push(`*${item.quantity}x - ${item.name}*`); // Colocamos em negrito no WhatsApp
        
        // --- MÁGICA DOS COMPLEMENTOS AQUI ---
        if (item.observation) {
            linhas.push(`   ↳ ${item.observation}`); // Adiciona uma setinha elegante
        }
        // ------------------------------------
        
        linhas.push(`   Unid: R$ ${Number(item.price).toFixed(2).replace('.', ',')}`);
        linhas.push(`   Subtotal: R$ ${(Number(item.price) * (item.quantity || 1)).toFixed(2).replace('.', ',')}`);
        linhas.push(`____________`);
    });
    
    linhas.push(``, `Entrega: ${frete === 0 ? 'Grátis' : frete?.toFixed(2).replace('.', ',')}`);
    linhas.push(`Total: ${totalFinal.toFixed(2).replace('.', ',')}`, ``);
    linhas.push(`Pagamento em:     ${pagamento === 'pix' ? 'Pix' : pagamento === 'cartão' ? 'Cartão' : 'Dinheiro'}`);
    
    if (pagamento === 'dinheiro' && trocoPara) {
        linhas.push(`Troco para: R$ ${parseCurrency(trocoPara).toFixed(2).replace('.', ',')}`);
    }

    linhas.push(`Acompanhar Pedido`, `${storeLink}`, ``, `Endereço de Entrega`, ``);
    linhas.push(`Rua: ${enderecoCompleto?.rua}`, `Número: ${enderecoCompleto?.numero}`, `Bairro: ${enderecoCompleto?.bairro}`);
    linhas.push(`____________`, `Tecnologia`, `     www.vianaeccomerce.com.br`);

    const encodedMsg = linhas.map(linha => encodeURIComponent(linha)).join('%0A');
    window.open(`https://wa.me/55${numeroLoja}?text=${encodedMsg}`, '_blank');
};
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {/* BOTÃO DA SACOLA (ALVO DA ANIMAÇÃO) */}
            <Button 
                id="cart-trigger" 
                // Substitua a className do Button no SheetTrigger por esta:
                className="relative h-14 px-8 rounded-full bg-slate-900 dark:bg-slate-800/90 text-white shadow-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 border border-transparent dark:border-white/10 backdrop-blur-md"
            >
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
      
<SheetContent className="w-full sm:max-w-md flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 p-0 border-l-0 shadow-2xl">
    
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* MUDANÇAS NO HEADER:
           1. Removido 'backdrop-blur-xl' (Muito pesado)
           2. Usando bg-opacity sólida (95%)
        */}
        <SheetHeader className="px-5 pt-5 pb-3 bg-white/95 dark:bg-slate-900/95 border-b border-slate-100 dark:border-white/5 shadow-sm z-20 flex-shrink-0 relative">                <SheetTitle className="sr-only">Carrinho</SheetTitle>
                
                {/* Botão de Fechar (Red Glass Theme) */}
                <div className="absolute top-2 right-2 md:hidden z-50">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 rounded-full backdrop-blur-md border border-slate-200/50 dark:border-white/10 transition-all active:scale-95" 
                        onClick={() => setOpen(false)}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Fechar</span>
                    </Button>
                </div>

                <TabsList className="grid w-full grid-cols-2 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl h-12 mt-6 md:mt-0">
                    <TabsTrigger 
                        value="cart" 
                        className="rounded-lg text-xs font-bold transition-all shadow-sm
                                data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-800 
                                data-[state=active]:text-white dark:data-[state=active]:text-slate-100
                                dark:data-[state=active]:border dark:data-[state=active]:border-white/10
                                dark:text-slate-500"
                    >
                        Sacola
                    </TabsTrigger>

                    <TabsTrigger 
                        value="orders" 
                        className="rounded-lg text-xs font-bold transition-all shadow-sm
                                data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-800 
                                data-[state=active]:text-white dark:data-[state=active]:text-slate-100
                                dark:data-[state=active]:border dark:data-[state=active]:border-white/10
                                dark:text-slate-500"
                    >
                        <div className="flex items-center gap-2">
                            Meus Pedidos
                            {activeOrder && <span className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />}
                        </div>
                    </TabsTrigger>
                </TabsList>
            </SheetHeader>

            <TabsContent value="cart" className="flex-1 flex flex-col overflow-hidden m-0 relative h-full data-[state=inactive]:hidden">
                
                {/* 1. TELA DE PIX (Aparece apenas após finalizar um pedido via PIX) */}
                {showPixScreen && pixData ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-6 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800 shadow-inner backdrop-blur-md relative group">
                            <div className="absolute inset-0 bg-emerald-400/10 rounded-[2.5rem] blur-2xl group-hover:bg-emerald-400/20 transition-all" />
                            <img 
                                src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                                className="w-56 h-56 rounded-2xl shadow-2xl relative z-10 border-4 border-white dark:border-slate-800" 
                                alt="QR Code PIX"
                            />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Pague agora</h3>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-4 leading-relaxed">
                                Aponte a câmera do seu banco ou <br /> copie o código abaixo
                            </p>
                        </div>

                        <div className="w-full space-y-3">
                            <Button 
                                onClick={() => {
                                    navigator.clipboard.writeText(pixData.qr_code);
                                    toast({ 
                                        title: "Código Copiado! ✅", 
                                        description: "Agora basta colar no seu banco para pagar." 
                                    });
                                }}
                                className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                            >
                                COPIAR CÓDIGO PIX
                            </Button>
                            
                            <Button 
                                variant="ghost" 
                                onClick={() => {
                                    setShowPixScreen(false);
                                    setActiveTab("orders");
                                }}
                                className="w-full text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-white/5 h-12"
                            >
                                JÁ PAGUEI / VER MEUS PEDIDOS
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 2. CONTEÚDO NORMAL DA SACOLA (ScrollArea com Itens e Formulários) */}
                        <ScrollArea className="flex-1 px-5 w-full">
                            <div className="space-y-5 py-5 pb-40">
                                
                                
                                {!isOpen && !loadingHours && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
                                        <Lock className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-tight">Loja Fechada</p>
                                            <p className="text-xs text-red-600 dark:text-red-500/80 font-medium">Infelizmente não estamos aceitando pedidos agora. Confira nossos horários.</p>
                                        </div>
                                    </div>
                                )}
                                {/* BANNER ATIVO */}
                                {activeOrder && (
                                    <div 
                                        onClick={() => setActiveTab("orders")} 
                                        className="relative overflow-hidden p-4 rounded-xl bg-slate-900 text-white shadow-lg cursor-pointer animate-in slide-in-from-top-2 hover:scale-[1.02] transition-transform"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <BellRing className="h-12 w-12 text-white" />
                                        </div>
                                        <div className="relative flex items-center justify-between">
                                            <div className="space-y-1.5 w-full">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        {normalizeStatus(activeOrder.status) === 'delivering' ? "Sua MOTO está chegando" : "Acompanhe seu pedido"}
                                                    </span>
                                                </div>
                                                <div className="pt-1 flex justify-between items-center w-full">
                                                    <OrderStatusBadge status={activeOrder.status} paymentMethod={activeOrder.payment_method} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* LISTA DE ITENS NA SACOLA */}
                                <div className="space-y-3">
                                    {items.length === 0 && !activeOrder && (
                                        <div className="text-center py-16 opacity-50 flex flex-col items-center">
                                            <ShoppingBag className="h-12 w-12 mb-3 text-slate-300" />
                                            <span className="text-sm font-medium">Sua sacola está vazia</span>
                                        </div>
                                    )}
                                    {items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-3 rounded-xl border border-white/50 dark:border-slate-800/50 shadow-sm transition-all hover:bg-white/90 dark:hover:bg-slate-900">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-lg bg-white/50 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/60 dark:border-slate-700">
                                                    {item.image_url ? <img src={item.image_url} className="h-full w-full object-cover" /> : <ImageOff className="text-slate-300 dark:text-slate-600 h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{item.name}</p>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold bg-white/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                                        {item.quantity}x R$ {Number(item.price).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50/50 transition-colors" onClick={() => removeFromCart(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* DADOS DO CLIENTE */}
                                <div className="space-y-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm transition-all">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="bg-slate-100/80 p-1.5 rounded-full"><User className="h-3.5 w-3.5 text-slate-500" /></div>
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dados do Cliente</Label>
                                    </div>
                                    <div className="grid gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">Nome Completo</Label>
                                            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Eduardo Viana" className="bg-white/50 dark:bg-slate-800 h-11 text-sm border-white/60 dark:border-slate-700 rounded-xl shadow-sm focus:ring-slate-900" />
                                        </div>
                                        <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex justify-between w-full">
                                                    <span>WhatsApp / Celular</span>
                                                    {/* MÁGICA DO CONTADOR DE CARACTERES AQUI */}
                                                    <span className={`text-[12px] transition-colors ${telefone.replace(/\D/g, "").length === 11 ? "text-emerald-600 dark:text-emerald-400 font-black" : "text-slate-400 dark:text-slate-500 font-medium"}`}>
                                                        {telefone.replace(/\D/g, "").length}/11
                                                    </span>
                                                </Label>
                                                <Input 
                                                    value={telefone} 
                                                    onChange={e => setTelefone(formatPhoneNumber(e.target.value))} 
                                                    placeholder="(21) 99999-9999" 
                                                    inputMode="tel"
                                                    maxLength={15}
                                                    className={`bg-white/50 dark:bg-slate-800 h-11 text-sm border-white/60 dark:border-slate-700 rounded-xl shadow-sm transition-colors ${
                                                        telefone.length > 0 && telefone.replace(/\D/g, "").length < 11 
                                                            ? "border-red-300 bg-red-50/30 dark:border-red-500/50 dark:bg-red-900/20" 
                                                            : "focus:ring-slate-900 dark:focus:ring-white"
                                                    }`} 
                                                />
                                            </div>
                                    </div>
                                    <Separator className="my-2 bg-slate-200/50" />
                                    <DeliveryAddressForm onAddressComplete={handleAddressUpdate} storeId={storeId} />
                                </div>

                                {/* COMPONENTE DE PAGAMENTO IMPORTADO */}
                                <CartPayment 
                                    pagamento={pagamento}
                                    setPagamento={setPagamento}
                                    trocoPara={trocoPara}
                                    setTrocoPara={setTrocoPara}
                                    totalFinal={totalFinal}
                                    hasMercadoPago={hasMercadoPago}
                                />

                                {/* RESUMO DOS VALORES (TOTAL DA COMPRA) */}
                                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm space-y-3 mb-4">
                                    <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        <span>Subtotal</span>
                                        <span>R$ {subtotalReal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        <span>Taxa de Entrega</span>
                                        <span className={frete === 0 ? "text-emerald-500 font-bold" : ""}>
                                            {frete === null ? "A calcular" : frete === 0 ? "Grátis" : `R$ ${frete.toFixed(2)}`}
                                        </span>
                                    </div>
                                    <Separator className="bg-slate-200/50 dark:bg-slate-800 my-2" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Total</span>
                                        <span className="text-xl font-black text-slate-900 dark:text-white">
                                            R$ {totalFinal.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        {/* BOTÃO FIXO DE FINALIZAÇÃO */}
                        <div className="absolute bottom-0 w-full p-5 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-white/5 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">

                            <Button 
                                onClick={handleFinalizar} 
                                disabled={loading || !isFormValid || !isOpen} 
                                className={`w-full h-14 text-base font-black rounded-2xl shadow-2xl transition-all active:scale-95 border ${
                                    !isOpen
                                        ? "bg-slate-400 text-white cursor-not-allowed border-transparent grayscale"
                                        : !isFormValid 
                                            ? "bg-slate-200 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-transparent" 
                                            : "bg-slate-900 dark:bg-slate-100 hover:bg-black dark:hover:bg-white text-white dark:text-slate-900 border-transparent"
                                }`}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : !isOpen ? (
                                    "LOJA FECHADA NO MOMENTO"
                                ) : (
                                    "FINALIZAR PEDIDO"
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </TabsContent>

            {/* ABA 2: MEUS PEDIDOS */}
            <TabsContent value="orders" className="flex-1 flex flex-col overflow-hidden m-0 bg-slate-50/50 dark:bg-slate-950/50 h-full data-[state=inactive]:hidden">
                            <ScrollArea className="flex-1 h-full w-full">
                                <div className="p-5 pb-10 space-y-4 flex flex-col justify-start min-h-full">
                                    {/* 1. SE ESTIVER CARREGANDO, MOSTRA SKELETONS */}
                                    {isInitialLoading ? (
                                    <>
                                        <OrderSkeleton />
                                        <OrderSkeleton />
                                        <OrderSkeleton />
                                    </>
                                    ) : orderHistory.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-60">
                                            <Activity className="h-10 w-10 text-slate-300" />
                                            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Histórico vazio</p>
                                        </div>
                                    ) : (
                                        orderHistory.map((order) => {
                                            // TRATAMENTO SEGURO DO JSON DOS ITENS
                                            const rawItems = order.items || [];
                                            const itemsArray = Array.isArray(rawItems) 
                                                ? rawItems 
                                                : (typeof rawItems === 'string' ? JSON.parse(rawItems) : []);

                                            const isActive = activeOrder?.id === order.id;

                                            // --- LÓGICA DO CRONÔMETRO DE PAGAMENTO ---
                                            const isOnlinePending = order.status === 'pending' && ['pix', 'cartão', 'card'].includes(order.payment_method?.toLowerCase());
                                            const diffMins = isOnlinePending ? (now - new Date(order.created_at).getTime()) / 60000 : 0;
                                            const minutesLeft = Math.max(0, 5 - diffMins);

                                            return (
                                                <div 
                                                    key={order.id} 
                                                    className={`p-5 rounded-2xl border transition-all duration-300 mb-4 ${
                                                        isActive 
                                                            ? 'bg-white dark:bg-slate-800 border-slate-900 dark:border-white/20 shadow-xl scale-[1.01]' 
                                                            : 'bg-white/50 dark:bg-slate-900/40 border-slate-100 dark:border-white/5 shadow-sm'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="space-y-0.5">
                                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                                PEDIDO #{order.id.slice(0, 4)}
                                                            </span>
                                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                                {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </p>
                                                        </div>
                                                        <OrderStatusBadge status={order.status} paymentMethod={order.payment_method} />
                                                    </div>

                                                    {/* LISTA DE ITENS */}
                                                    <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-3 mb-4 space-y-2 border border-slate-100/50 dark:border-white/5">
                                                        {itemsArray.slice(0, 3).map((item: any, idx: number) => (
                                                            <div key={`${order.id}-item-${idx}`} className="flex justify-between text-xs">
                                                                <span className="flex gap-2">
                                                                    <span className="font-black text-slate-900 dark:text-slate-100">{item.quantity}x</span> 
                                                                    <span className="text-slate-600 dark:text-slate-300 line-clamp-1">
                                                                        {item.product_name || item.name}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        ))}
                                                        
                                                        {itemsArray.length > 3 && (
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium pl-6">
                                                                + {itemsArray.length - 3} outros itens
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-white/5">
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total</span>
                                                        <span className="text-base font-black text-slate-900 dark:text-white">
                                                        R$ {Number(order.total).toFixed(2)}
                                                        </span>
                                                    </div>

                                                    {/* AVISO E BOTÃO DE RETOMAR PAGAMENTO */}
                                                    {isOnlinePending && minutesLeft > 0 && (
                                                        <div className="mt-4 p-3 bg-orange-50/80 dark:bg-orange-900/20 rounded-xl border border-orange-200/60 dark:border-orange-500/20 flex flex-col gap-3 animate-in fade-in">
                                                            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-xs font-bold px-1">
                                                                <Timer className="h-4 w-4 animate-pulse" />
                                                                <span>Aguardando pagamento. Expira em {Math.floor(minutesLeft)}:{Math.floor((minutesLeft % 1) * 60).toString().padStart(2, '0')}.</span>
                                                            </div>
                                                            <Button
                                                                onClick={() => handleRepay(order)}
                                                                disabled={isRepaying === order.id}
                                                                className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 text-xs font-black uppercase tracking-wider rounded-lg transition-all"
                                                            >
                                                                {isRepaying === order.id ? <Loader2 className="animate-spin h-4 w-4" /> : "RETOMAR PAGAMENTO"}
                                                            </Button>
                                                        </div>
                                                    )}

                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </ScrollArea>
            </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}