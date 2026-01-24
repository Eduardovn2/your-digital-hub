import { useState, useMemo, CSSProperties } from "react";
import { useParams, Link } from "react-router-dom";
import { useStoreBySlug } from "@/hooks/useStores";
import { useProducts, productToMenuItem } from "@/hooks/useProducts";
import { Store } from "@/types/store";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { MenuItemCard } from "@/components/MenuItemCard";
import { CheckoutDrawer } from "@/components/store/CheckoutDrawer";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Phone, MapPin, ArrowLeft } from "lucide-react";
import { categories } from "@/data/menuData";

function StoreContent() {
  const { slug } = useParams<{ slug: string }>();
  const { data: store, isLoading: storeLoading, error: storeError } = useStoreBySlug(slug);
  const { data: products, isLoading: productsLoading } = useProducts(store?.id);
  const { items, totalItems: itemCount, totalPrice: total } = useCart();
  const [activeCategory, setActiveCategory] = useState("all");
  const [showCheckout, setShowCheckout] = useState(false);

  const menuItems = useMemo(() => {
    if (!products) return [];
    return products.map(productToMenuItem);
  }, [products]);

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return menuItems;
    return menuItems.filter(item => item.category === activeCategory);
  }, [menuItems, activeCategory]);

  const availableCategories = useMemo(() => {
    if (!menuItems.length) return [];
    const usedCategories = new Set(menuItems.map(item => item.category));
    return categories.filter(cat => cat.id === "all" || usedCategories.has(cat.id));
  }, [menuItems]);

  // Loading
  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Store not found
  if (storeError || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-2xl font-bold mb-2">Loja não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            Esta loja não existe ou está indisponível
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Store closed
  if (!store.is_open) {
    return (
      <StoreLayout store={store}>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😴</div>
          <h2 className="text-xl font-bold mb-2">Estamos fechados</h2>
          <p className="text-muted-foreground">
            Volte mais tarde!
          </p>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout store={store}>
      {/* Categories */}
      {store.show_categories && availableCategories.length > 1 && (
        <div className="sticky top-0 z-10 py-3 -mx-4 px-4" style={{ backgroundColor: store.background_color }}>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {availableCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id 
                    ? 'text-white' 
                    : 'bg-white/80 hover:bg-white'
                }`}
                style={{
                  backgroundColor: activeCategory === cat.id ? store.primary_color : undefined,
                  color: activeCategory === cat.id ? 'white' : store.text_color
                }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      {productsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: store.primary_color }} />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum produto disponível</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${
          store.layout_style === 'list' 
            ? 'grid-cols-1' 
            : store.layout_style === 'compact' 
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {filteredItems.map(item => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Floating Cart Button */}
      {itemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Button
            onClick={() => setShowCheckout(true)}
            className="w-full py-6 text-lg shadow-lg"
            style={{ 
              backgroundColor: store.primary_color,
              color: 'white'
            }}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Ver Carrinho ({itemCount}) • R$ {total.toFixed(2).replace('.', ',')}
          </Button>
        </div>
      )}

      {/* Checkout */}
      <CheckoutDrawer
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        store={store}
      />
    </StoreLayout>
  );
}

function StoreLayout({ store, children }: { store: Store; children: React.ReactNode }) {
  const storeStyles: CSSProperties = {
    '--store-primary': store.primary_color,
    '--store-secondary': store.secondary_color,
    '--store-accent': store.accent_color,
    '--store-bg': store.background_color,
    '--store-text': store.text_color,
    backgroundColor: store.background_color,
    color: store.text_color,
    fontFamily: store.font_family,
    minHeight: '100vh',
  } as CSSProperties;

  return (
    <div style={storeStyles}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b" style={{ backgroundColor: store.background_color }}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: store.primary_color + '20' }}
              >
                🏪
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold truncate">{store.name}</h1>
              {store.description && (
                <p className="text-sm opacity-70 truncate">{store.description}</p>
              )}
            </div>
            {store.whatsapp && (
              <a
                href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full"
                style={{ backgroundColor: '#25D366', color: 'white' }}
              >
                <Phone className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Banner */}
      {store.show_banner && store.banner_url && (
        <div className="relative h-40 sm:h-56">
          <img
            src={store.banner_url}
            alt="Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Info Bar */}
      {store.address && (
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm opacity-70">
            <MapPin className="h-4 w-4" />
            <span>{store.address}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto px-4 py-4 pb-24">
        {children}
      </main>
    </div>
  );
}

export default function StorePage() {
  return (
    <CartProvider>
      <StoreContent />
    </CartProvider>
  );
}
