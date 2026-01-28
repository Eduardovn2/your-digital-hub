import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CartItem, MenuItem } from "@/types/menu";
import { Store } from "@/types/store"; 
import { supabase } from "@/integrations/supabase/client";

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  // ADICIONADO: Disponibiliza os dados da loja para o site todo
  store: Store | null; 
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  // ADICIONADO: Estado para guardar os dados da loja
  const [store, setStore] = useState<Store | null>(null);

  // ADICIONADO: Busca os dados da loja ao carregar o site
  useEffect(() => {
    async function fetchStore() {
      try {
        // Busca a primeira loja ativa encontrada no banco
        // (Se tiver mais de uma loja, precisaremos filtrar por slug/domínio depois)
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .single();

        if (error) {
          console.error('Erro ao buscar loja:', error);
          return;
        }

        if (data) {
          console.log("Loja carregada no Contexto:", data.name);
          setStore(data as Store);
        }
      } catch (error) {
        console.error('Erro geral ao carregar loja:', error);
      }
    }

    fetchStore();
  }, []);

  const addItem = useCallback((item: MenuItem) => {
    setItems((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      if (existingItem) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
        store, // ADICIONADO: Exportando a loja
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}