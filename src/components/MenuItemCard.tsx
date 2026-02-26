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

  // Verifica se o produto tem algum grupo de complemento cadastrado
  const hasComplements = item.complements && item.complements.length > 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // MÁGICA AQUI: Se tiver complementos, o botão abre a tela de adicionais!
    if (hasComplements) {
      setIsModalOpen(true);
      return; 
    }
    
    // SE NÃO TIVER COMPLEMENTOS: EFEITO DE PULO NA SACOLA (Feedback instantâneo)
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

    // Adiciona ao carrinho direto
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
        // PERFORMANCE: 
        // 1. backdrop-blur-none no mobile (crucial para Androids intermediários)
        // 2. bg-white/95 e dark:bg-slate-900/95: Fundo quase sólido é mais rápido de renderizar
        className="group h-full flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 border-white/60 dark:border-white/5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-none md:backdrop-blur-sm shadow-sm md:shadow-lg"
        onClick={() => setIsModalOpen(true)} 
      >
        {/* IMAGEM DO PRODUTO */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-slate-800">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 z-10" />
          
          <img
            src={item.image}
            alt={item.name}
            // PERFORMANCE: Carrega sob demanda e decodifica em segundo plano
            loading="lazy" 
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 dark:brightness-[0.85]"
          />
          
          {item.popular && (
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm border border-white/20">
              <Star className="h-3 w-3 fill-current" />
              Popular
            </div>
          )}

          <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20">
            <div className="bg-white/20 backdrop-blur-xl border border-white/50 text-white rounded-full p-3 transform scale-75 group-hover:scale-100 transition-all shadow-xl">
              <Eye className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="p-4 flex flex-col flex-1 space-y-2">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight line-clamp-2">
              {item.name}
            </h3>
            <span className="font-black text-slate-900 dark:text-white text-xs whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
              {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
          
          <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed line-clamp-2 flex-1 font-medium">
            {item.description}
          </p>

          <Button
            onClick={handleQuickAdd}
            className={`w-full h-10 text-white dark:text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider active:scale-95 transition-transform shadow-md ${
              hasComplements 
                ? "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400" // Cor diferente para produtos com opções
                : "bg-slate-900 dark:bg-slate-100 hover:bg-black dark:hover:bg-white"
            }`}
          >
            {hasComplements ? "Opções" : "Adicionar"}
            <Plus className="h-3.5 w-3.5 ml-2" />
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