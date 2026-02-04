import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  // A nossa versão "Lite" do hook não retorna lista de toasts, 
  // então não precisamos mapear nada aqui por enquanto.
  
  return (
    <div className="fixed top-0 right-0 z-[100] flex flex-col gap-2 w-full max-w-[420px] p-4 pointer-events-none">
      {/* Este componente fica invisível visualmente para não atrapalhar o layout.
         O feedback real para o usuário está sendo feito via window.alert() 
         que configuramos no painel Admin.
         
         No futuro, se quiser instalar a biblioteca completa (Shadcn UI),
         aí sim voltamos com o código complexo.
      */}
    </div>
  );
}