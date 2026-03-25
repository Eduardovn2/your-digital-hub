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
import { useToast } from "@/components/ui/use-toast";
import { useStoreHours, isStoreCurrentlyOpen } from "@/hooks/useStoreHours";
import { DeliveryAddressForm, AddressData } from "@/components/DeliveryAddressForm";
import { Loader2, ShoppingBag, Store, Truck } from "lucide-react";

export default function CartDrawer() {
  const { items, total, storeId, clearCart, pickupMode, setPickupMode, deliveryFee, setDeliveryFee } = useCart();
  const { data: stores } = useStores();
  const store = stores?.find((s: any) => s.id === storeId);
  const deviceId = useDevice();
  const { toast } = useToast();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [pagamento, setPagamento] = useState<"pix" | "dinheiro" | "cartão">("pix");
  const [trocoPara, setTrocoPara] = useState("");
  const [enderecoCompleto, setEnderecoCompleto] = useState<AddressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { data: hoursData } = useStoreHours(storeId);
  const isOpen = isStoreCurrentlyOpen(hoursData);

  const subtotalReal = items.reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0);
  const totalFinal = subtotalReal + deliveryFee;
  
  const isPhoneValid = telefone.replace(/\D/g, "").length === 11;

  const isAddressValid = pickupMode || !!enderecoCompleto;

  const isFormValid = items.length > 0 && nome.trim().length > 0 && isPhoneValid && isAddressValid && isOpen;

  const parseCurrency = (value: string) => parseFloat(value.replace(",", ".")) || 0;

  const handleAddressUpdate = (address: AddressData, valorFrete: number | null) => {
    setEnderecoCompleto(address);
  };

  const handleFinalizar = async () => {
    if (!isFormValid || !storeId) return;
    setLoading(true);

    try {
      const addressString = pickupMode 
        ? "Retirada na loja" 
        : `${enderecoCompleto!.rua}, ${enderecoCompleto!.numero}`;

      const itemsData = items.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        product_price: Number(item.price),
        quantity: item.quantity || 1,
        subtotal: Number(item.price) * (item.quantity || 1),
        notes: item.observation || null,
      }));

      const orderPayload = {
        store_id: storeId,
        customer_name: nome,
        customer_phone: telefone.replace(/\D/g, ""),
        customer_address: addressString,
        pickup_order: pickupMode,
        delivery_fee: pickupMode ? 0 : deliveryFee,
        subtotal: subtotalReal,
        total: totalFinal,
        payment_method: pagamento,
        change_for: pagamento === "dinheiro" ? parseCurrency(trocoPara) : null,
        status: "accepted",
        device_id: deviceId,
        items: itemsData
      };

      const { data, error } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select()
        .single();

      if (error) throw error;

      toast({ title: "✅ Pedido Enviado!", description: "Acompanhe no dashboard da loja" });
      clearCart();
      setOpen(false);
      setNome("");
      setTelefone("");

    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button className="fixed bottom-8 right-8 z-50 h-16 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 shadow-2xl border-4 border-white/50 backdrop-blur-lg">
            <ShoppingBag className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        
        <SheetContent className="p-0 max-h-[95vh] flex flex-col">
          <div className="p-6 flex-1 overflow-auto">
            {/* Toggle Pickup/Entrega */}
            <Button 
              variant={pickupMode ? "default" : "outline"} 
              className="w-full mb-6 h-12 rounded-xl font-semibold shadow-md"
              onClick={() => setPickupMode(!pickupMode)}
            >
              {pickupMode ? (
                <Store className="h-5 w-5 mr-2" />
              ) : (
                <Truck className="h-5 w-5 mr-2" />
              )}
              {pickupMode ? "Retirada na Loja ✓" : "Entrega"}
            </Button>

            {/* Form Endereço */}
            {!pickupMode && (
              <DeliveryAddressForm onAddressComplete={handleAddressUpdate} storeId={storeId!} />
            )}

            {pickupMode && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 mb-6">
                <Store className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-emerald-800 mb-2 text-center">Retirada Grátis!</h3>
                <p className="text-emerald-700 text-center font-semibold">Frete R$0,00 • Retire quando estiver pronto</p>
              </div>
            )}

            {/* Dados Cliente */}
            <div className="space-y-3 mb-6">
              <div>
                <Label className="text-sm font-bold">Nome Completo *</Label>
                <Input 
                  value={nome}
                  onChange={(e) => setNome(e.target.value)} 
                  placeholder="Digite seu nome"
                  className="mt-1 h-12"
                />
              </div>
              <div>
                <Label className="text-sm font-bold">WhatsApp *</Label>
                <Input 
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ""))} 
                  placeholder="(21) 99999-9999"
                  className="mt-1 h-12"
                />
              </div>
            </div>

            {/* Pagamento */}
            <CartPayment 
              pagamento={pagamento}
              setPagamento={setPagamento}
              pagamentoTipo={pagamentoTipo}
              setPagamentoTipo={setPagamentoTipo}
              trocoPara={trocoPara}
              setTrocoPara={setTrocoPara}
              totalFinal={totalFinal}
              hasMercadoPago={hasMercadoPago}
            />
          </div>

          {/* Finalizar */}
          <div className="p-6 bg-gradient-to-r from-white to-slate-50 border-t">
            <div className="text-right mb-4">
              <div className="text-2xl font-black text-slate-900">
                R$ {totalFinal.toFixed(2)}
              </div>
            </div>
            <Button 
              onClick={handleFinalizar} 
              disabled={loading || !isFormValid || !isOpen}
              className="w-full h-16 rounded-2xl font-black text-xl shadow-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transform hover:scale-[1.02] active:scale-100 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-3 h-6 w-6" />
                  Enviando...
                </>
              ) : (
                `Finalizar Pedido R$ ${totalFinal.toFixed(2)}`
              )}
            </Button>
            
            {!isOpen && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <AlertTriangle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                <p className="text-sm text-amber-800 font-medium">Loja fechada no momento</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

