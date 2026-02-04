import { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "sonner"; // Mantive o sonner conforme seu código

// 1. Definição do Item
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  observation?: string;
  image_url?: string;
}

// 2. Definição do Contexto
interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  total: number;
  storeId: string;
  setStoreId: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storeId, setStoreId] = useState<string>(""); 

  const addToCart = (newItem: CartItem) => {
    // BLINDAGEM 1: Garante que os dados de entrada são números
    const safeItem = {
        ...newItem,
        price: Number(newItem.price) || 0,
        quantity: Number(newItem.quantity) || 1
    };

    setItems((currentItems) => {
      // Verifica se já existe item igual (mesmo ID e mesma observação)
      const existingItem = currentItems.find(
        (item) => item.id === safeItem.id && item.observation === safeItem.observation
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === safeItem.id && item.observation === safeItem.observation
            ? { ...item, quantity: Number(item.quantity) + Number(safeItem.quantity) }
            : item
        );
      }
      return [...currentItems, safeItem];
    });
    
    // Feedback visual
    toast.success("Item adicionado à sacola!");
  };

  const removeFromCart = (itemId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  // BLINDAGEM 2: O cálculo do total global agora é à prova de falhas
  const total = items.reduce((acc, item) => {
      const price = Number(item.price) || 0;
      const qtd = Number(item.quantity) || 1;
      return acc + (price * qtd);
  }, 0);

  return (
    <CartContext.Provider 
      value={{ 
        items, 
        addToCart, 
        removeFromCart, 
        clearCart, 
        total, 
        storeId, 
        setStoreId 
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};