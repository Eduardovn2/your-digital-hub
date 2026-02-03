import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateStore } from "@/hooks/useStores";
import { Store, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const storeSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  slug: z.string().min(3, "O link deve ter pelo menos 3 caracteres").regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e traços"),
  description: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type StoreFormData = z.infer<typeof storeSchema>;

// CORREÇÃO: Agora aceita userId opcional
interface StoreSetupFormProps {
  userId?: string;
  onSuccess?: () => void;
}

export function StoreSetupForm({ userId, onSuccess }: StoreSetupFormProps) {
  const { mutate: createStore, isPending } = useCreateStore();
  
  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      phone: "",
      address: "",
    }
  });

  const onSubmit = (data: StoreFormData) => {
    if (!userId) return;

    createStore({
      owner_id: userId,
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      phone: data.phone || null,
      address: data.address || null,
      is_active: true,
      is_open: true,
      primary_color: "#ea580c",
      secondary_color: "#f97316",
      accent_color: "#fb923c",
      background_color: "#ffffff",
      text_color: "#0f172a",
      font_family: "Inter",
      layout_style: "modern",
      show_banner: true,
      show_categories: true,
      logo_url: null,
      banner_url: null,
      whatsapp: null
    }, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
      }
    });
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Dados da Loja</CardTitle>
        <CardDescription>Preencha as informações básicas para colocar seu delivery no ar.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Loja</Label>
              <div className="relative">
                <Store className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input id="name" placeholder="Ex: Viana Burguer" className="pl-9" {...form.register("name")} />
              </div>
              {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Link da Loja (Slug)</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400 text-sm font-medium">/</span>
                <Input id="slug" placeholder="viana-burguer" className="pl-6" {...form.register("slug")} />
              </div>
              <p className="text-[10px] text-slate-500">Seu site será: seusite.com/seu-link</p>
              {form.formState.errors.slug && <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição Curta</Label>
            <Textarea id="description" placeholder="O melhor hambúrguer da cidade..." {...form.register("description")} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input id="phone" placeholder="(00) 00000-0000" className="pl-9" {...form.register("phone")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input id="address" placeholder="Rua Exemplo, 123" className="pl-9" {...form.register("address")} />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isPending}>
            {isPending ? "Criando Loja..." : "Criar Loja e Começar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}