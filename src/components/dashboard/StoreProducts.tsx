import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProducts, useDeleteProduct, Product } from "@/hooks/useProducts";
import { StoreProductForm } from "./StoreProductForm";
import { 
  Loader2, Plus, Pencil, Trash2, Package, 
  UtensilsCrossed, Sparkles, Tag, DollarSign 
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

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingProduct(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-medium animate-pulse">Organizando seu cardápio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* CABEÇALHO GOURMETIZADO */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <UtensilsCrossed className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Seu Cardápio</h2>
            <p className="text-sm text-slate-500 font-medium">
              {products?.length || 0} produtos cadastrados
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowForm(true)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl px-6 h-12 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Produto
        </Button>
      </div>

      {!products || products.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Package className="h-10 w-10 text-slate-300" />
          </div>
          <div className="max-w-xs mx-auto">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Cardápio Vazio</h3>
            <p className="text-slate-500 text-sm mt-2 mb-6">
              Comece a vender adicionando seus melhores pratos e produtos.
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-indigo-600 rounded-xl font-bold">
              Adicionar Primeiro Produto
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 flex items-center gap-4 transition-all hover:shadow-2xl hover:shadow-indigo-100 dark:hover:shadow-none hover:-translate-y-1"
            >
              {/* IMAGEM DO PRODUTO */}
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border-2 border-white dark:border-slate-700 shadow-sm">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-3xl grayscale group-hover:grayscale-0 transition-all">
                    🍽️
                  </div>
                )}
              </div>

              {/* INFO DO PRODUTO */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-black text-slate-800 dark:text-white text-base md:text-lg truncate max-w-full">
                    {product.name}
                  </h3>
                  {product.popular && (
                    <Badge className="bg-amber-100 text-amber-700 border-none px-2 py-0 font-black text-[10px] uppercase tracking-tighter hover:bg-amber-100">
                      <Sparkles className="h-3 w-3 mr-1 fill-amber-500" /> Popular
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500 font-bold uppercase">
                    {product.category || "Geral"}
                  </Badge>
                </div>
                
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 break-words whitespace-normal line-clamp-2 font-medium mb-2">
                  {product.description || "Sem descrição disponível."}
                </p>
                
                <div className="flex items-center gap-1.5">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-lg">
                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm md:text-base">
                      R$ {Number(product.price).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              {/* AÇÕES */}
              <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0 ml-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(product)}
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
                        O produto <span className="text-slate-900 font-bold">"{product.name}"</span> será removido permanentemente do seu cardápio.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteProduct.mutate(product.id)}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                      >
                        Sim, excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
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