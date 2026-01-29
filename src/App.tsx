import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// --- IMPORTS DAS PÁGINAS ---
import Index from "./pages/Index";
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
          {/* Rotas Públicas */}
          {/* Rotas Públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/payment" element={<PaymentMock />} />

          {/* --- ROTA PROTEGIDA (O SEGURANÇA ESTÁ AQUI) --- */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="seller">
                <Admin />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;