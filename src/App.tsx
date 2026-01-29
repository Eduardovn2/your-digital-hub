import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// --- IMPORTS DAS PÁGINAS ---
import Index from "./pages/Index";
import StorePage from "./pages/StorePage";
import PaymentMock from "./pages/subscription/PaymentMock";
// O Admin está direto na pasta pages, então ajustamos o caminho:
import Admin from "./pages/Admin";
import { ProtectedRoute } from "./pages/auth/ProtectedRoute"; // <--- IMPORT NOVO
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
          {/* 1. Rotas Públicas (Fixas) */}
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/payment" element={<PaymentMock />} />

          {/* 2. Rota Protegida (Admin) */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="seller">
                <Admin />
              </ProtectedRoute>
            } 
          />
          
          {/* 3. ROTA DA LOJA PÚBLICA (ADICIONE ISTO AQUI) 👇 */}
          {/* O ":slug" diz para o React: "Qualquer coisa que vier depois da barra 
              e não for admin/register/payment, trate como o endereço de uma loja" */}
          <Route path="/:slug" element={<StorePage />} />

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;