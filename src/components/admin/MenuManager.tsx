import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

interface MenuManagerProps {
  storeId: string;
}

export default function MenuManager({ storeId }: MenuManagerProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", price: "", image_url: "" });
  const [isLoading, setIsLoading] = useState(false);

  // 1. Buscar Produtos
  const { data: products } = useQuery({
    queryKey: ["products", storeId],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("store_id", storeId);
      return data || [];
    },
  });

  // 2. Criar Produto
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.from("products").insert({
        store_id: storeId,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price.replace(',', '.')),
        image_url: formData.image_url || null,
      });

      if (error) throw error;
      toast.success("Produto adicionado!");
      setIsOpen(false);
      setFormData({ name: "", description: "", price: "", image_url: "" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      toast.error("Erro ao criar produto");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Deletar Produto
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      toast.success("Produto removido");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Cardápio</h2>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Produto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Item ao Cardápio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Produto</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: X-Bacon" />
              </div>
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ingredientes, detalhes..." />
              </div>
              <div className="space-y-2">
                <Label>URL da Imagem (Opcional)</Label>
                <Input value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Salvar Produto"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products?.map((product) => (
          <Card key={product.id} className="relative group">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-start text-base">
                {product.name}
                <span className="text-green-600">R$ {product.price}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
              <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(product.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {products?.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">Seu cardápio está vazio. Adicione o primeiro item!</p>}
      </div>
    </div>
  );
}