import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProducts, useDeleteProduct, Product } from "@/hooks/useProducts";
import { StoreProductForm } from "./StoreProductForm";
import { Loader2, Plus, Pencil, Trash2, Package } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

return (
    <div className="space-y-4">
      {/* Adicionado flex-wrap e gap-4 para não estourar a tela no mobile */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Produtos ({products?.length || 0})</h2>
        <Button onClick={() => setShowForm(true)} className="bg-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {!products || products.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-xl">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhum produto ainda</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Adicione produtos ao seu cardápio
          </p>
          <Button onClick={() => setShowForm(true)} className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeiro Produto
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-card border rounded-xl p-4 flex items-center gap-4"
            >
              <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-2xl">
                    🍽️
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  {product.popular && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {product.description || "Sem descrição"}
                </p>
                <p className="text-sm font-semibold text-primary mt-1">
                  R$ {Number(product.price).toFixed(2).replace('.', ',')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(product)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O produto "{product.name}" será removido permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteProduct.mutate(product.id)}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Excluir
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
