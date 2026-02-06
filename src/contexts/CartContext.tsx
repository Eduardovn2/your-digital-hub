import { createContext, useContext, useState, ReactNode } from "react";
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

// 2. Definição do Contexto (Atualizada)
interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  total: number;
  totalItems: number; // <--- NOVO: Contagem total de itens para o badge
  storeId: string;
  setStoreId: (id: string) => void;
  isCartOpen: boolean; // <--- NOVO: Estado para abrir/fechar o carrinho
  setIsCartOpen: (open: boolean) => void; // <--- NOVO: Função para controlar o carrinho
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storeId, setStoreId] = useState<string>(""); 
  const [isCartOpen, setIsCartOpen] = useState(false); // <--- NOVO: Estado da gaveta

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

  // Cálculo do valor total (R$)
  const total = items.reduce((acc, item) => {
      const price = Number(item.price) || 0;
      const qtd = Number(item.quantity) || 1;
      return acc + (price * qtd);
  }, 0);

  // NOVO: Cálculo do total de itens (quantidade) para o badge vermelho
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
        totalItems, // <--- Exportando
        storeId, 
        setStoreId,
        isCartOpen, // <--- Exportando
        setIsCartOpen // <--- Exportando
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