import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MenuItem } from "@/types/menu";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
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
    // Adiciona o item N vezes dependendo da quantidade
    // Obs: O ideal seria o CartContext aceitar quantidade, mas vamos fazer um loop simples para manter compatibilidade
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    
    // Feedback visual mais rico
    toast.success(`${quantity}x ${product.name} adicionado!`, {
      className: "bg-green-50 border-green-200 text-green-800",
      description: "Seu pedido foi atualizado."
    });
    
    setQuantity(1); // Reseta
    onClose(); // Fecha o modal
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
        <div className="relative bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Botão Fechar Flutuante */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 h-8 w-8 rounded-full bg-black/20 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/40 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Imagem de Destaque */}
          <div className="relative h-64 w-full flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
            <img 
              src={product.image} 
              alt={product.name} 
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-4 left-4 right-4 z-20">
               {product.popular && (
                <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full mb-2 inline-block shadow-sm">
                  POPULAR
                </span>
               )}
               <DialogTitle className="text-2xl font-bold text-white leading-tight shadow-black/10 drop-shadow-md">
                 {product.name}
               </DialogTitle>
            </div>
          </div>

          {/* Conteúdo Rolável */}
          <div className="p-6 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl font-bold text-primary">
                {product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed mb-8 text-sm md:text-base">
              {product.description || "Sem descrição disponível para este item."}
            </p>
            
            {/* Controles de Ação */}
            <div className="mt-auto space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-1 rounded-xl border border-slate-100">
                <div className="flex items-center gap-4 px-2">
                  <span className="text-sm font-medium text-slate-500">Quantidade</span>
                </div>
                <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200">
                  <button 
                    onClick={handleDecrement}
                    className="h-10 w-10 flex items-center justify-center text-slate-500 hover:text-primary active:bg-slate-50 rounded-l-lg transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-slate-800">{quantity}</span>
                  <button 
                    onClick={handleIncrement}
                    className="h-10 w-10 flex items-center justify-center text-slate-500 hover:text-primary active:bg-slate-50 rounded-r-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <Button 
                onClick={handleAddToCart} 
                className="w-full h-12 text-lg font-bold shadow-neon bg-primary hover:bg-primary/90 rounded-xl"
              >
                <div className="flex items-center justify-between w-full px-4">
                  <span>Adicionar</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
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