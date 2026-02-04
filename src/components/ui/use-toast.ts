// src/components/ui/use-toast.ts

// Tipagem básica para o TypeScript não reclamar
type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
};

// Hook simplificado
export function useToast() {
  function toast({ title, description, variant }: ToastProps) {
    // Exibe no console para debug
    console.log(`[TOAST - ${variant || 'default'}]:`, title, description);
    
    // (Opcional) Usa o alert do navegador para você ver que funcionou
    // Pode comentar a linha abaixo se achar chato
    // alert(`${title}\n${description}`);
  }

  return {
    toast,
    dismiss: (toastId?: string) => console.log("Dismiss toast", toastId),
  };
}

// Exporta também a função toast solta, caso algum componente use
export const toast = (props: ToastProps) => {
  console.log("Toast function called directly:", props);
};