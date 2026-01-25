import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useCreateOrder } from "@/hooks/useOrders";
import { usePublicDeliveryZones } from "@/hooks/useDeliveryZones";
import { Store, DeliveryZone } from "@/types/store";
import { Minus, Plus, Trash2, Loader2, CheckCircle, MapPin } from "lucide-react";

interface CheckoutDrawerProps {
  open: boolean;
  onClose: () => void;
  store: Store;
}

export function CheckoutDrawer({ open, onClose, store }: CheckoutDrawerProps) {
  const { items, updateQuantity, removeItem, totalPrice: subtotal, clearCart } = useCart();
  const createOrder = useCreateOrder();
  const { data: deliveryZones } = usePublicDeliveryZones(store.id);
  
  const [step, setStep] = useState<'cart' | 'details' | 'success'>('cart');
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");

  const selectedZone = deliveryZones?.find(z => z.id === selectedZoneId);
  const deliveryFee = selectedZone?.fee || 0;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createOrder.mutateAsync({
      order: {
        store_id: store.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress || null,
        status: 'pending',
        notes: notes || null,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        total: total,
      },
      items: items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        notes: null,
      }))
    });

    setStep('success');
    clearCart();
  };

  const handleClose = () => {
    if (step === 'success') {
      setStep('cart');
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setNotes("");
      setSelectedZoneId("");
    }
    onClose();
  };

  const hasDeliveryZones = deliveryZones && deliveryZones.length > 0;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>
            {step === 'cart' && 'Seu Carrinho'}
            {step === 'details' && 'Finalizar Pedido'}
            {step === 'success' && 'Pedido Enviado!'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step === 'cart' && (
            <CartStep
              items={items}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
              subtotal={subtotal}
              store={store}
              onContinue={() => setStep('details')}
            />
          )}

          {step === 'details' && (
            <DetailsStep
              customerName={customerName}
              setCustomerName={setCustomerName}
              customerPhone={customerPhone}
              setCustomerPhone={setCustomerPhone}
              customerAddress={customerAddress}
              setCustomerAddress={setCustomerAddress}
              notes={notes}
              setNotes={setNotes}
              selectedZoneId={selectedZoneId}
              setSelectedZoneId={setSelectedZoneId}
              deliveryZones={deliveryZones}
              hasDeliveryZones={hasDeliveryZones}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              total={total}
              store={store}
              isPending={createOrder.isPending}
              onBack={() => setStep('cart')}
              onSubmit={handleSubmit}
            />
          )}

          {step === 'success' && (
            <SuccessStep store={store} onClose={handleClose} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Cart Step Component
interface CartStepProps {
  items: Array<{ id: string; name: string; price: number; quantity: number; image?: string }>;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  subtotal: number;
  store: Store;
  onContinue: () => void;
}

function CartStep({ items, updateQuantity, removeItem, subtotal, store, onContinue }: CartStepProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Seu carrinho está vazio
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
          <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {item.image ? (
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-2xl">🍽️</div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{item.name}</h4>
            <p className="text-sm font-semibold" style={{ color: store.primary_color }}>
              R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center font-medium">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => removeItem(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <div className="border-t pt-4">
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Subtotal</span>
          <span style={{ color: store.primary_color }}>
            R$ {subtotal.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      <Button
        className="w-full py-6 text-lg"
        style={{ backgroundColor: store.primary_color }}
        onClick={onContinue}
      >
        Continuar
      </Button>
    </div>
  );
}

// Details Step Component
interface DetailsStepProps {
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  customerAddress: string;
  setCustomerAddress: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  selectedZoneId: string;
  setSelectedZoneId: (v: string) => void;
  deliveryZones: DeliveryZone[] | undefined;
  hasDeliveryZones: boolean;
  subtotal: number;
  deliveryFee: number;
  total: number;
  store: Store;
  isPending: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

function DetailsStep({
  customerName, setCustomerName,
  customerPhone, setCustomerPhone,
  customerAddress, setCustomerAddress,
  notes, setNotes,
  selectedZoneId, setSelectedZoneId,
  deliveryZones, hasDeliveryZones,
  subtotal, deliveryFee, total,
  store, isPending, onBack, onSubmit
}: DetailsStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Seu nome"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone/WhatsApp *</Label>
        <Input
          id="phone"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="(11) 99999-9999"
          required
        />
      </div>

      {/* Delivery Zone Selection */}
      {hasDeliveryZones && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Região de Entrega *
          </Label>
          <Select value={selectedZoneId} onValueChange={setSelectedZoneId} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione seu bairro" />
            </SelectTrigger>
            <SelectContent>
              {deliveryZones?.map(zone => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name} - R$ {zone.fee.toFixed(2).replace('.', ',')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="address">Endereço Completo {hasDeliveryZones ? '*' : ''}</Label>
        <Input
          id="address"
          value={customerAddress}
          onChange={(e) => setCustomerAddress(e.target.value)}
          placeholder="Rua, número, complemento..."
          required={hasDeliveryZones}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: sem cebola, troco para R$100..."
          rows={3}
        />
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Subtotal</span>
          <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
        
        {hasDeliveryZones && (
          <div className="flex items-center justify-between text-sm">
            <span>Taxa de Entrega</span>
            <span style={{ color: deliveryFee > 0 ? store.primary_color : undefined }}>
              {deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : 'Selecione a região'}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between text-lg font-bold pt-2 border-t">
          <span>Total</span>
          <span style={{ color: store.primary_color }}>
            R$ {total.toFixed(2).replace('.', ',')}
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onBack}
          >
            Voltar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            style={{ backgroundColor: store.primary_color }}
            disabled={isPending || (hasDeliveryZones && !selectedZoneId)}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Enviar Pedido'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

// Success Step Component
function SuccessStep({ store, onClose }: { store: Store; onClose: () => void }) {
  return (
    <div className="text-center py-8">
      <div 
        className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
        style={{ backgroundColor: store.primary_color + '20' }}
      >
        <CheckCircle className="h-10 w-10" style={{ color: store.primary_color }} />
      </div>
      <h3 className="text-xl font-bold mb-2">Pedido Enviado!</h3>
      <p className="text-muted-foreground mb-6">
        Seu pedido foi recebido e está sendo preparado.
        {store.whatsapp && " Em breve entraremos em contato via WhatsApp."}
      </p>
      <Button onClick={onClose} style={{ backgroundColor: store.primary_color }}>
        Continuar Comprando
      </Button>
    </div>
  );
}
