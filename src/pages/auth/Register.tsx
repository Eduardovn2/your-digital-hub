import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Store, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<"customer" | "seller">("customer");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // CORREÇÃO: Adicionamos (supabase.auth as any) para ignorar o erro de tipo
      const { data, error } = await (supabase.auth as any).signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: userType, // Salva se é 'customer' ou 'seller'
          },
        },
      });

      if (error) throw error;
      toast.success("Conta criada com sucesso!");

      // Redirecionamento inteligente
      if (userType === "seller") {
        navigate("/payment");
      } else {
        navigate("/");
      }

    } catch (error: any) {
      console.error("Erro no registro:", error);
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Crie sua conta</CardTitle>
          <CardDescription>Escolha como você deseja usar o VianaEcommerce</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="customer" onValueChange={(v) => setUserType(v as "customer" | "seller")} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer" className="flex gap-2"><ShoppingBag className="h-4 w-4" /> Sou Cliente</TabsTrigger>
              <TabsTrigger value="seller" className="flex gap-2"><Store className="h-4 w-4" /> Sou Lojista</TabsTrigger>
            </TabsList>
          </Tabs>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {userType === "seller" ? "Continuar para Pagamento" : "Criar Conta Grátis"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">Já tem uma conta? <Link to="/auth" className="text-primary hover:underline">Fazer Login</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}