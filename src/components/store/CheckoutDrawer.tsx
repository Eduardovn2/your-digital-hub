import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight, CreditCard, ImageOff } from "lucide-react";
import { useState } from "react";

export function CheckoutDrawer() {
  const { items, updateQuantity, removeFromCart, subtotal, checkout } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const deliveryFee = 5.00;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    setIsCheckoutLoading(true);
    try {
      await checkout({
        name: "Cliente Teste",
        phone: "999999999",
        address: "Rua Exemplo, 123"
      }, "store-id-placeholder", deliveryFee);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="relative cursor-pointer group">
          <Button size="icon" className="rounded-full h-12 w-12 bg-primary text-primary-foreground shadow-neon hover:shadow-lg hover:scale-105 transition-all">
            <ShoppingBag className="h-5 w-5" />
          </Button>
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white animate-bounce-soft">
              {items.length}
            </span>
          )}
        </div>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md border-l border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl p-0 flex flex-col z-[100]">
        
        <SheetHeader className="px-6 py-6 border-b border-slate-100/50 bg-white/40">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Seu Pedido
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
            <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <ShoppingBag className="h-10 w-10 text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-600">Sua sacola está vazia</p>
            <Button variant="outline" className="mt-6" onClick={() => setIsOpen(false)}>
              Ver Cardápio
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 py-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 group animate-fade-in">
                    
                    {/* CORREÇÃO PONTO 3: Exibição da Imagem */}
                    <div className="h-16 w-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                       {item.image ? (
                         <img 
                           src={item.image} 
                           alt={item.name} 
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-300">
                           <ImageOff className="h-6 w-6" />
                         </div>
                       )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-slate-800 line-clamp-2 text-sm">
                          {item.name}
                        </h4>
                        <span className="font-bold text-slate-900 text-sm ml-2">
                          {(item.price * item.quantity).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 bg-slate-50 rounded-full px-2 py-1 border border-slate-100">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white text-slate-500 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white text-primary transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity px-2"
                        >
                          <Trash2 className="h-3 w-3" /> Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-6 bg-white/60 border-t border-white/20 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Entrega</span>
                  <span>{deliveryFee.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
                <Separator className="bg-slate-200/50" />
                <div className="flex justify-between text-lg font-bold text-slate-800">
                  <span>Total</span>
                  <span>{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
              </div>

              <Button 
                className="w-full h-12 text-base font-bold shadow-neon bg-primary hover:bg-primary/90" 
                onClick={handleCheckout}
                disabled={isCheckoutLoading}
              >
                {isCheckoutLoading ? "Processando..." : (
                  <>
                    Finalizar Pedido
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}