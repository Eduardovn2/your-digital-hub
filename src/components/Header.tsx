import { ShoppingBag, MapPin, Search, ExternalLink } from "lucide-react"; // Adicionei ExternalLink
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Se você tiver um hook de loja, importe aqui. Ex: import { useStore } from "@/hooks/useStore";

export function Header() {
  const { totalItems, setIsCartOpen } = useCart();
  
  // TODO: Aqui você precisa garantir que tem os dados da loja.
  // Muitas vezes, o próprio 'useCart' ou um 'useStore' já traz isso.
  // Vou criar um objeto simulado para o código não quebrar agora, 
  // mas você deve conectar com seu banco de dados real.
  const store = { 
    address: "Rua das Delícias, 123" // <-- O sistema deve buscar isso do banco
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-3xl">🍔</span>
            <h1 className="text-xl md:text-2xl font-bold text-gradient">
              FoodMenu
            </h1>
          </div>

          {/* Location - Hidden on mobile */}
          {/* --- AQUI ESTÁ A MUDANÇA --- */}
          <div className="hidden md:flex items-center gap-2 text-muted-foreground">
            {store?.address ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary hover:underline transition-colors cursor-pointer"
                title="Ver no Google Maps"
              >
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm">{store.address}</span>
                {/* Ícone pequeno para indicar link externo */}
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
            ) : (
              // Fallback caso não tenha endereço carregado
              <div className="flex items-center gap-2 opacity-50">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Carregando endereço...</span>
              </div>
            )}
          </div>
          {/* --------------------------- */}

          {/* Search - Hidden on mobile */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar no cardápio..."
                className="pl-10 bg-secondary border-none"
              />
            </div>
          </div>

          {/* Cart Button */}
          <Button
            onClick={() => setIsCartOpen(true)}
            className="relative bg-primary hover:bg-primary/90 text-primary-foreground button-shadow"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden sm:inline ml-2">Carrinho</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-food-red text-white text-xs flex items-center justify-center font-semibold animate-scale-in">
                {totalItems}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}