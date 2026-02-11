import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

// Adicionei "admin" aqui para parar o erro de TypeScript
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

  // CORREÇÃO DO LOOP: Se for admin, libera o acesso de seller
  if (requiredRole && userRole !== requiredRole) {
    if (userRole === 'admin') return <>{children}</>;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}