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
import { SubscriptionGuard } from "./pages/auth/SubscriptionGuard";
import PrivacyPolicy from "./pages/PrivacyPolicy"; // 1. Adicione o import

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
                <Route path="/auth" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/privacidade" element={<PrivacyPolicy />} />
                
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <SubscriptionGuard>
                        <Admin />
                      </SubscriptionGuard>
                    </ProtectedRoute>
                  }
                />

                  {/* A ROTA SALVADORA: Tem que se chamar exatamente "/payment" */}
                  <Route 
                    path="/payment" 
                    element={
                      <ProtectedRoute>
                        <PaymentMock />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Loja do Cliente (Pública) - Deixe essa sempre por último! */}
                  <Route path="/:slug" element={<StorePage />} />
                  
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