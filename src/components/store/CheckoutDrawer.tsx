import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { useCreateOrder } from "@/hooks/useOrders";
import { Store } from "@/types/store";
import { Minus, Plus, Trash2, Loader2, CheckCircle } from "lucide-react";

interface CheckoutDrawerProps {
  open: boolean;
  onClose: () => void;
  store: Store;
}

export function CheckoutDrawer({ open, onClose, store }: CheckoutDrawerProps) {
  const { items, updateQuantity, removeItem, totalPrice: total, clearCart } = useCart();
  const createOrder = useCreateOrder();
  
  const [step, setStep] = useState<'cart' | 'details' | 'success'>('cart');
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");

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
        subtotal: total,
        delivery_fee: 0,
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
    }
    onClose();
  };

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
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Seu carrinho está vazio
                </div>
              ) : (
                <>
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
                      <span>Total</span>
                      <span style={{ color: store.primary_color }}>
                        R$ {total.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full py-6 text-lg"
                    style={{ backgroundColor: store.primary_color }}
                    onClick={() => setStep('details')}
                  >
                    Continuar
                  </Button>
                </>
              )}
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="space-y-2">
                <Label htmlFor="address">Endereço de Entrega</Label>
                <Input
                  id="address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Rua, número, bairro..."
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

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-lg font-bold mb-4">
                  <span>Total</span>
                  <span style={{ color: store.primary_color }}>
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep('cart')}
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    style={{ backgroundColor: store.primary_color }}
                    disabled={createOrder.isPending}
                  >
                    {createOrder.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Enviar Pedido'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {step === 'success' && (
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
              <Button onClick={handleClose} style={{ backgroundColor: store.primary_color }}>
                Continuar Comprando
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
