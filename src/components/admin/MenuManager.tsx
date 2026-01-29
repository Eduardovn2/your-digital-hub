import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

interface MenuManagerProps {
  storeId: string;
}

export default function MenuManager({ storeId }: MenuManagerProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: "", 
    description: "", 
    price: "", 
    image_url: "" 
  });

  // 1. Buscar Produtos do Banco
  const { data: products } = useQuery({
    queryKey: ["products", storeId],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("store_id", storeId);
      return data || [];
    },
  });

  // 2. Lógica de Upload de Imagem (PNG/JPG)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${storeId}/${fileName}`;

      // Upload para o bucket 'product-images'
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success("Imagem carregada!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Criar Produto
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return toast.warning("Aguarde o upload da imagem");

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
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar produto");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Deletar Produto
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
        <h2 className="text-xl font-bold text-gray-800">Cardápio</h2>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Produto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Item ao Cardápio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="space-y-2">
                <Label>Foto do Produto (PNG/JPG)</Label>
                <div className="flex flex-col gap-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="cursor-pointer"
                  />
                  {isUploading && <p className="text-xs text-orange-500 animate-pulse">Fazendo upload...</p>}
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" className="h-20 w-20 object-cover rounded-md border" />
                  )}
                </div>
              </div>
              
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

              <Button type="submit" className="w-full" disabled={isLoading || isUploading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Salvar Produto"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products?.map((product) => (
          <Card key={product.id} className="relative group overflow-hidden">
            {product.image_url && (
              <div className="h-40 w-full overflow-hidden border-b">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-start text-base">
                {product.name}
                <span className="text-green-600 font-bold">R$ {product.price.toFixed(2)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">{product.description}</p>
              <div className="mt-4 flex justify-end">
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(product.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {products?.length === 0 && (
          <div className="col-span-full border-2 border-dashed rounded-xl py-12 text-center text-muted-foreground">
            Seu cardápio ainda não tem itens.
          </div>
        )}
      </div>
    </div>
  );
}