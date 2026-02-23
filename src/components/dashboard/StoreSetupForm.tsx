import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateStore } from "@/hooks/useStores";
import { Store, MapPin, Phone, Loader2, AlertCircle } from "lucide-react"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query"; 
import { formatPhone } from "@/lib/utils"; 

// SCHEMA DE VALIDAÇÃO
const storeSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  slug: z.string().min(3, "O link deve ter pelo menos 3 caracteres").regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e traços"),
  description: z.string().optional(),
  
  phone: z.string()
    .transform(val => val.replace(/\D/g, ""))
    .refine(val => val.length === 11, {
        message: "O número precisa ter DDD (2 dígitos) + 9 dígitos. Ex: (11) 91234-5678"
    }),

  zip_code: z.string().min(8, "CEP inválido"),
  address_number: z.string().min(1, "Número obrigatório"),
  address_street: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
});

type StoreFormData = z.infer<typeof storeSchema>;

interface StoreSetupFormProps {
  userId?: string;
  onSuccess?: () => void;
}

export function StoreSetupForm({ userId, onSuccess }: StoreSetupFormProps) {
  const queryClient = useQueryClient(); 
  const { mutate: createStore, isPending } = useCreateStore();
  const [loadingCep, setLoadingCep] = useState(false);
  
  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      phone: "",
      zip_code: "",
      address_number: "",
      address_street: "",
      address_neighborhood: "",
      address_city: ""
    }
  });

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
        if (res.ok) {
          const data = await res.json();
          form.setValue("address_street", data.street);
          form.setValue("address_neighborhood", data.neighborhood);
          form.setValue("address_city", data.city);
          toast.success("Endereço encontrado!");
        }
      } catch (error) {
        // Silent error
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const onSubmit = (data: StoreFormData) => {
    if (!userId) return;
    
    const fullAddress = `${data.address_street}, ${data.address_number} - ${data.address_neighborhood}, ${data.address_city}`;

    createStore({
      owner_id: userId,
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      phone: data.phone,
      zip_code: data.zip_code.replace(/\D/g, ""), 
      street: data.address_street,
      street_number: data.address_number,
      neighborhood: data.address_neighborhood,
      city: data.address_city,
      address: fullAddress, 
      
      // --- NOVA LÓGICA: Loja nasce bloqueada esperando pagamento ---
      status: 'pending',
      expires_at: null, // Não tem data de validade ainda
      is_active: false, // Só fica ativo quando pagar
      
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
    } as any, { 
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["my-store"] });
        await queryClient.refetchQueries({ queryKey: ["my-store"] });
        
        // Mensagem atualizada focando no próximo passo (pagamento)
        toast.success("Loja criada! Libere seu acesso para começar.");
        
        if (onSuccess) {
            onSuccess();
        } else {
            window.location.href = "/admin";
        }
      },
      onError: (error) => {
        if (error.message.includes("duplicate key") || error.message.includes("slug")) {
             toast.success("Loja recuperada! Redirecionando...");
             window.location.href = "/admin";
        } else {
             toast.error("Erro ao criar loja: " + error.message);
        }
      }
    });
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 text-center md:text-left">
        <CardTitle className="text-xl md:text-2xl">Dados da Loja</CardTitle>
        <CardDescription>Crie sua loja agora. Pague e ganhe +15 dias de garantia incondicional.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Loja</Label>
              <div className="relative group">
                <Store className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                <Input id="name" placeholder="Ex: Viana Burguer" className="pl-9 h-11" {...form.register("name")} />
              </div>
              {form.formState.errors.name && <p className="text-xs text-red-500 font-medium">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Link da Loja (Slug)</Label>
              <div className="relative group">
                <span className="absolute left-3 top-3 text-slate-400 text-sm font-medium">/</span>
                <Input id="slug" placeholder="viana-burguer" className="pl-6 h-11" {...form.register("slug")} />
              </div>
              <p className="text-[10px] text-slate-500">Seu site será: seusite.com/seu-link</p>
              {form.formState.errors.slug && <p className="text-xs text-red-500 font-medium">{form.formState.errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição Curta</Label>
            <Textarea id="description" placeholder="O melhor hambúrguer da cidade..." className="resize-none min-h-[80px]" {...form.register("description")} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp (com DDD)</Label>
              <div className="relative group">
                <Phone className={`absolute left-3 top-3 h-4 w-4 ${form.formState.errors.phone ? "text-red-400" : "text-slate-400"} group-focus-within:text-slate-800 transition-colors`} />
                <Input 
                  id="phone" 
                  placeholder="(11) 99999-9999" 
                  className={`pl-9 h-11 ${form.formState.errors.phone ? "border-red-300 focus-visible:ring-red-200" : ""}`}
                  maxLength={15} 
                  {...form.register("phone", {
                    onChange: (e) => {
                      e.target.value = formatPhone(e.target.value);
                    }
                  })} 
                />
              </div>
              
              {form.formState.errors.phone ? (
                 <p className="text-xs font-bold text-red-500 flex items-center gap-1 animate-pulse">
                   <AlertCircle className="h-3 w-3" />
                   {form.formState.errors.phone.message}
                 </p>
              ) : (
                 <p className="text-[11px] text-slate-500 font-medium">
                   Obrigatório: DDD + 9 dígitos. Ex: (21) 91234-5678
                 </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP da Loja</Label>
              <div className="relative group">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                <Input 
                  id="zip_code" 
                  placeholder="00000-000" 
                  className="pl-9 h-11" 
                  {...form.register("zip_code")} 
                  onBlur={handleCepBlur}
                  maxLength={9}
                />
                {loadingCep && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />}
              </div>
              {form.formState.errors.zip_code && <p className="text-xs text-red-500 font-medium">{form.formState.errors.zip_code.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
             <div className="space-y-2 col-span-2">
                <Label>Rua</Label>
                <Input {...form.register("address_street")} placeholder="Rua..." className="h-11"/>
             </div>
             <div className="space-y-2">
                <Label>Número</Label>
                <Input {...form.register("address_number")} placeholder="123" className="h-11"/>
                {form.formState.errors.address_number && <p className="text-xs text-red-500 font-medium">Obrigatório</p>}
             </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
             <div className="space-y-2">
                <Label>Bairro</Label>
                <Input {...form.register("address_neighborhood")} placeholder="Bairro" className="h-11"/>
             </div>
             <div className="space-y-2">
                <Label>Cidade</Label>
                <Input {...form.register("address_city")} placeholder="Cidade" className="h-11"/>
             </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg transition-transform active:scale-[0.98]" disabled={isPending}>
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processando...
                </>
            ) : "Continuar para Pagamento 🔒"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}