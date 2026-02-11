import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { AdminSettingsProvider } from "./contexts/AdminSettingsContext"; // <--- IMPORTANTE

// Pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Admin from "./pages/Admin";
import StorePage from "./pages/StorePage";
import NotFound from "./pages/NotFound";
import {ProtectedRoute} from "./pages/auth/ProtectedRoute";
import PaymentMock from "./pages/subscription/PaymentMock";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AdminSettingsProvider> {/* <--- ESTE É O PROVEDOR DE SOM E CONFIGS */}
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Rotas Públicas */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Área do Admin (Protegida) */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  }
                />

                {/* Loja do Cliente (Pública) */}
                <Route path="/:slug" element={<StorePage />} />
                
                {/* Mock de Pagamento */}
                <Route path="/payment-mock" element={<PaymentMock />} />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </AdminSettingsProvider> {/* <--- FECHA O PROVEDOR AQUI */}
  </QueryClientProvider>
);

export default App;