import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// --- IMPORTS DAS PÁGINAS ---
import Index from "./pages/Index";
import PaymentMock from "./pages/subscription/PaymentMock";
// O Admin está direto na pasta pages, então ajustamos o caminho:
import Admin from "./pages/Admin"; 
// O Register ainda não existe, vamos criar ele no próximo passo
import Register from "./pages/auth/Register";
// Criação do cliente para gerenciar cache e dados

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rota de Pagamento (Criamos antes) */}
          <Route path="/payment" element={<PaymentMock />} />

          {/* Rotas Protegidas / Admin */}
          <Route path="/admin" element={<Admin />} />
          
          {/* Rota coringa para 404 (opcional) */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;