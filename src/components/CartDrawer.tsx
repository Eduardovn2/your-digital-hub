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
import { 
  Loader2, ShoppingBag, CreditCard, Banknote, Trash2, Coins, 
  ImageOff, AlertTriangle, Clock, CheckCircle2, XCircle, 
  Bike, Package, ClipboardList, ArrowRight, Activity, BellRing, 
  PackageCheck, UtensilsCrossed, HelpCircle, User, X
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
  
  if (['saiu', 'entrega', 'caminho', 'moto', 'delivery', 'delivering', 'ready'].some(k => s.includes(k))) return "delivering";
  if (['cancel', 'recusado'].some(k => s.includes(k))) return "cancelled";
  if (['complet', 'conclui', 'finaliza', 'entregue', 'delivered', 'done'].some(k => s.includes(k))) return "completed";
  if (['saiu', 'entrega', 'caminho', 'moto', 'delivery', 'delivering'].some(k => s.includes(k))) return "delivering";
  if (['pronto', 'retirada', 'ready', 'balcao'].some(k => s.includes(k))) return "ready";
  if (['prepar', 'cozinha', 'forno', 'making', 'preparing'].some(k => s.includes(k))) return "preparing";
  if (['aceito', 'fila', 'confirmado', 'confirmed', 'accepted'].some(k => s.includes(k))) return "accepted";
  
  return "pending"; 
};

// --- BADGE ---
const OrderStatusBadge = ({ status }: { status: string }) => {
  const statusKey = normalizeStatus(status);

const styles = {
    pending: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", icon: Clock, label: "Pendente" },
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
  const { toast } = useToast();
  const deviceId = useDevice();
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
    isAddressValid;

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
      const addressString = `${enderecoCompleto!.rua}, ${enderecoCompleto!.numero} - ${enderecoCompleto!.bairro}`;
      
      // 1. Preparamos os itens
      const itemsData = items.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        product_price: Number(item.price),
        quantity: item.quantity,
        subtotal: Number(item.price) * (item.quantity || 1)
      }));

      // 2. Payload do Pedido
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

      // 3. Salva no banco e RETORNA O ID do pedido
      const { data: insertedOrder, error: orderError } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select("id")
        .single();

      if (orderError) throw orderError;

      // 4. Busca o telefone da Loja para o WhatsApp
      const { data: storeData } = await supabase
        .from("stores")
        .select("phone")
        .eq("id", storeId)
        .single();

      // 5. Monta a mensagem e abre o WhatsApp
        if (storeData?.phone) {
                const numeroLoja = storeData.phone.replace(/\D/g, ""); 
                
                // Criamos as linhas como uma lista (Array) para garantir as quebras de linha
                const linhas = [
                `*NOVO PEDIDO #${insertedOrder.id.slice(0, 4).toUpperCase()}* 🍔`,
                ``,
                `*Cliente:* ${nome}`,
                `*Contato:* ${telefone}`,
                `*Endereço:* ${addressString}`,
                ``,
                `*🛒 ITENS DO PEDIDO:*`
                ];
                
                items.forEach(item => {
                    linhas.push(`- ${item.quantity}x ${item.name} (R$ ${(Number(item.price) * (item.quantity || 1)).toFixed(2)})`);
                });
                
                linhas.push(``);
                linhas.push(`*💰 RESUMO:*`);
                linhas.push(`Subtotal: R$ ${subtotalReal.toFixed(2)}`);
                linhas.push(`Taxa de Entrega: ${frete === 0 ? 'Grátis' : `R$ ${frete?.toFixed(2)}`}`);
                linhas.push(`*Total Final: R$ ${totalFinal.toFixed(2)}*`);
                linhas.push(``);
                linhas.push(`*💳 PAGAMENTO:*`);
                linhas.push(`👉 ${pagamento.toUpperCase()}`);
                
                if (pagamento === 'dinheiro' && trocoPara) {
                    const valorTroco = parseCurrency(trocoPara) - totalFinal;
                    linhas.push(`Troco para: R$ ${parseCurrency(trocoPara).toFixed(2)}`);
                    linhas.push(`*(Levar R$ ${valorTroco.toFixed(2)} de troco)*`);
                }

                // Junta todas as linhas com a quebra oficial (\n) e converte para formato de Link
                const msg = linhas.join('\n');
                const encodedMsg = encodeURIComponent(msg);
                
                // Usamos a API oficial do WhatsApp que lida melhor com formatação
                const waUrl = `https://api.whatsapp.com/send?phone=55${numeroLoja}&text=${encodedMsg}`;
                
                window.open(waUrl, '_blank');
            }

      toast({ 
        title: "Pedido Confirmado!", 
        description: "Seu pedido foi enviado com sucesso." 
      });
      
      clearCart();
      setActiveTab("orders");

    } catch (error: any) {
      console.error("Erro no Supabase:", error);
      toast({ 
        title: "Erro no envio", 
        description: error.message || "Verifique o console para detalhes.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
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
                <ScrollArea className="flex-1 px-5 w-full">
                <div className="space-y-5 py-5 pb-40">
                    
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
                                        <OrderStatusBadge status={activeOrder.status} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ITENS */}
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
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold bg-white/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded w-fit mt-0.5">{item.quantity}x R$ {Number(item.price).toFixed(2)}
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

                    {/* DADOS CLIENTE */}
{/* 2. DADOS CLIENTE (Com Validação Visual) */}
                    <div className="space-y-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="bg-slate-100/80 p-1.5 rounded-full"><User className="h-3.5 w-3.5 text-slate-500" /></div>
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dados do Cliente</Label>
                        </div>
                        <div className="grid gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    Nome Completo
                                </Label>
                                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Eduardo Viana" className="bg-white/50 dark:bg-slate-800 h-11 text-sm border-white/60 dark:border-slate-700 dark:text-white placeholder:dark:text-slate-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-1 focus:ring-primary transition-all shadow-sm"></Input>
                            </div>
                            
                            {/* CAMPO DE TELEFONE COM AVISO DE CARACTERES */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 flex justify-between">
                                    WhatsApp / Celular
                                    {/* Contador visual no cantinho (Ex: 9/11) */}
                                    <span className={`text-[12px] ${telefone.replace(/\D/g, "").length === 11 ? "text-emerald-600 font-black" : "text-slate-400 font-medium"}`}>
                                        {telefone.replace(/\D/g, "").length}/11
                                    </span>
                                </Label>
                                <Input 
                                    value={telefone} 
                                    onChange={e => setTelefone(formatPhoneNumber(e.target.value))} 
                                    placeholder="(21) 99999-9999" 
                                    inputMode="tel"
                                    maxLength={15}
                                    // Borda vermelha se começou a digitar e não terminou
                                    className={`bg-white/50 dark:bg-slate-800/50 h-11 text-sm border-white/60 dark:border-slate-700/60 dark:text-white transition-colors shadow-sm ${
                                        telefone.length > 0 && telefone.replace(/\D/g, "").length < 11 
                                        ? "border-red-300 focus:border-red-400 bg-red-50/30" 
                                        : "focus:border-slate-200"
                                    }`} 
                                />
                                
                                {/* MENSAGEM DE ERRO DINÂMICA */}
                                {telefone.length > 0 && telefone.replace(/\D/g, "").length < 11 && (
                                    <p className="text-[10px] text-red-500 font-bold animate-in slide-in-from-top-1 ml-1 flex items-center gap-1">
                                        <XCircle className="h-3 w-3" />
                                        Faltam {11 - telefone.replace(/\D/g, "").length} números (DDD + 9 dígitos)
                                    </p>
                                )}
                            </div>
                        </div>
                        <Separator className="my-2 bg-slate-200/50" />
                        <DeliveryAddressForm onAddressComplete={handleAddressUpdate} storeId={storeId} />
                    </div>

                    {/* PAGAMENTO (CLEAN & MODERN) */}
{/* COMPONENTE DE PAGAMENTO IMPORTADO */}
                    <CartPayment 
                        pagamento={pagamento}
                        setPagamento={setPagamento}
                        trocoPara={trocoPara}
                        setTrocoPara={setTrocoPara}
                        totalFinal={totalFinal}
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
                            <div className="absolute bottom-0 w-full p-5 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-white/5 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
                                <Button 
                                    onClick={handleFinalizar} 
                                    disabled={loading || !isFormValid} 
                                    className={`w-full h-14 text-base font-black rounded-2xl shadow-2xl transition-all active:scale-95 border ${
                                        !isFormValid 
                                            ? "bg-slate-200 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-transparent" 
                                            : "bg-slate-900 dark:bg-slate-100 hover:bg-black dark:hover:bg-white text-white dark:text-slate-900 border-transparent shadow-white/5"
                                    }`}
                                >
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "FINALIZAR PEDIDO"}
                                </Button>
                            </div>
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
                                            <OrderStatusBadge status={order.status} />
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
                                                R$ {Number(order.total_amount || order.total).toFixed(2)}
                                            </span>
                                        </div>
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