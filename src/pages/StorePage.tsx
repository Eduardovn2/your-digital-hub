import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { MenuItemCard } from "@/components/MenuItemCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Search, Star, AlertCircle, ArrowLeft } from "lucide-react";
import CartDrawer from "@/components/CartDrawer";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useStoreBySlug } from "@/hooks/useStores";
import { useProducts, productToMenuItem } from "@/hooks/useProducts";
import { useStoreHours, isStoreCurrentlyOpen } from "@/hooks/useStoreHours";
import { MenuItem } from "@/types/menu";

// --- DICIONÁRIO DE TRADUÇÃO ---
const CATEGORY_TRANSLATIONS: Record<string, string> = {
  "All": "Todos",
  "Popular": "Populares",
  "Featured": "Destaques",
  "Promotions": "Promoções",
  "Offers": "Ofertas",
  "Combos": "Combos",
  "Meals": "Refeições",
  "Kids": "Infantil",
  "Vegan": "Vegano",
  "Vegetarian": "Vegetariano",
  "Other": "Outros",
  "Others": "Outros",
  "Burger": "Hambúrgueres",
  "Burgers": "Hambúrgueres",
  "Sandwich": "Sanduíches",
  "Sandwiches": "Sanduíches",
  "Pizza": "Pizzas",
  "Pizzas": "Pizzas",
  "Hot Dog": "Cachorro Quente",
  "Pastry": "Pastéis",
  "Pastries": "Salgados",
  "Snack": "Lanches",
  "Snacks": "Petiscos",
  "Portion": "Porções",
  "Portions": "Porções",
  "Pasta": "Massas",
  "Meat": "Carnes",
  "Chicken": "Frango",
  "Fish": "Peixes",
  "Salad": "Saladas",
  "Salads": "Saladas",
  "Soup": "Sopas",
  "Japanese": "Japonesa",
  "Sushi": "Sushi",
  "Acai": "Açaí",
  "Side": "Acompanhamentos",
  "Sides": "Acompanhamentos",
  "Fries": "Batata Frita",
  "Sauce": "Molhos",
  "Sauces": "Molhos",
  "Drink": "Bebidas",
  "Drinks": "Bebidas",
  "Beverage": "Bebidas",
  "Beverages": "Bebidas",
  "Soda": "Refrigerantes",
  "Juice": "Sucos",
  "Beer": "Cervejas",
  "Water": "Água",
  "Coffee": "Cafés",
  "Dessert": "Sobremesas",
  "Desserts": "Sobremesas",
  "Ice Cream": "Sorvetes",
  "Cake": "Bolos",
  "Sweet": "Doces",
  "Sweets": "Doces"
};

export default function StorePage() {
  const { setStoreId } = useCart();
  const { slug } = useParams();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Destaques");

  const { data: store, isLoading: isStoreLoading } = useStoreBySlug(slug);
  const { data: products, isLoading: isProductsLoading } = useProducts(store?.id);
  const { data: hours } = useStoreHours(store?.id);

  const isOpen = isStoreCurrentlyOpen(hours || null);

  useEffect(() => {
    if (store) {
      setStoreId(store.id);
    }

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [store, setStoreId]);

  const groupedProducts = useMemo(() => {
    if (!products) return {};
    
    const allItems = products.map(productToMenuItem);
    let filtered = allItems;

    if (searchTerm) {
      filtered = allItems.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return { "Resultados da Busca": filtered };
    }

    const groups: Record<string, MenuItem[]> = {};
    const popularItems = filtered.filter(p => p.popular);
    if (popularItems.length > 0) {
      groups["Destaques"] = popularItems;
    }

    filtered.forEach(item => {
      const categoryName = item.category || "Outros";
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(item);
    });

    return groups;
  }, [products, searchTerm]);

  const categories = Object.keys(groupedProducts);

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    const element = document.getElementById(`category-${category}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 180;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const translateCategory = (cat: string) => {
    if (!cat) return "Outros";
    return CATEGORY_TRANSLATIONS[cat] || 
           CATEGORY_TRANSLATIONS[cat.toLowerCase()] || 
           CATEGORY_TRANSLATIONS[cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()] || 
           cat;
  };

  if (isStoreLoading || isProductsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-500 animate-pulse">Carregando cardápio...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50">
        <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Loja não encontrada</h1>
        <p className="text-slate-600 mb-6">O endereço que você acessou não existe ou foi desativado.</p>
        <Link to="/">
          <Button>Voltar para o Início</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* Header Fixo */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-2" : "bg-transparent py-4"}`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/" className={`p-2 rounded-full transition-colors ${isScrolled ? "hover:bg-slate-100" : "bg-black/20 text-white hover:bg-black/30"}`}>
              <ArrowLeft className={`h-5 w-5 ${isScrolled ? "text-slate-600" : "text-white"}`} />
            </Link>
            <h1 className={`font-bold text-lg transition-opacity duration-300 ${isScrolled ? "opacity-100 text-slate-800" : "opacity-0"}`}>
              {store.name}
            </h1>
          </div>
          <CartDrawer />
        </div>
      </header>

      {/* Banner de Capa */}
      <div className="relative h-64 md:h-80 w-full mb-20"> 
        <div className="absolute inset-0 overflow-hidden rounded-b-[2.5rem] shadow-lg">
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none" />
           <img 
             src={store.banner_url || "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&h=400&fit=crop"} 
             alt="Capa" 
             className="w-full h-full object-cover animate-scale-in"
           />
        </div>
        
        {/* Card de Perfil da Loja */}
        <div className="absolute -bottom-16 left-0 right-0 z-20 px-4">
          <GlassCard className="container mx-auto max-w-4xl p-4 md:p-6 flex flex-row items-center gap-4 md:gap-6 bg-white/95 backdrop-blur-xl border-white/40 shadow-xl">
            <div className="h-16 w-16 md:h-24 md:w-24 rounded-2xl overflow-hidden border-4 border-white shadow-md flex-shrink-0 bg-white">
              <img 
                src={store.logo_url || "https://github.com/shadcn.png"} 
                alt="Logo" 
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-slate-900 truncate">{store.name}</h1>
                  
                  {/* --- CORREÇÃO: DESCRIÇÃO ADICIONADA AQUI --- */}
                  {store.description && (
                    <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-2 md:line-clamp-none italic max-w-xl">
                      {store.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mt-2">
                    <span className="flex items-center gap-1 font-medium"><Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 4.9</span>
                    
                    {isOpen ? (
                      <span className="text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1 text-xs md:text-sm">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Aberto
                      </span>
                    ) : (
                      <span className="text-red-500 font-bold bg-red-100 px-2 py-0.5 rounded-full text-xs md:text-sm">Fechado</span>
                    )}
                  </div>
                </div>
                
                {(store as any).street && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span className="truncate max-w-[200px] md:max-w-xs">
                      {(store as any).street}
                      {(store as any).street_number ? `, ${(store as any).street_number}` : ''}
                      {(store as any).neighborhood ? ` - ${(store as any).neighborhood}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="sticky top-16 z-40 bg-slate-50/95 backdrop-blur-sm py-4 space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="O que você procura hoje?" 
              className="pl-10 bg-white border-slate-200 shadow-sm focus-visible:ring-primary h-12 rounded-xl transition-all hover:border-primary/50" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {!searchTerm && categories.length > 0 && (
            <Tabs value={activeCategory} onValueChange={scrollToCategory} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto bg-transparent p-0 h-auto gap-2 no-scrollbar py-2">
                {categories.map((cat) => (
                  <TabsTrigger 
                    key={cat} 
                    value={cat}
                    className="rounded-full border border-slate-200 bg-white px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary shadow-sm transition-all hover:bg-slate-50 whitespace-nowrap"
                  >
                    {translateCategory(cat)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>

        <div className="mt-6 pb-20 space-y-12">
          {categories.length > 0 ? (
            categories.map((category) => (
              <div key={category} id={`category-${category}`} className="scroll-mt-48 animate-fade-in">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  {translateCategory(category)}
                  <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                    {groupedProducts[category].length}
                  </span>
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedProducts[category].map((item) => (
                    <MenuItemCard key={`${category}-${item.id}`} item={item} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-600">Nenhum item encontrado</h3>
              <p className="text-slate-400 text-sm mt-1">
                {searchTerm ? "Tente outro termo de busca." : "Esta loja ainda não tem produtos cadastrados."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}