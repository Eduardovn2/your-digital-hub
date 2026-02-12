import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MenuItem } from "@/types/menu";
import { Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface ProductDetailsModalProps {
  product: MenuItem;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailsModal({ product, isOpen, onClose }: ProductDetailsModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = () => {
      // CORREÇÃO: Criamos um objeto com o formato exato que o carrinho espera (CartItem)
      addToCart({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: quantity, // Passamos a quantidade selecionada no modal direto aqui
        image_url: product.image, // Mapeamos 'image' do produto para 'image_url' do carrinho
        observation: "" 
      });
      
      // Feedback visual
      toast.success(`${quantity}x ${product.name} adicionado!`, {
        className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200",
        description: "Seu pedido foi atualizado."
      });
      
      setQuantity(1); // Reseta
      onClose(); // Fecha o modal
    };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
        {/* CONTAINER PRINCIPAL: Soft Dark & Performance (Sem blur pesado no mobile) */}
        <div className="relative bg-white dark:bg-slate-900 border border-white/20 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Botão Fechar */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 h-8 w-8 rounded-full bg-black/20 dark:bg-black/50 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/40 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Imagem */}
          <div className="relative h-64 w-full flex-shrink-0 bg-slate-100 dark:bg-slate-800">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
            <img 
              src={product.image} 
              alt={product.name} 
              className="h-full w-full object-cover dark:brightness-[0.85]" // Brilho reduzido no dark mode
            />
            <div className="absolute bottom-4 left-4 right-4 z-20">
               {product.popular && (
                <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block shadow-sm">
                  POPULAR
                </span>
               )}
               <DialogTitle className="text-2xl font-bold text-white leading-tight drop-shadow-md">
                 {product.name}
               </DialogTitle>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 text-sm font-medium">
              {product.description || "Sem descrição disponível."}
            </p>
            
            {/* Controles */}
            <div className="mt-auto space-y-4">
              {/* Seletor de Quantidade Stealth */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 pl-3 uppercase tracking-wider">Quantidade</span>
                
                <div className="flex items-center bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-100 dark:border-slate-600">
                  <button 
                    onClick={handleDecrement}
                    className="h-9 w-9 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white active:bg-slate-50 dark:active:bg-slate-600 rounded-l-lg transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-black text-slate-900 dark:text-white text-sm">{quantity}</span>
                  <button 
                    onClick={handleIncrement}
                    className="h-9 w-9 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white active:bg-slate-50 dark:active:bg-slate-600 rounded-r-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Botão Adicionar */}
              <Button 
                onClick={handleAddToCart} 
                className="w-full h-12 text-sm font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white rounded-xl shadow-lg transition-transform active:scale-95"
              >
                <div className="flex items-center justify-between w-full px-4">
                  <span>ADICIONAR AO PEDIDO</span>
                  <span className="bg-white/20 dark:bg-black/10 px-2 py-0.5 rounded text-xs">
                    {(product.price * quantity).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}