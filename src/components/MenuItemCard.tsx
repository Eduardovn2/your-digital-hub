import { Plus, Star, Eye } from "lucide-react";
import { MenuItem } from "@/types/menu";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useState } from "react";
import { ProductDetailsModal } from "@/components/store/ProductDetailsModal"; 


interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { addToCart } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);

const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // EFEITO DE PULO NA SACOLA (Feedback instantâneo)
    const cartButton = document.getElementById('cart-trigger');
    if (cartButton) {
      // Cancela animações anteriores para garantir o "pop" a cada clique
      cartButton.getAnimations().forEach(anim => anim.cancel());
      
      cartButton.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.15)' }, // Cresce 15%
        { transform: 'scale(1)' }
      ], {
        duration: 300,
        easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' // Efeito elástico suave
      });
    }

    // Adiciona ao carrinho
    addToCart({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: 1,
      image_url: item.image,
      observation: ""
    });
  };

  return (
    <>
      <GlassCard 
        // PERFORMANCE: backdrop-blur-none no mobile e cores mais sólidas (95%) evitam o lag no scroll
        className="group h-full flex flex-col cursor-pointer transition-all duration-500 
                   hover:shadow-xl hover:-translate-y-1.5 
                   border-white/60 dark:border-white/5 
                   bg-white/95 dark:bg-slate-900/95 
                   backdrop-blur-none md:backdrop-blur-sm"
        onClick={() => setIsModalOpen(true)} 
      >
        {/* IMAGEM DO PRODUTO */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-slate-800">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 z-10" />
          
          <img
            src={item.image}
            alt={item.name}
            loading="lazy" // PERFORMANCE: Carrega apenas quando visível
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out dark:brightness-[0.85]"
          />
          
          {item.popular && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-amber-400/90 dark:bg-amber-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border border-white/30">
              <Star className="h-3 w-3 fill-current" />
              Popular
            </div>
          )}

          <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/20">
            <div className="bg-white/20 backdrop-blur-xl border border-white/50 text-white rounded-full p-3.5 transform scale-50 group-hover:scale-100 transition-all shadow-2xl">
              <Eye className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="p-5 flex flex-col flex-1 space-y-3">
          <div className="flex justify-between items-start gap-3">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 leading-tight line-clamp-2">
              {item.name}
            </h3>
            <span className="font-black text-slate-900 dark:text-white text-sm whitespace-nowrap bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-white/10 px-2.5 py-1 rounded-lg shadow-sm">
              {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
          
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-2 flex-1 font-medium">
            {item.description}
          </p>

          <Button
            onClick={handleQuickAdd}
            className="relative w-full h-11 bg-slate-900 dark:bg-slate-800/80 hover:bg-black dark:hover:bg-slate-700 text-white shadow-lg border border-transparent dark:border-white/10 transition-all rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 group/btn overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Adicionar à Sacola
              <Plus className="h-3.5 w-3.5" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-black/5 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
          </Button>
        </div>
      </GlassCard>

      <ProductDetailsModal 
        product={item} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}