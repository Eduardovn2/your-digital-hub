import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Store, 
  LayoutDashboard, 
  UtensilsCrossed, 
  Settings, 
  LogOut, 
  PlusCircle, 
  Loader2, 
  Rocket,
  ShoppingBag
} from "lucide-react";
import { toast } from "sonner";
import { StoreSettings } from "@/components/dashboard/StoreSettings";

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // Estados de Dados
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<any>(null);
  
  // Estados de Interface
  const [activeTab, setActiveTab] = useState("dashboard");
  const [newStoreName, setNewStoreName] = useState("");
  const [creating, setCreating] = useState(false);

  // 1. Verifica se o usuário tem loja ao carregar
  useEffect(() => {
    checkStore();
  }, []);

  const checkStore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setStore(data);
      }
    } catch (error) {
      console.error("Erro ao carregar loja", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Lógica para Criar Loja (Se não existir)
// ... dentro do seu componente Admin

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      toast.error("O nome da loja é obrigatório");
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Gera um slug simples (ex: "Viana Burguer" vira "viana-burguer")
      // Isso é OBRIGATÓRIO pelo banco de dados
      const generatedSlug = newStoreName
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/\s+/g, '-') // Espaço vira traço
        .replace(/[^\w-]+/g, ''); // Remove caracteres especiais

      const { data, error } = await supabase
        .from("stores")
        .insert([
          { 
            name: newStoreName,
            description: "Nova loja VianaHub",
            // CORREÇÃO 1: O nome correto da coluna no banco é 'owner_id', não 'user_id'
            owner_id: user.id, 
            // CORREÇÃO 2: A coluna 'slug' é obrigatória no banco
            slug: generatedSlug,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Loja criada com sucesso!");
      // Atualiza o estado local para sair da tela de criação
      // (Supondo que você tenha a função setStore disponível no escopo)
      // setStore(data); 
      window.location.reload(); // Recarrega para pegar o estado novo limpo

    } catch (error: any) {
      console.error("Erro ao criar loja:", error);
      toast.error("Erro ao criar loja: " + (error.message || "Erro desconhecido"));
    } finally {
      setCreating(false);
    }
  };

  // 3. Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // --- TELA 1: CRIAR LOJA (Se user não tem loja) ---
  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"></div>
             <div className="absolute top-[20%] -left-[10%] w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-lg w-full space-y-8 relative z-10">
          <div className="text-center">
            <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Rocket className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bem-vindo ao VianaHub</h1>
            <p className="text-slate-500 mt-2 text-lg">Vamos configurar seu delivery em poucos segundos.</p>
          </div>
          
          <Card className="bg-white/80 backdrop-blur-xl border-white/60 shadow-xl rounded-[2rem]">
            <CardContent className="p-8">
               <form onSubmit={handleCreateStore} className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-sm font-bold uppercase tracking-wider text-slate-500 ml-1">Nome do Delivery</label>
                   <div className="relative">
                     <Store className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                     <Input 
                       placeholder="Ex: Viana Burguer & Açaí" 
                       className="pl-12 h-12 text-lg bg-white border-slate-200 rounded-xl"
                       value={newStoreName}
                       onChange={(e) => setNewStoreName(e.target.value)}
                     />
                   </div>
                 </div>
                 <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl shadow-lg" disabled={creating}>
                   {creating ? <Loader2 className="mr-2 animate-spin" /> : "Criar Minha Loja 🚀"}
                 </Button>
               </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- TELA 2: DASHBOARD COMPLETO (Se user TEM loja) ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR */}
      <aside className="md:w-72 bg-slate-900 text-white flex-shrink-0 flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-primary/20">
               {store.name ? store.name.substring(0,1).toUpperCase() : "V"}
             </div>
             <div className="overflow-hidden">
               <h1 className="font-bold text-lg leading-tight truncate">{store.name}</h1>
               <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
               </p>
             </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
            { id: "orders", label: "Pedidos", icon: ShoppingBag },
            { id: "menu", label: "Cardápio / Produtos", icon: UtensilsCrossed },
            { id: "settings", label: "Configurações", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                activeTab === item.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1"
              }`}
            >
              <item.icon className={`h-5 w-5 transition-colors ${activeTab === item.id ? "text-white" : "text-slate-500 group-hover:text-white"}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl h-12"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" /> Sair do Painel
          </Button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth">
        
        {/* Header Mobile/Desktop */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {activeTab === 'orders' ? 'Gerenciamento de Pedidos' 
             : activeTab === 'dashboard' ? 'Visão Geral' 
             : activeTab === 'menu' ? 'Seu Cardápio' 
             : 'Configurações da Loja'}
          </h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="hidden md:flex rounded-xl border-slate-300" onClick={() => window.open(`/loja/${store.id}`, '_blank')}>
               Ver Loja Online
            </Button>
            {activeTab === 'menu' && (
                <Button size="sm" className="rounded-xl shadow-md shadow-primary/20">
                    <PlusCircle className="h-4 w-4 mr-2" /> Novo Produto
                </Button>
            )}
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
          
          {/* CONTEÚDO DAS ABAS */}
          
          {activeTab === "dashboard" && (
            <div className="animate-in fade-in duration-500 space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><ShoppingBag className="h-6 w-6" /></div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Pedidos Hoje</p>
                                <h3 className="text-2xl font-bold text-slate-900">0</h3>
                            </div>
                        </div>
                    </Card>
                </div>
                
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                    <p className="text-slate-500">Gráficos e estatísticas aparecerão aqui.</p>
                </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="animate-in fade-in duration-500 bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">Lista de Pedidos</h3>
                <p className="text-slate-500">O componente de pedidos será instalado aqui.</p>
            </div>
          )}

          {activeTab === "menu" && (
            <div className="animate-in fade-in duration-500 bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                <UtensilsCrossed className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">Seu Cardápio</h3>
                <p className="text-slate-500">O gerenciador de produtos será instalado aqui.</p>
            </div>
          )}

          {activeTab === "settings" && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <StoreSettings store={store} />
             </div>
          )}

        </div>
      </main>
    </div>
  );
}