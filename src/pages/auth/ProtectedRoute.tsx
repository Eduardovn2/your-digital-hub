import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

// 👇 AQUI ESTÁ A CORREÇÃO: Adicionamos "admin" na tipagem
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

  // Lógica simplificada: Se for admin, libera tudo. Se não, verifica o papel específico.
  if (requiredRole && userRole !== requiredRole) {
    if (userRole === 'admin') return <>{children}</>;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}