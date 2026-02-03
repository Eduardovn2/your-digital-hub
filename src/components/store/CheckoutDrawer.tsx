import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight, CreditCard, ImageOff, MapPin, User, Banknote, Store } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner"; // Importante importar o toast

const checkoutSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 letras"),
  phone: z.string().min(10, "Telefone inválido (mínimo 10 dígitos)"),
  address: z.string().min(5, "Endereço muito curto. Inclua rua e número."),
  complement: z.string().optional(),
  paymentMethod: z.enum(["pix", "credit", "debit", "cash"], {
    required_error: "Selecione uma forma de pagamento",
  }),
  changeFor: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutDrawerProps {
  storeId: string;
  isStoreOpen: boolean; // NOVO PROP
}

export function CheckoutDrawer({ storeId, isStoreOpen }: CheckoutDrawerProps) {
  const { items, updateQuantity, removeFromCart, subtotal, checkout } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"cart" | "form">("cart");
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const deliveryFee = 5.00;
  const total = subtotal + deliveryFee;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "pix"
    }
  });

  const selectedPayment = watch("paymentMethod");

  const onSubmit = async (data: CheckoutFormData) => {
    // BLOQUEIO DE SEGURANÇA
    if (!isStoreOpen) {
      toast.error("A loja está fechada no momento!", {
        description: "Não é possível realizar pedidos fora do horário de funcionamento."
      });
      return;
    }

    if (!storeId) {
      console.error("ID da loja não fornecido");
      return;
    }

    setIsCheckoutLoading(true);
    try {
      const fullAddress = `${data.address}${data.complement ? ` - ${data.complement}` : ''}`;
      
      const paymentInfo = data.paymentMethod === 'cash' && data.changeFor 
        ? `Dinheiro (Troco para ${data.changeFor})` 
        : `Pagamento: ${data.paymentMethod.toUpperCase()}`;

      await checkout({
        name: data.name,
        phone: data.phone,
        address: `${fullAddress} | ${paymentInfo}`
      }, storeId, deliveryFee);

      setIsOpen(false);
      setStep("cart");
    } catch (error) {
      console.error(error);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setTimeout(() => setStep("cart"), 300);
    }}>
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

      <SheetContent className="w-full sm:max-w-md border-l border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl p-0 flex flex-col z-[100]">
        
        <SheetHeader className="px-6 py-6 border-b border-slate-100/50 bg-white/40">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
            {step === "cart" ? (
              <>
                <ShoppingBag className="h-5 w-5 text-primary" /> Seu Pedido
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mr-2 -ml-2" onClick={() => setStep("cart")}>
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </Button>
                Finalizar Compra
              </>
            )}
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
            {!isStoreOpen && (
              <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3 text-red-700 text-sm font-medium">
                <Store className="h-5 w-5" />
                <div>
                  <p>A loja está fechada agora.</p>
                  <p className="text-xs opacity-80 font-normal">Você pode montar o carrinho, mas não poderá enviar.</p>
                </div>
              </div>
            )}

            {step === "cart" && (
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-6 py-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 group animate-fade-in">
                      <div className="h-16 w-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                         {item.image ? (
                           <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-300">
                             <ImageOff className="h-6 w-6" />
                           </div>
                         )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-slate-800 line-clamp-2 text-sm">{item.name}</h4>
                          <span className="font-bold text-slate-900 text-sm ml-2">
                            {(item.price * item.quantity).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 bg-slate-50 rounded-full px-2 py-1 border border-slate-100">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white text-slate-500 transition-colors"><Minus className="h-3 w-3" /></button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white text-primary transition-colors"><Plus className="h-3 w-3" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity px-2">
                            <Trash2 className="h-3 w-3" /> Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {step === "form" && (
              <ScrollArea className="flex-1 px-6">
                <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-6">
                  
                  {/* ... Campos do formulário (mantive oculto para economizar espaço, mantenha o código anterior aqui) ... */}
                  {/* COPIAR O CONTEÚDO DO FORMULÁRIO DO PASSO ANTERIOR AQUI */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-primary" /> Seus Dados
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input id="name" placeholder="Ex: João Silva" {...register("name")} className={errors.name ? "border-red-500" : ""} />
                      {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone / WhatsApp</Label>
                      <Input id="phone" placeholder="(00) 90000-0000" {...register("phone")} className={errors.phone ? "border-red-500" : ""} />
                      {errors.phone && <span className="text-xs text-red-500">{errors.phone.message}</span>}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" /> Entrega
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço com Número</Label>
                      <Textarea id="address" placeholder="Rua das Flores, 123, Bairro Centro" {...register("address")} className={errors.address ? "border-red-500" : ""} />
                      {errors.address && <span className="text-xs text-red-500">{errors.address.message}</span>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento (Opcional)</Label>
                      <Input id="complement" placeholder="Apto 101, Ao lado da padaria" {...register("complement")} />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-primary" /> Pagamento
                    </h3>
                    <RadioGroup defaultValue="pix" onValueChange={(val) => register("paymentMethod").onChange({ target: { value: val, name: "paymentMethod" } })}>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <RadioGroupItem value="pix" id="pix" className="peer sr-only" />
                          <Label htmlFor="pix" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                            <span className="text-xl mb-1">💠</span>
                            <span className="text-xs font-bold">PIX</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="credit" id="credit" className="peer sr-only" />
                          <Label htmlFor="credit" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                            <span className="text-xl mb-1">💳</span>
                            <span className="text-xs font-bold">Cartão</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                          <Label htmlFor="cash" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                            <span className="text-xl mb-1">💵</span>
                            <span className="text-xs font-bold">Dinheiro</span>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                    {selectedPayment === 'cash' && (
                      <div className="pt-2 animate-fade-in">
                        <Label htmlFor="changeFor" className="text-xs">Troco para quanto? (Deixe vazio se não precisar)</Label>
                        <div className="relative mt-1">
                          <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input id="changeFor" placeholder="Ex: 50,00" className="pl-9" {...register("changeFor")} />
                        </div>
                      </div>
                    )}
                  </div>

                </form>
              </ScrollArea>
            )}

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

              {step === "cart" ? (
                <Button 
                  className="w-full h-12 text-base font-bold shadow-neon bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={() => setStep("form")}
                  disabled={!isStoreOpen} // BLOQUEIA BOTÃO SE FECHADO
                >
                  {isStoreOpen ? (
                    <>
                      Continuar para Entrega
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  ) : (
                    "Loja Fechada"
                  )}
                </Button>
              ) : (
                <Button 
                  form="checkout-form"
                  type="submit"
                  className="w-full h-12 text-base font-bold shadow-neon bg-green-600 hover:bg-green-700 disabled:opacity-50" 
                  disabled={isCheckoutLoading || !isStoreOpen}
                >
                  {isCheckoutLoading ? "Enviando Pedido..." : "Confirmar Pedido"}
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}