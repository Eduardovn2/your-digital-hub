import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateStore, useCheckSlugAvailable } from "@/hooks/useStores";
import { Loader2, Store, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface StoreSetupFormProps {
  onSuccess: () => void;
}

export function StoreSetupForm({ onSuccess }: StoreSetupFormProps) {
  const { user } = useAuth();
  const createStore = useCreateStore();
  const checkSlug = useCheckSlugAvailable();
  
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const handleSlugChange = async (value: string) => {
    const formatted = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    setSlug(formatted);
    
    if (formatted.length >= 3) {
      setSlugStatus('checking');
      try {
        const available = await checkSlug.mutateAsync(formatted);
        setSlugStatus(available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    } else {
      setSlugStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || slugStatus !== 'available') return;

    await createStore.mutateAsync({
      owner_id: user.id,
      name,
      slug,
      description: description || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      address: null,
      logo_url: null,
      banner_url: null,
      primary_color: '#f97316',
      secondary_color: '#ea580c',
      accent_color: '#fed7aa',
      background_color: '#ffffff',
      text_color: '#1f2937',
      font_family: 'Inter',
      layout_style: 'grid',
      show_banner: true,
      show_categories: true,
      is_active: true,
      is_open: true,
    });
    
    onSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Crie sua Loja</h1>
          <p className="text-muted-foreground mt-2">
            Configure sua loja em poucos passos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-xl border">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Loja *</Label>
            <Input
              id="name"
              placeholder="Ex: Pizzaria do João"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Endereço da Loja *</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">/</span>
              <Input
                id="slug"
                placeholder="minha-loja"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                required
                minLength={3}
              />
              {slugStatus === 'checking' && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {slugStatus === 'available' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {slugStatus === 'taken' && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            {slugStatus === 'taken' && (
              <p className="text-sm text-red-500">Este endereço já está em uso</p>
            )}
            {slugStatus === 'available' && (
              <p className="text-sm text-green-600">Disponível!</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Fale um pouco sobre sua loja..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                placeholder="(11) 99999-9999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={createStore.isPending || slugStatus !== 'available' || !name}
          >
            {createStore.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Loja"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
