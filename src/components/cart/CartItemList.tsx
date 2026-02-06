import { ShoppingBag, ImageOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/contexts/CartContext";

interface CartItemListProps {
  items: CartItem[];
  removeFromCart: (id: string) => void;
}

export function CartItemList({ items, removeFromCart }: CartItemListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 opacity-50 flex flex-col items-center">
        <ShoppingBag className="h-12 w-12 mb-3 text-slate-300" />
        <span className="text-sm font-medium">Sua sacola está vazia</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex justify-between items-center bg-white/70 backdrop-blur-md p-3 rounded-xl border border-white/50 shadow-sm transition-all hover:bg-white/90">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-white/50 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/60">
              {item.image_url ? (
                <img src={item.image_url} className="h-full w-full object-cover" />
              ) : (
                <ImageOff className="text-slate-300 h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</p>
              <p className="text-[11px] text-slate-500 font-bold bg-white/50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                {item.quantity}x R$ {Number(item.price).toFixed(2)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50/50 transition-colors"
            onClick={() => removeFromCart(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}