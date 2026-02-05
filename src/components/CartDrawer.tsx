import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ShoppingBag, CreditCard, Banknote, Trash2, Coins, ImageOff, AlertTriangle } from "lucide-react";
import { DeliveryAddressForm, AddressData } from "@/components/DeliveryAddressForm";

const parseCurrency = (value: string) => {
  if (!value) return 0;
  return parseFloat(value.replace(",", ".")) || 0;
};

export default function CartDrawer() {
  const { items, removeFromCart, clearCart, storeId } = useCart();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [pagamento, setPagamento] = useState<"pix" | "card" | "money">("pix");
  const [trocoPara, setTrocoPara] = useState("");
  
  // O segredo está aqui: frete começa como NULL
  const [frete, setFrete] = useState<number | null>(null);
  const [enderecoCompleto, setEnderecoCompleto] = useState<AddressData | null>(null);

  const subtotalReal = items.reduce((acc, item) => {
    const preco = Number(item.price) || 0;
    const qtd = Number(item.quantity) || 1;
    return acc + (preco * qtd);
  }, 0);

  // Se frete for null (erro), visualmente mostra 0, mas a lógica bloqueia
  const freteVisual = frete === null ? 0 : frete;
  const totalFinal = subtotalReal + freteVisual;
  
  const valorTrocoInput = parseCurrency(trocoPara);
  const valorTrocoDevolver = valorTrocoInput - totalFinal;

  const handleAddressUpdate = (address: AddressData, valorFrete: number | null) => {
    setEnderecoCompleto(address);
    setFrete(valorFrete); // Atualiza com o valor calculado ou NULL se deu erro
  };

  const handleFinalizar = async () => {
    // 1. Validações Básicas
    if (!nome.trim() || !telefone.trim()) {
      toast({ title: "Faltam dados", description: "Preencha seu nome e contato.", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Carrinho vazio", description: "Adicione itens antes de finalizar.", variant: "destructive" });
      return;
    }
    
    // 2. Validação de Endereço e Frete (A TRAVA DE SEGURANÇA)
    if (!enderecoCompleto || !enderecoCompleto.numero) {
       toast({ title: "Endereço incompleto", description: "Preencha o CEP e o Número da casa.", variant: "destructive" });
       return;
    }

    // BLOQUEIO TOTAL: Se o frete for nulo, não deixa passar
    if (frete === null) {
        toast({ 
            title: "Frete Indisponível", 
            description: "Não conseguimos calcular a entrega para este local. Por favor, chame no WhatsApp.", 
            variant: "destructive" 
        });
        return;
    }
    
    let changeValue = null;
    if (pagamento === "money") {
        if (valorTrocoInput < totalFinal) {
            toast({ title: "Valor insuficiente", description: "O troco deve ser maior que o total.", variant: "destructive" });
            return;
        }
        changeValue = valorTrocoInput;
    }

    setLoading(true);

    try {
      const addressString = `${enderecoCompleto.rua}, ${enderecoCompleto.numero} - ${enderecoCompleto.bairro}, ${enderecoCompleto.cidade} (${enderecoCompleto.cep})`;
      const fullAddress = enderecoCompleto.complemento ? `${addressString} [Comp: ${enderecoCompleto.complemento}]` : addressString;

      const orderPayload: any = {
        store_id: storeId,
        customer_name: nome,
        customer_phone: telefone,
        customer_address: fullAddress,
        delivery_fee: freteVisual,
        total_amount: totalFinal,
        payment_method: pagamento,
        change_for: changeValue,
        status: "pending",
        items: items.map(item => ({
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price) || 0,
          observation: item.observation || ""
        }))
      };

      const { data, error } = await supabase.from("orders").insert([orderPayload]).select().single();

      if (error) throw error;

      toast({
        title: "Pedido Enviado!",
        description: `Seu pedido #${data.id.slice(0,8)} foi recebido.`,
      });

      clearCart();
      setOpen(false);

    } catch (error: any) {
      console.error("Erro no pedido:", error);
      toast({ title: "Erro", description: "Não foi possível enviar o pedido.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="relative h-14 px-8 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-3 transition-all duration-300 hover:scale-105">
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-green-500 text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-slate-900">
                {items.length}
              </span>
            )}
          </div>
          <div className="flex flex-col items-start text-xs">
            <span className="font-normal opacity-80 uppercase tracking-wider text-[10px]">Minha Sacola</span>
            <span className="font-bold text-sm">R$ {subtotalReal.toFixed(2)}</span>
          </div>
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-white/95 backdrop-blur-xl border-l border-white/40 shadow-2xl p-0">
        <SheetHeader className="px-6 pt-6 text-left">
          <SheetTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Finalizar Compra
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 py-6">
            
            {/* ITENS */}
            <div className="space-y-3">
               <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wider">Seus Itens</h3>
               {items.length === 0 ? (
                 <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 text-center">
                   <p className="text-sm text-slate-400">Sua sacola está vazia.</p>
                 </div>
               ) : (
                 items.map(item => (
                   <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 relative">
                           {item.image_url ? (
                             <img 
                               src={item.image_url} 
                               alt={item.name} 
                               className="h-full w-full object-cover"
                               onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                             />
                           ) : null}
                           <div className={`absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-100 -z-10`}>
                               <ImageOff className="h-5 w-5" />
                           </div>
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                             <span className="text-xs font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{item.quantity}x</span>
                             <p className="text-sm font-medium text-slate-800 line-clamp-1">{item.name}</p>
                           </div>
                           <p className="text-xs text-slate-500 font-medium">R$ {(Number(item.price) || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                   </div>
                 ))
               )}
            </div>

            {/* DADOS PESSOAIS */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <h3 className="font-semibold text-sm text-slate-700">Identificação</h3>
              <div className="space-y-3">
                 <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu Nome" className="bg-slate-50 focus:bg-white" />
                 <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="Seu WhatsApp" className="bg-slate-50 focus:bg-white" />
              </div>
            </div>

            {/* ENTREGA - Se frete for null, mostra aviso */}
            <div className={`space-y-3 bg-white p-4 rounded-xl border shadow-sm ${frete === null && enderecoCompleto ? "border-red-200 bg-red-50/50" : "border-slate-100"}`}>
               <DeliveryAddressForm 
                  onAddressComplete={handleAddressUpdate} 
                  storeId={storeId} 
               />
               {frete === null && enderecoCompleto && (
                   <div className="flex items-center gap-2 text-xs text-red-600 font-medium animate-pulse mt-2">
                       <AlertTriangle className="h-4 w-4" />
                       Não foi possível calcular o frete para este local.
                   </div>
               )}
            </div>

            {/* PAGAMENTO */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <h3 className="font-semibold text-sm text-slate-700">Pagamento</h3>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setPagamento("pix")} className={`border rounded-lg p-3 flex flex-col items-center gap-1 transition-all ${pagamento === "pix" ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200 hover:bg-slate-50"}`}>
                  <Banknote className="h-5 w-5" /><span className="text-[10px] font-bold">PIX</span>
                </button>
                <button onClick={() => setPagamento("card")} className={`border rounded-lg p-3 flex flex-col items-center gap-1 transition-all ${pagamento === "card" ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200 hover:bg-slate-50"}`}>
                  <CreditCard className="h-5 w-5" /><span className="text-[10px] font-bold">Cartão</span>
                </button>
                <button onClick={() => setPagamento("money")} className={`border rounded-lg p-3 flex flex-col items-center gap-1 transition-all ${pagamento === "money" ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200 hover:bg-slate-50"}`}>
                  <Coins className="h-5 w-5" /><span className="text-[10px] font-bold">Dinheiro</span>
                </button>
              </div>

              {pagamento === "money" && (
                  <div className="mt-3 animate-in fade-in pt-2 border-t border-slate-100">
                      <Label className="text-xs text-slate-600 mb-1.5 block font-medium">Troco para quanto?</Label>
                      <Input 
                        placeholder="Ex: 50,00" 
                        value={trocoPara}
                        onChange={e => setTrocoPara(e.target.value)}
                        className="bg-white border-slate-300"
                        type="number" 
                        step="0.01"
                      />
                      {valorTrocoInput > 0 && (
                        <div className={`mt-2 p-2 rounded-lg text-xs font-bold flex justify-between items-center ${
                           valorTrocoInput >= totalFinal 
                             ? "bg-green-100 text-green-700 border border-green-200" 
                             : "bg-red-100 text-red-700 border border-red-200"
                        }`}>
                           <span>{valorTrocoInput >= totalFinal ? "Troco a receber:" : "Falta:"}</span>
                           <span className="text-sm">R$ {Math.abs(valorTrocoDevolver).toFixed(2)}</span>
                        </div>
                      )}
                  </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* FOOTER - BLOQUEIO DO BOTÃO */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 shadow-inner mt-auto">
          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span><span>R$ {subtotalReal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Entrega</span>
              <span className={frete !== null ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                {frete !== null ? `R$ ${frete.toFixed(2)}` : "A calcular"}
              </span>
            </div>
            <Separator className="my-2 bg-slate-200" />
            <div className="flex justify-between text-lg font-extrabold text-slate-900">
              <span>Total</span><span>R$ {totalFinal.toFixed(2)}</span>
            </div>
          </div>

          <Button 
            className={`w-full h-12 text-base font-bold rounded-xl shadow-lg transition-transform active:scale-95 ${
                frete === null ? "bg-slate-400 hover:bg-slate-400 cursor-not-allowed opacity-70" : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}
            onClick={handleFinalizar}
            disabled={loading || items.length === 0 || frete === null}
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (frete === null ? "Calcule a Entrega" : "Confirmar Pedido")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}