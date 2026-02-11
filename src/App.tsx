import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster"; 
import { AuthProvider } from "@/contexts/AuthContext"; 
import { CartProvider } from "@/contexts/CartContext"; 
import { ProtectedRoute } from "@/pages/auth/ProtectedRoute";
import { AdminSettingsProvider } from "@/contexts/AdminSettingsContext"; 

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
      <AuthProvider> 
        <AdminSettingsProvider>
          <CartProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/payment" element={<PaymentMock />} />

                {/* CORREÇÃO: requiredRole="admin" */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Admin />
                    </ProtectedRoute>
                  } 
                />
                
                <Route path="/:slug" element={<StorePage />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </AdminSettingsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;