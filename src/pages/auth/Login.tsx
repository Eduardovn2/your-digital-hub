import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard"; 
import { toast } from "sonner";
import { Loader2, Store, Lock, Mail, ArrowLeft } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`,
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      
      const role = data.user?.user_metadata?.role;
      if (role === 'seller') {
        navigate("/admin");
      } else {
        // Se por acaso um cliente antigo logar, manda pra home
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-primary/20 relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none translate-x-1/3 translate-y-1/3" />

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link to="/" className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 font-medium bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white border border-transparent hover:border-slate-200">
            <ArrowLeft className="h-4 w-4" />
            Voltar
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 z-10">
        <GlassCard 
          intensity="light" 
          className="w-full max-w-md p-8 border-white/60 bg-white/70 shadow-2xl backdrop-blur-xl rounded-[2rem]"
        >
          <div className="text-center mb-8">
            <div className="bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-slate-900/20">
              <Store className="h-7 w-7 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Área do Lojista</h1>
            <p className="text-slate-500 mt-2 text-sm">
              Entre para gerenciar seu delivery.
            </p>
          </div>

          <div className="space-y-5">
             {/* Google Button */}
            <Button 
              type="button"
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full h-12 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center gap-2 bg-white shadow-sm"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Entrar com Google
            </Button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">Ou via e-mail</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 ml-1 text-xs uppercase font-bold tracking-wider">E-mail</Label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <Input 
                        id="email" 
                        type="email" 
                        required 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="pl-12 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-slate-900/10 rounded-xl transition-all shadow-sm"
                        placeholder="loja@exemplo.com"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-slate-700 ml-1 text-xs uppercase font-bold tracking-wider">Senha</Label>
                    {/* Link de esqueceu a senha poderia vir aqui */}
                </div>
                <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <Input 
                        id="password" 
                        type="password" 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="pl-12 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-slate-900/10 rounded-xl transition-all shadow-sm"
                        placeholder="••••••••"
                    />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold bg-slate-900 hover:bg-black text-white rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all" 
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Acessar Painel"}
              </Button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Quer vender online?{" "}
              <Link to="/register" className="text-slate-900 font-bold hover:underline">
                Criar Loja Grátis
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
      
      <footer className="absolute bottom-4 w-full text-center text-xs text-slate-400 font-medium">
        &copy; {new Date().getFullYear()} VianaHub. Acesso restrito a lojistas.
      </footer>
    </div>
  );
}