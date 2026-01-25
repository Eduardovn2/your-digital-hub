import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateStore, useUploadStoreAsset } from "@/hooks/useStores";
import { Store } from "@/types/store";
import { Loader2, Upload, Eye, Palette, MapPin, Clock, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { DeliveryZonesSettings } from "./DeliveryZonesSettings";
import { StoreHoursSettings } from "./StoreHoursSettings";
import { PrinterSettings as PrinterSettingsComponent } from "./PrinterSettings";

interface StoreSettingsProps {
  store: Store;
}

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Moderno)' },
  { value: 'Poppins', label: 'Poppins (Amigável)' },
  { value: 'Roboto', label: 'Roboto (Limpo)' },
  { value: 'Playfair Display', label: 'Playfair (Elegante)' },
  { value: 'Montserrat', label: 'Montserrat (Profissional)' },
];

const LAYOUT_OPTIONS = [
  { value: 'grid', label: 'Grade (padrão)' },
  { value: 'list', label: 'Lista' },
  { value: 'compact', label: 'Compacto' },
];

export function StoreSettings({ store }: StoreSettingsProps) {
  const updateStore = useUpdateStore();
  const uploadAsset = useUploadStoreAsset();
  
  const [formData, setFormData] = useState({
    name: store.name,
    description: store.description || "",
    phone: store.phone || "",
    whatsapp: store.whatsapp || "",
    address: store.address || "",
    primary_color: store.primary_color,
    secondary_color: store.secondary_color,
    accent_color: store.accent_color,
    background_color: store.background_color,
    text_color: store.text_color,
    font_family: store.font_family,
    layout_style: store.layout_style,
    show_banner: store.show_banner,
    show_categories: store.show_categories,
    is_open: store.is_open,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadAsset.mutateAsync({ file, type });
    await updateStore.mutateAsync({
      id: store.id,
      updates: { [type === 'logo' ? 'logo_url' : 'banner_url']: url }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateStore.mutateAsync({
      id: store.id,
      updates: formData
    });
  };

  return (
    <div className="space-y-6">
      {/* Header com link para visualizar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Configurações da Loja</h2>
        <Link to={`/${store.slug}`} target="_blank">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Ver Loja
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="general" className="flex items-center gap-1">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Entrega</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Horário</span>
          </TabsTrigger>
          <TabsTrigger value="printer" className="flex items-center gap-1">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Impressão</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informações Básicas */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h3 className="font-medium text-lg">Informações Básicas</h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Loja</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input value={`/${store.slug}`} disabled className="bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input
                value={formData.whatsapp}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço Físico</Label>
              <Input
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Imagens */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h3 className="font-medium text-lg">Imagens</h3>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {store.logo_url ? (
                  <img src={store.logo_url} alt="Logo" className="h-20 mx-auto mb-2 object-contain" />
                ) : (
                  <div className="h-20 flex items-center justify-center text-muted-foreground">
                    Sem logo
                  </div>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadAsset.isPending ? "Enviando..." : "Enviar Logo"}
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Banner</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {store.banner_url ? (
                  <img src={store.banner_url} alt="Banner" className="h-20 mx-auto mb-2 object-cover rounded" />
                ) : (
                  <div className="h-20 flex items-center justify-center text-muted-foreground">
                    Sem banner
                  </div>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'banner')}
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadAsset.isPending ? "Enviando..." : "Enviar Banner"}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Personalização Visual */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h3 className="font-medium text-lg">Personalização Visual</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Cor Principal</Label>
              <Input
                type="color"
                value={formData.primary_color}
                onChange={(e) => handleChange("primary_color", e.target.value)}
                className="h-10 p-1"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor Secundária</Label>
              <Input
                type="color"
                value={formData.secondary_color}
                onChange={(e) => handleChange("secondary_color", e.target.value)}
                className="h-10 p-1"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor de Destaque</Label>
              <Input
                type="color"
                value={formData.accent_color}
                onChange={(e) => handleChange("accent_color", e.target.value)}
                className="h-10 p-1"
              />
            </div>
            <div className="space-y-2">
              <Label>Fundo</Label>
              <Input
                type="color"
                value={formData.background_color}
                onChange={(e) => handleChange("background_color", e.target.value)}
                className="h-10 p-1"
              />
            </div>
            <div className="space-y-2">
              <Label>Texto</Label>
              <Input
                type="color"
                value={formData.text_color}
                onChange={(e) => handleChange("text_color", e.target.value)}
                className="h-10 p-1"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fonte</Label>
              <Select value={formData.font_family} onValueChange={(v) => handleChange("font_family", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map(font => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Layout do Cardápio</Label>
              <Select value={formData.layout_style} onValueChange={(v) => handleChange("layout_style", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAYOUT_OPTIONS.map(layout => (
                    <SelectItem key={layout.value} value={layout.value}>
                      {layout.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.show_banner}
                onCheckedChange={(v) => handleChange("show_banner", v)}
              />
              <Label>Exibir Banner</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.show_categories}
                onCheckedChange={(v) => handleChange("show_categories", v)}
              />
              <Label>Exibir Categorias</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_open}
                onCheckedChange={(v) => handleChange("is_open", v)}
              />
              <Label>Loja Aberta</Label>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
          disabled={updateStore.isPending}
        >
          {updateStore.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Alterações"
          )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="delivery">
          <div className="bg-card border rounded-xl p-6">
            <DeliveryZonesSettings storeId={store.id} />
          </div>
        </TabsContent>

        <TabsContent value="hours">
          <div className="bg-card border rounded-xl p-6">
            <StoreHoursSettings storeId={store.id} />
          </div>
        </TabsContent>

        <TabsContent value="printer">
          <div className="bg-card border rounded-xl p-6">
            <PrinterSettingsComponent storeId={store.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
