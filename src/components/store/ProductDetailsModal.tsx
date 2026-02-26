import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MenuItem } from "@/types/menu";
import { Minus, Plus, X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProductDetailsModalProps {
  product: MenuItem | any; // Usamos any para aceitar os complements sem erro de tipagem
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailsModal({ product, isOpen, onClose }: ProductDetailsModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedComps, setSelectedComps] = useState<Record<string, any[]>>({});
  const { addToCart } = useCart();

  // Resetar o estado sempre que o modal abrir com um novo produto
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedComps({});
    }
  }, [isOpen, product]);

  const complements: any[] = product?.complements || [];

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  // --- LÓGICA DE SELEÇÃO DE COMPLEMENTOS ---
  const handleToggleComp = (group: any, item: any) => {
    const currentSelected = selectedComps[group.id] || [];
    const isSelected = currentSelected.some(i => i.id === item.id);

    if (isSelected) {
      // Remove o item se já estiver selecionado
      setSelectedComps({
        ...selectedComps,
        [group.id]: currentSelected.filter(i => i.id !== item.id)
      });
    } else {
      // Verifica o limite máximo antes de adicionar
      if (currentSelected.length >= group.max) {
        if (group.max === 1) {
          // Se o limite for 1, troca a opção (comportamento de Radio Button)
          setSelectedComps({
            ...selectedComps,
            [group.id]: [item]
          });
        } else {
          toast.error(`Apenas ${group.max} opções permitidas neste grupo.`, {
            className: "bg-red-50 text-red-800 border-red-200"
          });
        }
        return;
      }
      
      // Adiciona o novo item
      setSelectedComps({
        ...selectedComps,
        [group.id]: [...currentSelected, item]
      });
    }
  };

  // --- CÁLCULOS ---
  const extrasPrice = Object.values(selectedComps).flat().reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  const unitPrice = Number(product.price) + extrasPrice;
  const totalPrice = unitPrice * quantity;

  // --- VALIDAÇÃO OBRIGATÓRIA ---
  const isValid = complements.every(group => {
    if (!group.isRequired) return true;
    const selectedCount = (selectedComps[group.id] || []).length;
    return selectedCount >= group.min;
  });

  const handleAddToCart = () => {
    if (!isValid) {
      toast.error("Atenção: Selecione os itens obrigatórios antes de adicionar.", {
        className: "bg-amber-50 text-amber-900 border-amber-200"
      });
      return;
    }

    // Monta o texto dos adicionais para enviar à cozinha (Ex: "Com: Queijo, Bacon")
    const selectedItemsList = Object.values(selectedComps).flat();
    const selectedNames = selectedItemsList.map(i => i.name).join(", ");
    const obs = selectedNames ? `Com: ${selectedNames}` : "";

    // Gera um ID único para que pastéis diferentes não se juntem na mesma linha do carrinho
    const cartItemId = selectedNames ? `${product.id}-${Date.now()}` : product.id;

    addToCart({
      id: cartItemId, 
      name: product.name,
      price: unitPrice, // Preço Base + Extras
      quantity: quantity,
      image_url: product.image, 
      observation: obs 
    });
    
    toast.success(`${quantity}x ${product.name} adicionado!`, {
      className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200",
      description: "O seu pedido foi atualizado."
    });
    
    onClose(); 
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
        
        <div className="relative bg-white dark:bg-slate-950 border border-white/20 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden flex flex-col h-[90vh]">
          
          {/* Botão Fechar */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 h-8 w-8 rounded-full bg-black/20 dark:bg-black/50 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/40 transition-colors shadow-lg"
          >
            <X className="h-4 w-4" />
          </button>

          <ScrollArea className="flex-1 overflow-y-auto">
            {/* Imagem */}
            <div className="relative h-64 w-full flex-shrink-0 bg-slate-100 dark:bg-slate-900">
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
              <img 
                src={product.image} 
                alt={product.name} 
                className="h-full w-full object-cover dark:brightness-[0.85]" 
              />
              <div className="absolute bottom-4 left-4 right-4 z-20">
                 {product.popular && (
                  <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block shadow-sm">
                    POPULAR
                  </span>
                 )}
                 <DialogTitle className="text-2xl font-black text-white leading-tight drop-shadow-md">
                   {product.name}
                 </DialogTitle>
              </div>
            </div>

            {/* Conteúdo Base */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {Number(product.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm font-medium">
                {product.description || "Sem descrição disponível."}
              </p>
            </div>

            {/* SEÇÃO DE COMPLEMENTOS DINÂMICOS */}
            {complements.length > 0 && (
              <div className="px-5 pb-5 space-y-6">
                {complements.map(group => {
                  const selectedCount = (selectedComps[group.id] || []).length;
                  const isFulfilled = !group.isRequired || selectedCount >= group.min;

                  return (
                    <div key={group.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                      
                      {/* Cabeçalho do Grupo */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100">{group.name}</h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {group.isRequired 
                              ? `Escolha de ${group.min} até ${group.max} opções` 
                              : `Escolha até ${group.max} opções (Opcional)`}
                          </p>
                        </div>
                        {group.isRequired && !isFulfilled && (
                          <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500 text-[9px] font-black uppercase px-2 py-1 rounded">
                            Obrigatório
                          </span>
                        )}
                      </div>

                      {/* Lista de Opções */}
                      <div className="space-y-2">
                        {group.items.map((item: any) => {
                          const isSelected = (selectedComps[group.id] || []).some(i => i.id === item.id);
                          return (
                            <div 
                              key={item.id} 
                              onClick={() => handleToggleComp(group, item)}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                                isSelected 
                                  ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-700 dark:bg-slate-800' 
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                                  isSelected 
                                    ? 'border-white dark:border-indigo-400 bg-white dark:bg-indigo-500 text-slate-900 dark:text-white' 
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}>
                                  {isSelected && <Check className="h-3.5 w-3.5" />}
                                </div>
                                <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {item.name}
                                </span>
                              </div>
                              {item.price > 0 && (
                                <span className={`text-xs font-black ${isSelected ? 'text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                  + R$ {Number(item.price).toFixed(2).replace('.', ',')}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
            
          {/* Rodapé - Controles Finais */}
          <div className="p-5 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 pl-3 uppercase tracking-widest">Quantidade</span>
              <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <button 
                  onClick={handleDecrement}
                  className="h-10 w-10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-black text-slate-900 dark:text-white text-sm">{quantity}</span>
                <button 
                  onClick={handleIncrement}
                  className="h-10 w-10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Button 
              onClick={handleAddToCart} 
              className={`w-full h-14 text-sm font-black rounded-2xl shadow-xl transition-all active:scale-95 ${
                isValid 
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white" 
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
              }`}
            >
              <div className="flex items-center justify-between w-full px-2">
                <span>{isValid ? "ADICIONAR" : "SELECIONE OS OBRIGATÓRIOS"}</span>
                {isValid && (
                  <span className="bg-white/20 dark:bg-black/10 px-3 py-1 rounded-lg text-sm tracking-wider">
                    {totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                )}
              </div>
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}