import { useLocation, Navigate } from 'react-router-dom';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyStore } from '@/hooks/useStores';
import { Button } from '@/components/ui/button';

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const { data: store, isLoading } = useMyStore(user?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-500 animate-pulse">A verificar subscrição...</p>
      </div>
    );
  }

  // 1. Se não tem loja ainda, deixa passar para o Admin.tsx renderizar o StoreSetupForm
  if (!store) {
    return <>{children}</>;
  }

  // 2. Loja recém-criada (pendente) ou bloqueada manualmente
  if (store.status as any === 'pending') {
    return <Navigate to="/payment" replace state={{ from: location }} />;
  }

  // Lógica de cálculo de carência
  let isGracePeriod = false;
  let daysLeftToBlock = 0;
  let isBlocked = false;

  if (store.expires_at) {
    const now = new Date();
    const expiresAt = new Date(store.expires_at!);
    const diffTime = now.getTime() - expiresAt.getTime();
    const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLate > 5) {
      isBlocked = true;
    } else if (daysLate > 0 && daysLate <= 5) {
      isGracePeriod = true;
      daysLeftToBlock = 5 - daysLate;
    }
  }

  // 3. BLOQUEIO TOTAL: Passou da carência
  if (isBlocked) {
    return <Navigate to="/payment" replace state={{ from: location }} />;
  }

  // 4. ACESSO PERMITIDO (Com ou sem barra de aviso)
  return (
    <div className="w-full min-h-screen flex flex-col">
      {isGracePeriod && (
        <div className="bg-orange-500/90 backdrop-blur-md text-white px-4 py-3 shadow-sm z-50 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-medium animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
            <span>
              Atenção: A sua assinatura expirou. Tem <strong>{daysLeftToBlock} dia(s)</strong> para regularizar antes da suspensão do painel.
            </span>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-sm"
            onClick={() => window.location.href = '/payment'}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Regularizar Agora
          </Button>
        </div>
      )}
      
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  );
}