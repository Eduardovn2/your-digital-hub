import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateProduct, useUpdateProduct, useUploadProductImage, Product, ProductInsert } from "@/hooks/useProducts";
import { Loader2, Upload, X, Plus, Trash2, Layers } from "lucide-react";

interface StoreProductFormProps {
  storeId: string;
  product?: Product;
  onClose: () => void;
}

const CATEGORIES = [
  { value: "Hambúrgueres", label: "🍔 Hambúrgueres" },
  { value: "Pizzas", label: "🍕 Pizzas" },
  { value: "Bebidas", label: "🥤 Bebidas" },
  { value: "Sobremesas", label: "🍰 Sobremesas" },
  { value: "Acompanhamentos", label: "🍟 Acompanhamentos" },
  { value: "Combos", label: "🎁 Combos" },
  { value: "Saladas", label: "🥗 Saladas" },
  { value: "Massas", label: "🍝 Massas" },
  { value: "Japonês", label: "🍣 Japonês" },
  { value: "Outros", label: "📦 Outros" },
];

export function StoreProductForm({ storeId, product, onClose }: StoreProductFormProps) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const uploadImage = useUploadProductImage();
  
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    category: product?.category || "Hambúrgueres",
    popular: product?.popular || false,
    image_url: product?.image_url || "",
  });

  // ESTADO DOS COMPLEMENTOS
  const [complements, setComplements] = useState<any[]>(product?.complements || []);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage.mutateAsync(file);
    setFormData(prev => ({ ...prev, image_url: url }));
  };

  // --- FUNÇÕES DO CONSTRUTOR DE COMPLEMENTOS ---
// --- FUNÇÕES DO CONSTRUTOR DE COMPLEMENTOS ---
  const addGroup = () => {
    setComplements([...complements, { 
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), 
      name: "", 
      isRequired: false, 
      min: 0, 
      max: 1, 
      items: [] 
    }]);
  };

  const updateGroup = (index: number, field: string, value: any) => {
    const newComps = [...complements];
    newComps[index] = { ...newComps[index], [field]: value };
    setComplements(newComps);
  };

  const removeGroup = (index: number) => {
    setComplements(complements.filter((_, i) => i !== index));
  };

  const addItem = (groupIndex: number) => {
    // Usamos o .map para criar uma nova referência de memória, forçando o ecrã a atualizar!
    setComplements(complements.map((group, index) => {
      if (index === groupIndex) {
        return {
          ...group,
          items: [
            ...group.items,
            { 
              id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), 
              name: "", 
              price: "" 
            }
          ]
        };
      }
      return group;
    }));
  };

  const updateItem = (groupIndex: number, itemIndex: number, field: string, value: string) => {
    setComplements(complements.map((group, gIdx) => {
      if (gIdx === groupIndex) {
        return {
          ...group,
          items: group.items.map((item: any, iIdx: number) => {
            if (iIdx === itemIndex) {
              return { ...item, [field]: value };
            }
            return item;
          })
        };
      }
      return group;
    }));
  };

  const removeItem = (groupIndex: number, itemIndex: number) => {
    setComplements(complements.map((group, gIdx) => {
      if (gIdx === groupIndex) {
        return {
          ...group,
          items: group.items.filter((_: any, iIdx: number) => iIdx !== itemIndex)
        };
      }
      return group;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converte os preços dos itens de string para número antes de salvar
    const formattedComplements = complements.map(group => ({
      ...group,
      items: group.items.map((item: any) => ({
        ...item,
        price: parseFloat(item.price.toString().replace(',', '.')) || 0
      }))
    }));

    const data: any = { // Utilizamos any momentaneamente para compatibilidade com o hook atual
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price.toString().replace(',', '.')),
      category: formData.category,
      popular: formData.popular,
      image_url: formData.image_url || null,
      store_id: storeId,
      complements: formattedComplements // NOVO CAMPO
    };

    if (product) {
      await updateProduct.mutateAsync({ id: product.id, updates: data });
    } else {
      await createProduct.mutateAsync(data);
    }
    
    onClose();
  };

  const isLoading = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-950 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-500" />
            {product ? "Editar Produto" : "Novo Produto"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form id="product-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* DADOS BÁSICOS */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold">Nome do Produto *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Ex: X-Burger Especial"
                  className="bg-slate-50 dark:bg-slate-900"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Descreva os ingredientes principais..."
                  className="bg-slate-50 dark:bg-slate-900 resize-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Preço Base *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    placeholder="0.00"
                    className="bg-slate-50 dark:bg-slate-900"
                    required
                  />
                </div>
                {/* CAMPO DE CATEGORIA LIVRE E OBRIGATÓRIA */}
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-1">
                    Categoria <span className="text-red-500">*</span>
                  </Label>
                  
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    placeholder="Ex: Hambúrgueres, Promoção..."
                    required
                    list="category-suggestions"
                    className="bg-slate-50 dark:bg-slate-900 w-full"
                  />
                  
                  {/* Datalist cria as sugestões automáticas baseadas no seu array CATEGORIES */}
                  <datalist id="category-suggestions">
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value} />
                    ))}
                  </datalist>
                  
                  <p className="text-[10px] text-slate-500 font-medium">
                    Escolha da lista ou digite um novo nome.
                  </p>
                </div>
              </div>
            </div>

            {/* IMAGEM E POPULAR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <Label className="font-bold">Foto do Produto</Label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                  {formData.image_url ? (
                    <div className="relative">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="h-24 mx-auto object-cover rounded-lg shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg"
                        onClick={() => handleChange("image_url", "")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block h-24 flex flex-col items-center justify-center">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      {uploadImage.isPending ? (
                        <Loader2 className="h-6 w-6 mx-auto animate-spin text-indigo-500" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 mx-auto text-slate-400 mb-2" />
                          <span className="text-xs font-semibold text-slate-500">Enviar Imagem</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-6">
                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  <Switch
                    checked={formData.popular}
                    onCheckedChange={(v) => handleChange("popular", v)}
                  />
                  <div>
                    <Label className="font-bold text-amber-900 dark:text-amber-500">Destaque</Label>
                    <p className="text-[10px] text-amber-700/70 dark:text-amber-500/70">Aparecer no topo da loja</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO DE COMPLEMENTOS (NOVO) */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <Label className="text-sm font-black text-slate-800 dark:text-slate-200">Complementos e Adicionais</Label>
                  <p className="text-[10px] text-slate-500 font-medium">Ofereça extras (Ex: Bacon, Escolha o Ponto da Carne)</p>
                </div>
                <Button type="button" size="sm" onClick={addGroup} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-9">
                  <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Novo Grupo</span>
                </Button>
              </div>

              <div className="space-y-4">
                {complements.map((group, gIndex) => (
                  <div key={group.id} className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                    
                    {/* Cabeçalho do Grupo */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome do Grupo (Ex: Escolha seu Recheio)</Label>
                          <Input 
                            value={group.name} 
                            onChange={e => updateGroup(gIndex, 'name', e.target.value)} 
                            placeholder="Ex: Adicionais Pagos" 
                            className="h-9 bg-white dark:bg-slate-950 font-semibold"
                          />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="mt-6 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg" onClick={() => removeGroup(gIndex)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col justify-center space-y-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Switch checked={group.isRequired} onCheckedChange={v => updateGroup(gIndex, 'isRequired', v)} className="scale-75 origin-left" />
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Obrigatório</Label>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mínimo</Label>
                          <Input type="number" min="0" value={group.min} onChange={e => updateGroup(gIndex, 'min', parseInt(e.target.value) || 0)} className="h-8 text-xs text-center font-bold" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Máximo</Label>
                          <Input type="number" min="1" value={group.max} onChange={e => updateGroup(gIndex, 'max', parseInt(e.target.value) || 1)} className="h-8 text-xs text-center font-bold" />
                        </div>
                      </div>
                    </div>

                    {/* Itens do Grupo */}
                    <div className="p-4 space-y-3">
                      {group.items.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-2 italic">Nenhuma opção adicionada ainda.</p>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2 px-1">
                            <Label className="flex-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome do Item</Label>
                            <Label className="w-24 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preço (+)</Label>
                            <div className="w-8"></div>
                          </div>
                          {group.items.map((item: any, iIndex: number) => (
                            <div key={item.id} className="flex gap-2 items-center group">
                              <Input 
                                className="flex-1 h-9 text-sm font-medium" 
                                placeholder="Ex: Bacon" 
                                value={item.name} 
                                onChange={e => updateItem(gIndex, iIndex, 'name', e.target.value)} 
                              />
                              <Input 
                                className="w-24 h-9 text-sm text-emerald-600 dark:text-emerald-400 font-bold" 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                value={item.price} 
                                onChange={e => updateItem(gIndex, iIndex, 'price', e.target.value)} 
                              />
                              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-red-500" onClick={() => removeItem(gIndex, iIndex)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <Button type="button" variant="outline" size="sm" className="w-full mt-2 h-9 border-dashed text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" onClick={() => addItem(gIndex)}>
                        <Plus className="h-3 w-3 mr-2" /> Adicionar Opção
                      </Button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </form>
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold">
            Cancelar
          </Button>
          <Button type="submit" form="product-form" className="flex-1 h-12 rounded-xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : product ? (
              "Salvar Alterações"
            ) : (
              "Criar Produto"
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}