import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster"; 

// 1. IMPORTAÇÕES DE SEGURANÇA E CONTEXTO
import { AuthProvider } from "@/contexts/AuthContext"; 
import { CartProvider } from "@/contexts/CartContext"; 
import { ProtectedRoute } from "@/pages/auth/ProtectedRoute";
import { AdminSettingsProvider } from "@/contexts/AdminSettingsContext"; // <--- Já estava importado aqui

// 2. IMPORTS DAS PÁGINAS
import Index from "./pages/Index";
import StorePage from "./pages/StorePage";
import PaymentMock from "./pages/subscription/PaymentMock";
import Admin from "./pages/Admin";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* 3. O AuthProvider envolve a autenticação do lojista */}
      <AuthProvider> 
        
        {/* --- ADICIONEI AQUI O PROVIDER DE CONFIGURAÇÕES --- */}
        <AdminSettingsProvider>
          
          {/* 4. O CartProvider envolve as rotas para permitir pedidos na StorePage */}
          <CartProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                {/* Rotas Públicas */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/payment" element={<PaymentMock />} />

                {/* Rota Protegida (Admin) */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <Admin />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Rota da Loja Pública (Slug) */}
                <Route path="/:slug" element={<StorePage />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
          
        </AdminSettingsProvider>
        {/* -------------------------------------------------- */}

      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;