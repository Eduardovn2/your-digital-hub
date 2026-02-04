import { Plus, Star, Eye } from "lucide-react";
import { MenuItem } from "@/types/menu";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";
import { useState } from "react";
import { ProductDetailsModal } from "@/components/store/ProductDetailsModal"; 

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { addToCart } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Função para adicionar direto (botão rápido)
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    // AQUI ESTÁ A CORREÇÃO MÁGICA
    // Convertemos os dados do Menu para o formato do Carrinho
    addToCart({
      id: item.id,
      name: item.name,
      price: Number(item.price), // Garante que é número
      quantity: 1,
      image_url: item.image,     // <--- O SEGREDO: Mapeamos 'image' para 'image_url'
      observation: ""            // Garante que não vai undefined
    });

    toast.success(`${item.name} adicionado!`, {
      position: "bottom-center",
      className: "bg-white/80 backdrop-blur-md border-primary/20 text-primary"
    });
  };

  return (
    <>
      <GlassCard 
        className="group h-full flex flex-col cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-primary/20"
        onClick={() => setIsModalOpen(true)} 
      >
        {/* Imagem com Overlay Gradiente */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity z-10" />
          
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
          
          {/* Badge Popular */}
          {item.popular && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-yellow-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              <Star className="h-3 w-3 fill-current" />
              POPULAR
            </div>
          )}

          {/* Ícone de "Ver Detalhes" */}
          <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
            <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform">
              <Eye className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-slate-800 leading-tight line-clamp-2">
              {item.name}
            </h3>
            <span className="font-bold text-primary text-lg whitespace-nowrap ml-2">
              {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
          
          <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">
            {item.description}
          </p>

          <Button
            onClick={handleQuickAdd}
            className="w-full bg-slate-100 hover:bg-primary hover:text-white text-slate-700 shadow-sm hover:shadow-primary/30 transition-all rounded-xl h-11 font-semibold group-active:scale-95"
            variant="ghost"
          >
            Adicionar ao Pedido
            <Plus className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </GlassCard>

      {/* Renderiza o Modal Controlado */}
      <ProductDetailsModal 
        product={item} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}