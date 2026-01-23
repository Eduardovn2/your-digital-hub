import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, Star, Loader2 } from "lucide-react";
import { Product, useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, ProductInsert } from "@/hooks/useProducts";
import { ProductForm } from "./ProductForm";
import { categories } from "@/data/menuData";

export function ProductList() {
  const { data: products, isLoading, error } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleCreate = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: ProductInsert) => {
    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, updates: data });
    } else {
      await createProduct.mutateAsync(data);
    }
    setFormOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id: string) => {
    await deleteProduct.mutateAsync(id);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || categoryId;
  };

  const getCategoryIcon = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.icon || "🍽️";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-food-orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Erro ao carregar produtos.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Produtos</h2>
          <p className="text-sm text-muted-foreground">
            {products?.length || 0} {products?.length === 1 ? "item" : "itens"} no catálogo
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-food-orange hover:bg-food-red"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Product Grid */}
      {products && products.length > 0 ? (
        <div className="grid gap-4">
          {products.map((product) => (
            <Card key={product.id} className="p-4">
              <div className="flex gap-4">
                {/* Image */}
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-accent flex-shrink-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      {getCategoryIcon(product.category)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground truncate">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description || "Sem descrição"}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
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
                              onClick={() => handleDelete(product.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">
                      {getCategoryIcon(product.category)} {getCategoryName(product.category)}
                    </Badge>
                    {product.popular && (
                      <Badge className="bg-food-yellow text-foreground">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Popular
                      </Badge>
                    )}
                    <span className="ml-auto font-bold text-food-orange">
                      R$ {Number(product.price).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground mb-4">
            Nenhum produto cadastrado ainda.
          </p>
          <Button
            onClick={handleCreate}
            className="bg-food-orange hover:bg-food-red"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Produto
          </Button>
        </div>
      )}

      {/* Form Dialog */}
      <ProductForm
        product={editingProduct}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleFormSubmit}
        isLoading={createProduct.isPending || updateProduct.isPending}
      />
    </div>
  );
}
