import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ShoppingBag, CreditCard, Banknote, Trash2, Coins } from "lucide-react";
import { DeliveryAddressForm } from "@/components/DeliveryAddressForm";

export function CartDrawer() {
  const { items, total, removeFromCart, clearCart } = useCart();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  
  // Tipos de pagamento atualizados
  const [pagamento, setPagamento] = useState<"pix" | "card" | "money">("pix");
  const [trocoPara, setTrocoPara] = useState("");
  
  const [frete, setFrete] = useState<number>(0);
  const [enderecoCompleto, setEnderecoCompleto] = useState<any>(null);

  const totalFinal = total + frete;

  const handleAddressUpdate = (address: any, valorFrete: number) => {
    setEnderecoCompleto(address);
    setFrete(valorFrete);
  };

  const handleFinalizar = async () => {
    if (!nome || !telefone) {
      toast({ title: "Faltam dados", description: "Preencha seu nome e WhatsApp.", variant: "destructive" });
      return;
    }

    if (items.length === 0) {
      toast({ title: "Carrinho vazio", description: "Adicione itens antes de finalizar.", variant: "destructive" });
      return;
    }

    if (!enderecoCompleto) {
      toast({ title: "Frete Obrigatorio", description: "Por favor, digite seu CEP e calcule a entrega.", variant: "destructive" });
      return;
    }

    // Validacao do Troco
    if (pagamento === "money") {
        const valorPago = parseFloat(trocoPara.replace(",", "."));
        if (!trocoPara || isNaN(valorPago) || valorPago < totalFinal) {
            toast({ title: "Troco Invalido", description: "Informe um valor maior que o total para o troco.", variant: "destructive" });
            return;
        }
    }

    setLoading(true);

    setTimeout(() => {
      // Formata a string de pagamento para o Zap
      let textoPagamento = pagamento === "pix" ? "PIX" : pagamento === "card" ? "CARTAO" : "DINHEIRO";
      if (pagamento === "money") {
          const valorPago = parseFloat(trocoPara.replace(",", "."));
          const troco = valorPago - totalFinal;
          textoPagamento += ` (Troco para R$ ${valorPago.toFixed(2)} - Devolver R$ ${troco.toFixed(2)})`;
      }

      const mensagemZap = `
*NOVO PEDIDO - VIANAHUB*
Cliente: ${nome}
Contato: ${telefone}

*Entrega:*
${enderecoCompleto.rua}, ${enderecoCompleto.numero}
${enderecoCompleto.bairro} - ${enderecoCompleto.cidade}
${enderecoCompleto.complemento ? `Comp: ${enderecoCompleto.complemento}` : ''}
Ref: ${enderecoCompleto.referencia || "Sem ref"}

*Pedido:*
${items.map(i => `${i.quantity}x ${i.name} (R$ ${i.price.toFixed(2)})`).join("\n")}

Produtos: R$ ${total.toFixed(2)}
Frete: R$ ${frete.toFixed(2)}
*TOTAL FINAL: R$ ${totalFinal.toFixed(2)}*
Pagamento: ${textoPagamento}
      `;

      const url = `https://wa.me/5521987863935?text=${encodeURIComponent(mensagemZap)}`;
      window.open(url, "_blank");

      clearCart();
      setOpen(false);
      setLoading(false);
    }, 1500);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          className="
            relative h-14 px-8 rounded-full 
            bg-slate-900/80 hover:bg-slate-900 
            text-white backdrop-blur-xl 
            border border-white/10 shadow-2xl 
            flex items-center gap-3 
            transition-all duration-300 hover:scale-105
          "
        >
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
            <span className="font-bold text-sm">R$ {total.toFixed(2)}</span>
          </div>
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-white/85 backdrop-blur-xl border-l border-white/40 shadow-2xl">
        <SheetHeader className="px-1 text-left">
          <SheetTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Finalizar Compra
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 my-4">
          <div className="space-y-6 pb-6">
            
            {/* 1. ITENS */}
            <div className="space-y-3">
               <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wider pl-1">Seus Itens</h3>
               {items.length === 0 ? (
                 <div className="bg-white/50 border border-white/60 rounded-xl p-8 text-center backdrop-blur-sm">
                   <p className="text-sm text-slate-400">Sua sacola esta vazia.</p>
                 </div>
               ) : (
                 items.map(item => (
                   <div key={item.id} className="flex justify-between items-center bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-white/50 shadow-sm transition-all hover:bg-white/80">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100/80 h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold text-slate-700">
                           {item.quantity}x
                        </div>
                        <div>
                           <p className="text-sm font-medium text-slate-800">{item.name}</p>
                           <p className="text-xs text-slate-500">R$ {item.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                   </div>
                 ))
               )}
            </div>

            {/* 2. DADOS */}
            <div className="space-y-3 bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white/60 shadow-sm">
              <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                Identificacao
              </h3>
              <div className="space-y-3">
                 <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu Nome" className="bg-white/50 border-slate-200/60 focus:bg-white" />
                 <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="Seu WhatsApp" className="bg-white/50 border-slate-200/60 focus:bg-white" />
              </div>
            </div>

            {/* 3. ENTREGA */}
            <div className="space-y-3 bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white/60 shadow-sm">
               <DeliveryAddressForm onAddressComplete={handleAddressUpdate} />
            </div>

            {/* 4. PAGAMENTO COM DINHEIRO */}
            <div className="space-y-3 bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white/60 shadow-sm">
              <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                Pagamento na Entrega
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setPagamento("pix")}
                  className={`border rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-all ${pagamento === "pix" ? "border-green-500/50 bg-green-50/50 text-green-700 ring-2 ring-green-500/20" : "border-white/60 bg-white/40 hover:bg-white/60"}`}
                >
                  <Banknote className="h-4 w-4" />
                  <span className="text-[10px] font-bold">PIX</span>
                </button>
                <button 
                  onClick={() => setPagamento("card")}
                  className={`border rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-all ${pagamento === "card" ? "border-green-500/50 bg-green-50/50 text-green-700 ring-2 ring-green-500/20" : "border-white/60 bg-white/40 hover:bg-white/60"}`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="text-[10px] font-bold">Cartao</span>
                </button>
                <button 
                  onClick={() => setPagamento("money")}
                  className={`border rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-all ${pagamento === "money" ? "border-green-500/50 bg-green-50/50 text-green-700 ring-2 ring-green-500/20" : "border-white/60 bg-white/40 hover:bg-white/60"}`}
                >
                  <Coins className="h-4 w-4" />
                  <span className="text-[10px] font-bold">Dinheiro</span>
                </button>
              </div>

              {/* CAMPO DE TROCO CONDICIONAL */}
              {pagamento === "money" && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-xs text-slate-600 mb-1 block">Troco para quanto?</Label>
                      <Input 
                        placeholder="Ex: 50,00" 
                        value={trocoPara}
                        onChange={e => setTrocoPara(e.target.value)}
                        className="bg-white border-slate-200"
                        type="number"
                      />
                      {trocoPara && parseFloat(trocoPara) > totalFinal && (
                          <div className="text-xs text-green-600 mt-2 font-medium bg-green-50 p-2 rounded-lg border border-green-100">
                             Seu troco sera: R$ {(parseFloat(trocoPara) - totalFinal).toFixed(2)}
                          </div>
                      )}
                  </div>
              )}
            </div>

          </div>
        </ScrollArea>

        {/* FOOTER */}
        <div className="border-t border-white/50 bg-white/80 backdrop-blur-md -mx-6 px-6 pb-6 pt-4 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-20">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-700">R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Entrega</span>
              <span className={frete > 0 ? "text-green-600 font-bold" : "text-orange-500 font-medium"}>
                {frete > 0 ? `R$ ${frete.toFixed(2)}` : "Calcule o CEP"}
              </span>
            </div>
            <Separator className="bg-slate-200/60" />
            <div className="flex justify-between text-xl font-bold text-slate-900">
              <span>Total</span>
              <span>R$ {totalFinal.toFixed(2)}</span>
            </div>
          </div>

          <Button 
            className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02]" 
            onClick={handleFinalizar}
            disabled={loading || items.length === 0}
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Confirmar Pedido pelo Zap"}
          </Button>
        </div>

      </SheetContent>
    </Sheet>
  );
}