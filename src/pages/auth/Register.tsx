import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"; 
import { Store, Loader2, ArrowLeft, Mail, Lock, User, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [step, setStep] = useState<"register" | "verify">("register"); 
  const [otpCode, setOtpCode] = useState(""); 
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lockoutTime, setLockoutTime] = useState(0);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTime]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (lockoutTime > 0) {
      toast.warning(`Aguarde ${lockoutTime} segundos para tentar novamente.`);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await (supabase.auth as any).signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: "admin", 
          },
        },
      });

      if (error) throw error;

      if (data.user && !data.session) {
        toast.success("Código enviado para seu e-mail!");
        setStep("verify"); 
        return; 
      }

      toast.success("Conta criada com sucesso!");
      navigate("/payment");

    } catch (error: any) {
      console.error("Erro no registro:", error);
      
      let displayMessage = "Ocorreu um erro ao criar a conta.";
      
      if (error.message.includes("User already registered") || error.status === 400) {
        displayMessage = "Este e-mail já está cadastrado. Tente fazer login.";
      } else if (error.status === 429 || error.message.includes("Too many requests")) {
        displayMessage = "Muitas tentativas. Aguarde um momento.";
        setLockoutTime(60); 
      } else if (error.message.includes("Password should be")) {
        displayMessage = "A senha deve ter pelo menos 6 caracteres.";
      }

      setErrorMsg(displayMessage);
      toast.error(displayMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otpCode,
        type: 'signup'
      });

      if (error) throw error;

      toast.success("E-mail verificado com sucesso!");
      navigate("/payment"); 

    } catch (error: any) {
      console.error("Erro OTP:", error);
      setErrorMsg("Código inválido ou expirado. Tente novamente.");
      toast.error("Código incorreto.");
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
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error("Erro ao conectar com Google");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-primary/20 relative overflow-hidden items-center justify-center p-4">
      
      {/* Background Decorativo (Igual ao Admin) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link to="/" className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 font-medium bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white border border-transparent hover:border-slate-200 shadow-sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar
        </Link>
      </div>

      <div className="w-full max-w-lg z-10">
        <GlassCard 
          intensity="light" 
          gradientBorder={true}
          className="w-full p-8 md:p-10 shadow-2xl shadow-primary/5"
        >
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/20 backdrop-blur-sm">
              <Store className="h-8 w-8 text-primary drop-shadow-sm" />
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {step === "register" ? "Criar Conta Lojista" : "Verificar E-mail"}
            </h1>
            <p className="text-slate-500 mt-2 text-base">
              {step === "register" 
                ? "Gerencie seu delivery com tecnologia de ponta."
                : `Enviamos um código para ${formData.email}`}
            </p>
          </div>

          <div className="space-y-6">
            
            {errorMsg && (
              <Alert variant="destructive" className="bg-red-50/80 border-red-200 text-red-800 animate-fade-in backdrop-blur-sm">
                <div className="flex gap-2 items-start">
                  {lockoutTime > 0 ? <Clock className="h-4 w-4 mt-1" /> : <AlertCircle className="h-4 w-4 mt-1" />}
                  <div>
                    <AlertTitle className="font-bold">
                      {lockoutTime > 0 ? `Bloqueado por ${lockoutTime}s` : "Atenção"}
                    </AlertTitle>
                    <AlertDescription className="text-xs mt-1 leading-relaxed">
                      {errorMsg}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

            {/* --- TELA 1: REGISTRO --- */}
            {step === "register" && (
              <>
                <Button 
                  type="button"
                  onClick={handleGoogleSignup}
                  variant="outline"
                  disabled={lockoutTime > 0}
                  className="w-full h-12 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center gap-2 bg-white/80 shadow-sm disabled:opacity-50 transition-all"
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
                    <Label htmlFor="name" className="text-slate-600 ml-1 text-xs uppercase font-bold tracking-wider">Nome do Responsável</Label>
                    <div className="relative group">
                        <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                        <Input 
                            id="name" required value={formData.fullName} 
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                            className="pl-12 h-12 bg-white/60 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-primary/10 rounded-xl transition-all shadow-sm backdrop-blur-sm"
                            placeholder="Ex: Eduardo Viana" disabled={lockoutTime > 0}
                        />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-600 ml-1 text-xs uppercase font-bold tracking-wider">E-mail Profissional</Label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                        <Input 
                            id="email" type="email" required value={formData.email} 
                            onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            className="pl-12 h-12 bg-white/60 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-primary/10 rounded-xl transition-all shadow-sm backdrop-blur-sm"
                            placeholder="loja@exemplo.com" disabled={lockoutTime > 0}
                        />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-600 ml-1 text-xs uppercase font-bold tracking-wider">Senha de Acesso</Label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                        <Input 
                            id="password" type="password" required value={formData.password} 
                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            className="pl-12 h-12 bg-white/60 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-primary/10 rounded-xl transition-all shadow-sm backdrop-blur-sm"
                            placeholder="••••••••" disabled={lockoutTime > 0}
                        />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-14 font-bold bg-slate-900 text-white rounded-xl shadow-xl hover:bg-black transition-all mt-6 hover:shadow-primary/20" disabled={loading || lockoutTime > 0}>
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Criar Conta e Receber Código"}
                  </Button>
                </form>
              </>
            )}

            {/* --- TELA 2: VERIFICAR CÓDIGO (OTP - 8 DÍGITOS) --- */}
            {step === "verify" && (
              <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Label className="text-center text-slate-600">
                    Digite o código de 8 dígitos enviado para seu e-mail
                  </Label>
                  
                  <InputOTP maxLength={8} value={otpCode} onChange={(val) => setOtpCode(val)}>
                    <InputOTPGroup>
                      {/* Grupo 1 */}
                      <InputOTPSlot index={0} className="h-12 w-10 text-lg border-slate-300 bg-white/50 backdrop-blur-sm" />
                      <InputOTPSlot index={1} className="h-12 w-10 text-lg border-slate-300 bg-white/50 backdrop-blur-sm" />
                      <InputOTPSlot index={2} className="h-12 w-10 text-lg border-slate-300 bg-white/50 backdrop-blur-sm" />
                      <InputOTPSlot index={3} className="h-12 w-10 text-lg border-slate-300 bg-white/50 backdrop-blur-sm" />
                    </InputOTPGroup>
                    <div className="mx-2 text-slate-400">-</div>
                    <InputOTPGroup>
                      {/* Grupo 2 */}
                      <InputOTPSlot index={4} className="h-12 w-10 text-lg border-slate-300 bg-white/50 backdrop-blur-sm" />
                      <InputOTPSlot index={5} className="h-12 w-10 text-lg border-slate-300 bg-white/50 backdrop-blur-sm" />
                      <InputOTPSlot index={6} className="h-12 w-10 text-lg border-slate-300 bg-white/50 backdrop-blur-sm" />
                      <InputOTPSlot index={7} className="h-12 w-10 text-lg border-slate-300 bg-white/50 backdrop-blur-sm" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button type="submit" className="w-full h-14 font-bold bg-primary text-white rounded-xl shadow-xl hover:bg-primary/90 transition-all hover:shadow-primary/20" disabled={loading || otpCode.length < 8}>
                   {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Confirmar Código"}
                </Button>

                <Button type="button" variant="ghost" className="w-full text-slate-500 hover:bg-white/30" onClick={() => setStep("register")}>
                  Voltar e corrigir e-mail
                </Button>
              </form>
            )}

          </div>

          {step === "register" && (
            <div className="mt-8 pt-6 border-t border-slate-200/50 flex flex-col items-center gap-4">
              <div className="flex gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> 7 dias grátis</span>
              </div>
              <p className="text-sm text-slate-500">
                Já tem uma conta?{" "}
                <Link to="/auth" className="text-slate-900 font-bold hover:underline">
                  Fazer Login
                </Link>
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}