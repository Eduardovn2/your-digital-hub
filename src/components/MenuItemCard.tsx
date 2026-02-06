import { Plus, Star, Eye } from "lucide-react";
import { MenuItem } from "@/types/menu";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";
import { useState } from "react";
import { ProductDetailsModal } from "@/components/store/ProductDetailsModal"; 
// IMPORTANTE: Certifique-se de que o arquivo animations.ts existe em src/lib/
import { flyToCart } from "@/lib/animation"; 

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { addToCart } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // AÇÃO DE ADICIONAR (Com a Animação de Voo)
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o modal ao clicar no botão
    
    // 1. CHAMA A ANIMAÇÃO (A mágica acontece aqui!)
    flyToCart(e, item.image);

    // 2. Lógica do Carrinho
    addToCart({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: 1,
      image_url: item.image,
      observation: ""
    });

    // 3. Feedback Visual (Toast Glass Theme)
    toast.success(`${item.name} voou para a sacola!`, {
      position: "bottom-center",
      className: "bg-white/80 backdrop-blur-md border-white/20 text-slate-900 font-bold shadow-xl"
    });
  };

  return (
    <>
      <GlassCard 
        className="group h-full flex flex-col cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-slate-900/10 hover:-translate-y-1.5 border-white/60 bg-white/40"
        onClick={() => setIsModalOpen(true)} 
      >
        {/* IMAGEM DO PRODUTO */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
          
          {/* Overlay Gradiente Suave */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity z-10 duration-500" />
          
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
          
          {/* Badge Popular (Efeito Glass Dourado) */}
          {item.popular && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-amber-400/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border border-white/30 animate-in fade-in zoom-in">
              <Star className="h-3 w-3 fill-current" />
              Popular
            </div>
          )}

          {/* Ícone 'Ver Detalhes' (Aparece no Hover) */}
          <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/20 backdrop-blur-[2px]">
            <div className="bg-white/20 backdrop-blur-xl border border-white/50 text-white rounded-full p-3.5 transform scale-50 group-hover:scale-100 transition-all shadow-2xl">
              <Eye className="h-6 w-6 drop-shadow-md" />
            </div>
          </div>
        </div>

        {/* CONTEÚDO DO CARD */}
        <div className="p-5 flex flex-col flex-1 space-y-3">
          <div className="flex justify-between items-start gap-3">
            <h3 className="font-extrabold text-base text-slate-800 leading-tight line-clamp-2 group-hover:text-slate-900 transition-colors">
              {item.name}
            </h3>
            <span className="font-black text-slate-900 text-sm whitespace-nowrap bg-white/60 backdrop-blur-sm border border-white/50 px-2.5 py-1 rounded-lg shadow-sm">
              {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
          
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 flex-1 font-medium">
            {item.description}
          </p>

          {/* BOTÃO DE ADICIONAR (Moderno & Glass) */}
          <Button
            onClick={handleQuickAdd}
            className="relative w-full h-11 bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 transition-all rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 group/btn overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Adicionar à Sacola
              <Plus className="h-3.5 w-3.5" />
            </span>
            
            {/* Brilho no Botão */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
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