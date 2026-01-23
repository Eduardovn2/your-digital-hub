import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { HeroBanner } from "@/components/HeroBanner";
import { CategoryNav } from "@/components/CategoryNav";
import { MenuItemCard } from "@/components/MenuItemCard";
import { CartDrawer } from "@/components/CartDrawer";
import { CartProvider } from "@/contexts/CartContext";
import { useProducts, productToMenuItem } from "@/hooks/useProducts";
import { Loader2 } from "lucide-react";

function MenuContent() {
  const [activeCategory, setActiveCategory] = useState("all");
  const { data: products, isLoading, error } = useProducts();

  const menuItems = useMemo(() => {
    return products?.map(productToMenuItem) || [];
  }, [products]);

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return menuItems;
    return menuItems.filter((item) => item.category === activeCategory);
  }, [activeCategory, menuItems]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroBanner />
      <CategoryNav
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {activeCategory === "all" ? "Cardápio Completo" : ""}
          </h2>
          <p className="text-muted-foreground">
            {isLoading ? "Carregando..." : `${filteredItems.length} ${filteredItems.length === 1 ? "item" : "itens"} disponíveis`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-food-orange" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Erro ao carregar o cardápio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {!isLoading && !error && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum item encontrado nesta categoria.
            </p>
          </div>
        )}
      </main>

      <CartDrawer />

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 FoodMenu. Template para cardápio digital.
          </p>
        </div>
      </footer>
    </div>
  );
}

const Index = () => {
  return (
    <CartProvider>
      <MenuContent />
    </CartProvider>
  );
};

export default Index;
