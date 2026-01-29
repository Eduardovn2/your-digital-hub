import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth"; // Certifique-se que esse hook existe
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "seller" | "customer"; // Opcional: define qual papel é exigido
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // 1. Enquanto verifica o login, mostra um spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Se não tem usuário logado, manda pro Login/Registro
  if (!user) {
    return <Navigate to="/register" replace />;
  }

  // 3. Verifica o papel (Role)
  // O papel fica salvo em: user.user_metadata.role
  const userRole = user.user_metadata?.role;

  if (requiredRole && userRole !== requiredRole) {
    // Se o usuário tenta acessar uma área que não é pro tipo dele
    // Ex: Cliente tentando acessar painel de Vendedor
    return <Navigate to="/" replace />;
  }

  // Se passou por tudo, libera o acesso à página
  return <>{children}</>;
}