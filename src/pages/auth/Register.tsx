import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard"; 
import { Store, Loader2, ArrowLeft, Mail, Lock, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await (supabase.auth as any).signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: "seller", // FORÇADO: Sempre cria como Lojista
          },
        },
      });

      if (error) throw error;
      toast.success("Conta criada com sucesso!");
      navigate("/payment");

    } catch (error: any) {
      console.error("Erro no registro:", error);
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/payment`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error("Erro ao conectar com Google");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-primary/20 relative overflow-hidden">
      
      {/* Background Effects (Invertidos em relação ao Login para dar dinamismo) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none -translate-x-1/4 translate-y-1/4" />

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link to="/" className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 font-medium bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white border border-transparent hover:border-slate-200">
            <ArrowLeft className="h-4 w-4" />
            Voltar
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 z-10 py-12">
        <GlassCard 
          intensity="light" 
          className="w-full max-w-lg p-10 border-white/60 bg-white/70 shadow-2xl backdrop-blur-xl rounded-[2rem]"
        >
          <div className="text-center mb-8">
            <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-900/20">
              <Store className="h-8 w-8 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Criar Conta Lojista</h1>
            <p className="text-slate-500 mt-2 text-base">
              Gerencie seu delivery com tecnologia de ponta.
            </p>
          </div>

          <div className="space-y-6">
             {/* Google Button */}
            <Button 
              type="button"
              onClick={handleGoogleSignup}
              variant="outline"
              className="w-full h-12 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center gap-2 bg-white shadow-sm"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Cadastrar com Google
            </Button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">Ou preencha</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 ml-1 text-xs uppercase font-bold tracking-wider">Nome do Responsável</Label>
                <div className="relative group">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <Input 
                        id="name" 
                        required 
                        value={formData.fullName} 
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                        className="pl-12 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-slate-900/10 rounded-xl transition-all shadow-sm"
                        placeholder="Ex: Eduardo Viana"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 ml-1 text-xs uppercase font-bold tracking-wider">E-mail Profissional</Label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <Input 
                        id="email" 
                        type="email" 
                        required 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        className="pl-12 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-slate-900/10 rounded-xl transition-all shadow-sm"
                        placeholder="loja@exemplo.com"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 ml-1 text-xs uppercase font-bold tracking-wider">Senha de Acesso</Label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <Input 
                        id="password" 
                        type="password" 
                        required 
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        className="pl-12 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-slate-900/10 rounded-xl transition-all shadow-sm"
                        placeholder="••••••••"
                    />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-base font-bold bg-slate-900 hover:bg-black text-white rounded-xl shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all mt-6" 
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Começar Agora Grátis"}
              </Button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
            <div className="flex gap-4 text-xs text-slate-500 font-medium">
               <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> 7 dias grátis</span>
               {/* Removido o item do cartão para ficar mais limpo */}
            </div>
            <p className="text-sm text-slate-500">
              Já tem uma conta?{" "}
              <Link to="/auth" className="text-slate-900 font-bold hover:underline">
                Fazer Login
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}