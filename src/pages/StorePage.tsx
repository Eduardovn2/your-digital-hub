import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { MenuItemCard } from "@/components/MenuItemCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Search, AlertCircle, Clock, Phone, Instagram } from "lucide-react";
import CartDrawer from "@/components/CartDrawer";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

import { useStoreBySlug } from "@/hooks/useStores";
import { useProducts, productToMenuItem } from "@/hooks/useProducts";
import { useStoreHours, isStoreCurrentlyOpen } from "@/hooks/useStoreHours";
import { MenuItem } from "@/types/menu";

const CATEGORY_TRANSLATIONS: Record<string, string> = {
  "All": "Todos", "Popular": "Populares", "Featured": "Destaques", "Promotions": "Promoções",
  "Offers": "Ofertas", "Combos": "Combos", "Meals": "Refeições", "Kids": "Infantil",
  "Vegan": "Vegano", "Vegetarian": "Vegetariano", "Other": "Outros", "Others": "Outros",
  "Burger": "Hambúrgueres", "Burgers": "Hambúrgueres", "Sandwich": "Sanduíches", "Sandwiches": "Sanduíches",
  "Pizza": "Pizzas", "Pizzas": "Pizzas", "Hot Dog": "Cachorro Quente", "Pastry": "Pastéis",
  "Pastries": "Salgados", "Snack": "Lanches", "Snacks": "Petiscos", "Portion": "Porções",
  "Portions": "Porções", "Pasta": "Massas", "Meat": "Carnes", "Chicken": "Frango",
  "Fish": "Peixes", "Salad": "Saladas", "Salads": "Saladas", "Soup": "Sopas",
  "Japanese": "Japonesa", "Sushi": "Sushi", "Acai": "Açaí", "Side": "Acompanhamentos",
  "Sides": "Acompanhamentos", "Fries": "Batata Frita", "Sauce": "Molhos", "Sauces": "Molhos",
  "Drink": "Bebidas", "Drinks": "Bebidas", "Beverage": "Bebidas", "Beverages": "Bebidas",
  "Soda": "Refrigerantes", "Juice": "Sucos", "Beer": "Cervejas", "Water": "Água",
  "Coffee": "Cafés", "Dessert": "Sobremesas", "Desserts": "Sobremesas", "Ice Cream": "Sorvetes",
  "Cake": "Bolos", "Sweet": "Doces", "Sweets": "Doces"
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
  
  // Verificar se a loja tem pelo menos uma opção de pagamento configurada
  const hasPaymentConfig = store?.accepts_online_payment || store?.accepts_cash_on_delivery;
  
  // Se não tem pagamento configurado, considera loja fechada

  useEffect(() => {
    if (store) {
      setStoreId(store.id);
    }

    const handleScroll = () => {
      const threshold = 50;
      const isOverThreshold = window.scrollY > threshold;

      setIsScrolled((prev) => {
        if (prev !== isOverThreshold) return isOverThreshold;
        return prev;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

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
    if (popularItems.length > 0) groups["Destaques"] = popularItems;

    filtered.forEach(item => {
      const categoryName = item.category || "Outros";
      if (!groups[categoryName]) groups[categoryName] = [];
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
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const translateCategory = (cat: string) => {
    if (!cat) return "Outros";
    return CATEGORY_TRANSLATIONS[cat] ||
           CATEGORY_TRANSLATIONS[cat.toLowerCase()] ||
           cat;
  };

  if (isStoreLoading || isProductsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-500 dark:text-slate-400 animate-pulse font-bold tracking-tight">Carregando cardápio...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50 dark:bg-slate-950">
        <AlertCircle className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Loja não encontrada</h1>
        <Link to="/"><Button>Voltar para o Início</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-sans transition-colors duration-300 antialiased tracking-tight">

      {/* Header Fixo */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm py-2"
          : "bg-transparent py-4"
      }`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className={`font-black text-lg transition-opacity duration-300 ${
              isScrolled ? "opacity-100 text-slate-900 dark:text-white" : "opacity-0"
            }`}>
              {store.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CartDrawer />
          </div>
        </div>
      </header>

      {/* Banner de Capa */}
      <div className="relative h-[22rem] md:h-[26rem] w-full mb-28 md:mb-20">
        <div className="absolute inset-0 overflow-hidden rounded-b-[2.5rem] shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10 pointer-events-none" />
          <img
            src={store.banner_url || "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&h=400&fit=crop"}
            alt="Capa"
            className="w-full h-full object-cover animate-scale-in"
          />
        </div>

        {/* Card de Perfil da Loja */}
        <div className="absolute -bottom-20 md:-bottom-12 left-0 right-0 z-20 px-4">
          <GlassCard className="container mx-auto max-w-4xl p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/40 dark:border-slate-800/40 shadow-2xl rounded-[2rem] !overflow-visible">

            <div className="flex items-center gap-4 w-full md:w-auto relative">
              {/* LOGO */}
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-[1.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-md flex-shrink-0 bg-white dark:bg-slate-800 relative z-30 -mt-12 md:mt-0">
                <img src={store.logo_url || "https://github.com/shadcn.png"} alt="Logo" className="w-full h-full object-cover" />
              </div>

              {/* NOME E DESCRIÇÃO MOBILE */}
              <div className="flex-1 min-w-0 md:hidden mt-1">
                <h1 className="text-xl font-black text-slate-900 dark:text-white truncate">{store.name}</h1>
                {store.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 italic font-medium break-words">
                    {store.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">

              {/* NOME E DESCRIÇÃO DESKTOP */}
              <div className="hidden md:block">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white truncate">{store.name}</h1>
                    {store.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 italic font-medium break-words">
                        {store.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* INFOS INFERIORES */}
              <div className="flex flex-col gap-4 mt-4 md:mt-6">

                {/* BLOCO 1: STATUS E HORÁRIO */}
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${isOpen ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                    {isOpen ? "Aberto agora" : "Loja Fechada"}
                  </div>

                  {hours?.opening_time && hours?.closing_time && (
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 opacity-60" />
                      {isOpen
                        ? `Hoje até às ${hours.closing_time.substring(0, 5)}`
                        : `Abrimos às ${hours.opening_time.substring(0, 5)}`}
                    </span>
                  )}
                </div>

                {/* BLOCO 2: ENDEREÇO (campos tipados corretamente, sem cast) */}
                {store.street && store.street !== "null" && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.street}, ${store.street_number ?? ""} - ${store.neighborhood ?? ""} ${store.city ?? ""}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl transition-all active:scale-[0.98]"
                  >
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm group-hover:shadow-md transition-all">
                      <MapPin className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight">Localização</span>
                      <span className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 leading-tight">
                        {store.street}, {store.street_number}
                        {store.neighborhood && ` - ${store.neighborhood}`}
                      </span>
                    </div>
                  </a>
                )}

                {/* BLOCO 3: BOTÕES DE CONVERSÃO */}
                <div className="flex items-center gap-3">
                  {store.phone && store.phone !== "null" && (
                    <a
                      href={`https://wa.me/55${store.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                    >
                      <Phone className="h-5 w-5" />
                      Pedir no WhatsApp
                    </a>
                  )}

                  {store.instagram && store.instagram !== "null" && (
                    <a
                      href={`https://instagram.com/${store.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 h-12 px-5 bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white font-black rounded-2xl text-xs uppercase shadow-lg shadow-pink-500/20 transition-all active:scale-95"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                </div>

              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Busca e Filtros */}
        <div className="sticky top-[60px] md:top-[70px] z-40 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 md:py-4 space-y-3 md:space-y-4 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="O que você procura hoje?"
              className="pl-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-white h-14 rounded-2xl shadow-sm font-medium focus-visible:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {!searchTerm && categories.length > 0 && (
            <Tabs value={activeCategory} onValueChange={scrollToCategory} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto bg-transparent p-0 h-auto gap-2 no-scrollbar py-2 snap-x">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-slate-400 px-6 py-3 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold shadow-sm whitespace-nowrap transition-all snap-start"
                  >
                    {translateCategory(cat)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Lista de Produtos */}
        <div className="mt-6 pb-20 space-y-12">
          {categories.length > 0 ? (
            categories.map((category) => (
              <div key={category} id={`category-${category}`} className="scroll-mt-52 animate-in fade-in duration-500">
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  {translateCategory(category)}
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full">
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
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-200">Nenhum item encontrado</h3>
              <p className="text-slate-500 font-medium mt-1">Tente buscar por outra palavra-chave.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
