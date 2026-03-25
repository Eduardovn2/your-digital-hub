import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CartPayment } from "./CartPayment";
import { useCart } from "@/contexts/CartContext";
import { useDevice } from "@/hooks/useDevice";
import { useStores } from "@/hooks/useStores";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useStoreHours, isStoreCurrentlyOpen } from "@/hooks/useStoreHours";
import { DeliveryAddressForm, AddressData } from "@/components/DeliveryAddressForm";
import { Loader2, ShoppingBag, CreditCard, Banknote, Trash2, Coins, ImageOff, AlertTriangle, Clock, CheckCircle2, XCircle, Bike, Package, ClipboardList, ArrowRight, Activity, BellRing, PackageCheck, UtensilsCrossed, HelpCircle, User, X, Timer, Lock, Store } from "lucide-react";

export default function CartDrawer() {
  const { items, total, storeId, clearCart, removeFromCart, customerId, pickupMode, setPickupMode, deliveryFee, setDeliveryFee, deliveryAddress, setDeliveryAddress } = useCart();
  const { data: storeData } = useStores();
  const store = storeData?.[0];
  const deviceId = useDevice();
  const { toast } = useToast();

  const [pixData, setPixData] = useState<{qr_code: string, qr_code_base64: string} | null>(null);
  const [showPixScreen, setShowPixScreen] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [pagamento, setPagamento] = useState<"pix" | "cartão" | "dinheiro" | "pix_online" | "cartao_online" | "pix_entrega" | "cartao_entrega">("pix");
  const [pagamentoTipo, setPagamentoTipo] = useState<"online" | "entrega">("entrega");
  const [trocoPara, setTrocoPara] = useState("");
  const [enderecoCompleto, setEnderecoCompleto] = useState<AddressData | null>(null);
  const [isRepaying, setIsRepaying] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const [hasMercadoPago, setHasMercadoPago] = useState(false);
  const [acceptsOnlinePayment, setAcceptsOnlinePayment] = useState(true);
  const [acceptsCashOnDelivery, setAcceptsCashOnDelivery] = useState(true);

  const { data: hoursData, isLoading: loadingHours } = useStoreHours(storeId);
  const isOpen = isStoreCurrentlyOpen(hoursData);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [open, setOpen] = useState(false);
const [activeTab, setActiveTab] = useState("cart"); // SEMPRE cart - toggle visível
  const [loading, setLoading] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
const [frete, setFrete] = useState<number | null>(null);

  useEffect(() => {
    setPickupMode(true); // FORÇA Retirada na Loja para todos
  }, []);
const [showPickupToggle, setShowPickupToggle] = useState(true); // FORÇA VISÍVEL

const parseCurrency = (value: string) => parseFloat(value.replace(",", ".")) || 0;

const [isPickupMode, setIsPickupMode] = useState(true); // TEMP DEBUG

  const hasPaymentConfig = acceptsOnlinePayment || acceptsCashOnDelivery;
  const isStoreAvailable = isOpen && hasPaymentConfig;

  useEffect(() => {
    if (!storeId) return;
    const checkPaymentMethods = async () => {
      const { data } = await supabase
        .from("stores")
        .select("mp_public_key, mp_access_token, accepts_online_payment, accepts_cash_on_delivery")
        .eq("id", storeId)
        .maybeSingle();
      setHasMercadoPago(!!(data as any)?.mp_public_key && !!(data as any)?.mp_access_token);
      setAcceptsOnlinePayment((data as any)?.accepts_online_payment ?? true);
      setAcceptsCashOnDelivery((data as any)?.accepts_cash_on_delivery ?? true);
    };
    checkPaymentMethods();
  }, [storeId]);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [open]);

  const subtotalReal = items.reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0);
  const totalFinal = subtotalReal + deliveryFee;
  
  const isPhoneValid = telefone.replace(/\D/g, "").length === 11; 

  const isAddressValid = pickupMode 
    ? true 
    : enderecoCompleto?.numero 
      ? (enderecoCompleto.numero === "S/N" 
          ? !!enderecoCompleto.complemento && !!enderecoCompleto.referencia
          : true) 
      : false;

  const isFormValid = 
    items.length > 0 && 
    nome.trim().length > 0 && 
    isPhoneValid && 
    (!pickupMode ? frete !== null && isAddressValid : true) &&
    isStoreAvailable;

  const handleAddressUpdate = (address: AddressData, valorFrete: number | null) => {
    setEnderecoCompleto(address);
    setFrete(valorFrete);
  };

  const handleFinalizar = async () => {
    if (!isStoreAvailable) {
      toast({
        title: "Loja Fechada 🚫",
        description: !hasPaymentConfig 
          ? "Configure pelo menos uma forma de pagamento para receber pedidos." 
          : "Desculpe, não estamos aceitando pedidos no momento.",
        variant: "destructive"
      });
      return;
    }

    if (!isFormValid) return;
    setLoading(true);

    try {
      const addressString = pickupMode 
        ? `Retirada na loja - ${store?.name || 'Loja'}` 
        : `${enderecoCompleto!.rua}, ${enderecoCompleto!.numero} - ${enderecoCompleto!.bairro}`;

      const itemsData = items.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        product_price: Number(item.price),
        quantity: item.quantity,
        subtotal: Number(item.price) * (item.quantity || 1),
        notes: item.observation || null,
      }));

      const normalizePaymentMethod = (method: string) => {
        if (method === 'pix_online' || method === 'pix_entrega') return 'pix';
        if (method === 'cartao_online' || method === 'cartao_entrega') return 'cartão';
        return method;
      };

      const isOnlinePayment = pagamento === 'pix_online' || pagamento === 'cartao_online';
      const isPagamentoNaEntrega = pagamento === 'dinheiro' || pagamento === 'pix_entrega' || pagamento === 'cartao_entrega';
      const initialStatus: "pending" | "accepted" = isOnlinePayment ? "pending" : "accepted";

      const orderPayload = {
        store_id: storeId,
        customer_name: nome,
        customer_phone: telefone.replace(/\D/g, ""),
        customer_address: addressString,
        pickup_order: pickupMode,  // ← ADICIONE ESSA LINHA
        delivery_fee: pickupMode ? 0 : (frete || 0),
        subtotal: subtotalReal,
        total: totalFinal,
        payment_method: normalizePaymentMethod(pagamento),
        change_for: pagamento === "dinheiro" ? parseCurrency(trocoPara) : null,
        status: initialStatus,
        device_id: deviceId,
        items: itemsData 
      };

      const { data: insertedOrder, error: orderError } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select("id")
        .single();

      if (orderError) throw orderError;

      const { data: storeDataResult } = await supabase
        .from("stores")
        .select("phone, name, slug, mp_access_token")
        .eq("id", storeId)
        .single();

      // resto do fluxo igual...
      clearCart();
      setActiveTab("orders");
      setOpen(false);
      toast.success("Pedido criado! Acompanhe em 'Meus Pedidos'");

    } catch (error: any) {
      toast.error(error.message || "Erro ao criar pedido");
    } finally {
      setLoading(false);
    }
  };


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        <ScrollArea>
          {/* PICKUP TOGGLE SEMPRE VISÍVEL */}
          <div className="p-4 space-y-3">
            <div style={{border: '5px solid lime !important', zIndex: 9999}} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <Button 
                variant={pickupMode ? "default" : "outline"} 
                className="flex-1 h-14 text-base font-bold w-full rounded-xl shadow-lg"
                onClick={() => { 
                  console.log('🚀 PICKUP CLICK!', pickupMode); 
                  setPickupMode(!pickupMode) 
                }}
              >
                <Store className="h-5 w-5 mr-3" />
                {pickupMode ? "✅ Retirar na Loja" : "🚚 Entrega"}
              </Button>
              <p className="text-xs text-slate-500 mt-2 text-center">Toggle ativo! F12 acha agora</p>
            </div>

        {!pickupMode && (
          <DeliveryAddressForm onAddressComplete={handleAddressUpdate} storeId={storeId} />
        )}
        {pickupMode && (
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <p className="text-sm text-emerald-800 font-bold">
              <Store className="inline h-4 w-4 mr-2" />
              Retirada grátis na loja {store?.name}
            </p>
          </div>
        )}
        <CartPayment 
          pagamento={pagamento}
          setPagamento={setPagamento}
          pagamentoTipo={pagamentoTipo}
          setPagamentoTipo={setPagamentoTipo}
          trocoPara={trocoPara}
          setTrocoPara={setTrocoPara}
          totalFinal={totalFinal}
          hasMercadoPago={hasMercadoPago}
          acceptsOnlinePayment={acceptsOnlinePayment}
          acceptsCashOnDelivery={acceptsCashOnDelivery}
        />
      </div>
    </Sheet>
  );
}