import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "sonner";

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
  totalItems: number;
  storeId: string;
  setStoreId: (id: string) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  customerId: string; // <--- 1. ADICIONEI O ID NA TIPAGEM
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storeId, setStoreId] = useState<string>(""); 
  const [isCartOpen, setIsCartOpen] = useState(false);

  // <--- 2. INICIALIZA O ID DO CLIENTE (Roda apenas 1 vez ao carregar a página)
  const [customerId] = useState(() => getOrCreateCustomerId());

  const addToCart = (newItem: CartItem) => {
    const safeItem = {
        ...newItem,
        price: Number(newItem.price) || 0,
        quantity: Number(newItem.quantity) || 1
    };

    setItems((currentItems) => {
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
    
    toast.success("Item adicionado à sacola!");
  };

  const removeFromCart = (itemId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((acc, item) => {
      const price = Number(item.price) || 0;
      const qtd = Number(item.quantity) || 1;
      return acc + (price * qtd);
  }, 0);

  const totalItems = items.reduce((acc, item) => {
      return acc + (Number(item.quantity) || 1);
  }, 0);

  return (
    <CartContext.Provider 
      value={{ 
        items, 
        addToCart, 
        removeFromCart, 
        clearCart, 
        total,
        totalItems,
        storeId, 
        setStoreId,
        isCartOpen,
        setIsCartOpen,
        customerId // <--- 3. EXPORTANDO O ID PARA O APP USAR
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

// <--- 4. FUNÇÃO AUXILIAR NO FINAL DO ARQUIVO
const getOrCreateCustomerId = () => {
  // Verifica se estamos no navegador para evitar erro de build (Next.js/SSR)
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem("viana_customer_id");
  if (!id) {
    // Fallback simples caso crypto.randomUUID não exista em navegadores muito antigos
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = crypto.randomUUID();
    } else {
        id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    localStorage.setItem("viana_customer_id", id);
  }
  return id;
};