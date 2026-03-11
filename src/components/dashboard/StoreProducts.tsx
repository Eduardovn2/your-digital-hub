import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useProducts, useDeleteProduct, Product } from "@/hooks/useProducts";
import { StoreProductForm } from "./StoreProductForm";
import { 
  Loader2, Plus, Pencil, Trash2, Package, 
  UtensilsCrossed, Sparkles, ChevronDown, ChevronRight,
  FolderOpen
} from "lucide-react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface StoreProductsProps {
  storeId: string;
}

export function StoreProducts({ storeId }: StoreProductsProps) {
  const { data: products, isLoading } = useProducts(storeId);
  const deleteProduct = useDeleteProduct();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingProduct(undefined);
  };

  const groupedProducts = useMemo(() => {
    if (!products) return {};
    
    const groups: Record<string, Product[]> = {};
    const uncategorized: Product[] = [];
    
    products.forEach(product => {
      const category = product.category?.trim() || '';
      if (category === '') {
        uncategorized.push(product);
      } else if (!groups[category]) {
        groups[category] = [product];
      } else {
        groups[category].push(product);
      }
    });
    
    if (uncategorized.length > 0) {
      groups['__uncategorized__'] = uncategorized;
    }
    
    return groups;
  }, [products]);

  const categories = useMemo(() => {
    return Object.keys(groupedProducts).sort((a, b) => {
      if (a === '__uncategorized__') return 1;
      if (b === '__uncategorized__') return -1;
      return a.localeCompare(b);
    });
  }, [groupedProducts]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(categories));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-medium animate-pulse">Organizando seu cardapio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <UtensilsCrossed className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Seu Cardapio</h2>
            <p className="text-sm text-slate-500 font-medium">
              {products?.length || 0} produtos em {categories.length} {categories.length === 1 ? 'categoria' : 'categorias'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {categories.length > 1 && (
            <Button 
              variant="outline"
              onClick={expandAll}
              className="rounded-xl font-bold border-slate-200 hover:bg-slate-50"
            >
              <ChevronDown className="h-4 w-4 mr-1" />
              Expandir Tudo
            </Button>
          )}
          <Button 
            onClick={() => setShowForm(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl px-6 h-12 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {!products || products.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Package className="h-10 w-10 text-slate-300" />
          </div>
          <div className="max-w-xs mx-auto">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Cardapio Vazio</h3>
            <p className="text-slate-500 text-sm mt-2 mb-6">
              Comece a vender adicionando seus melhores pratos e produtos.
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-indigo-600 rounded-xl font-bold">
              Adicionar Primeiro Produto
            </Button>
          </div>
        </div>
      ) : categories.length === 1 ? (
        <div className="grid gap-4">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onEdit={handleEdit} 
              onDelete={(id) => deleteProduct.mutate(id)} 
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const isExpanded = expandedCategories.has(category);
            const categoryProducts = groupedProducts[category];
            const displayName = category === '__uncategorized__' ? 'Sem Categoria' : category;
            const isUncategorized = category === '__uncategorized__';
            
            return (
              <div 
                key={category}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden"
              >
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 hover:from-indigo-50 hover:to-white dark:hover:from-indigo-950/30 dark:hover:to-slate-900 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isUncategorized ? 'bg-slate-200 dark:bg-slate-700' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
                      <FolderOpen className={`h-5 w-5 ${isUncategorized ? 'text-slate-500' : 'text-indigo-600 dark:text-indigo-400'}`} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-lg text-slate-800 dark:text-white">
                        {displayName}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {categoryProducts.length} {categoryProducts.length === 1 ? 'produto' : 'produtos'}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="grid gap-4 p-5 pt-0">
                    {categoryProducts.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onEdit={handleEdit} 
                        onDelete={(id) => deleteProduct.mutate(id)}
                        compact 
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <StoreProductForm
          storeId={storeId}
          product={editingProduct}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

function ProductCard({ 
  product, 
  onEdit, 
  onDelete,
  compact = false 
}: { 
  product: Product; 
  onEdit: (p: Product) => void; 
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 flex items-center gap-4 transition-all hover:shadow-2xl hover:shadow-indigo-100 dark:hover:shadow-none hover:-translate-y-1 ${compact ? 'rounded-2xl' : ''}`}
    >
      <div className={`${compact ? 'h-16 w-16' : 'h-20 w-20 md:h-24 md:w-24'} rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border-2 border-white dark:border-slate-700 shadow-sm`}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all">
            🍽️
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-black text-slate-800 dark:text-white text-base truncate max-w-full">
            {product.name}
          </h3>
          {product.popular && (
            <Badge className="bg-amber-100 text-amber-700 border-none px-2 py-0 font-black text-[10px] uppercase tracking-tighter hover:bg-amber-100">
              <Sparkles className="h-3 w-3 mr-1 fill-amber-500" /> Popular
            </Badge>
          )}
          {!compact && (
            <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500 font-bold uppercase">
              {product.category || "Geral"}
            </Badge>
          )}
        </div>
        
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 break-words whitespace-normal line-clamp-2 font-medium mb-2">
          {product.description || "Sem descricao disponivel."}
        </p>
        
        <div className="flex items-center gap-1.5">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-lg">
            <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm md:text-base">
              R$ {Number(product.price).toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0 ml-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onEdit(product)}
          className="rounded-xl border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-xl border-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-[2rem]">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-black">Excluir produto?</AlertDialogTitle>
              <AlertDialogDescription className="font-medium">
                O produto <span className="text-slate-900 font-bold">"{product.name}"</span> sera removido permanentemente do seu cardapio.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(product.id)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
              >
                Sim, excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
