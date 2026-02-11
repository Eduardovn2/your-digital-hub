import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

// Adicionamos "admin" aqui para o TypeScript não reclamar
type AllowedRole = "seller" | "customer" | "admin"; 

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AllowedRole; 
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const userRole = user.user_metadata?.role;

  // CORREÇÃO DO LOOP:
  // Se o papel exigido for diferente do papel do usuário
  if (requiredRole && userRole !== requiredRole) {
    // TRUQUE: Se o usuário for "admin", ele pode acessar áreas de "seller"
    if (userRole === 'admin') {
        return <>{children}</>;
    }
    // Caso contrário, manda para home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}