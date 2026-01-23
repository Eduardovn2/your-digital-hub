import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/admin/LoginForm";
import { ProductList } from "@/components/admin/ProductList";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Admin() {
  const { user, isAdmin, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-food-orange" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Acesso Restrito
          </h1>
          <p className="text-muted-foreground mb-6">
            Sua conta ainda não tem permissão de administrador. 
            Entre em contato com o proprietário do sistema.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
            <Link to="/">
              <Button className="bg-food-orange hover:bg-food-red">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Menu
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Ver Cardápio
                </Button>
              </Link>
              <div className="border-l border-border pl-4">
                <h1 className="text-xl font-bold text-food-orange">
                  🍽️ Painel Admin
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <ProductList />
      </main>
    </div>
  );
}
