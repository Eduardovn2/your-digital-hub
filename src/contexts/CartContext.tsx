import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string; 
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  checkout: (customerData: { name: string; phone: string; address: string }, storeId: string, deliveryFee: number) => Promise<void>;
  subtotal: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: any) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: Number(product.price), 
        quantity: 1,
        image: product.image
      }];
    });
    // REMOVIDO: toast.success(...) daqui para evitar duplicidade
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(i => i.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId);
    setItems(prev => prev.map(i => i.id === productId ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const checkout = async (customerData: any, storeId: string, deliveryFee: number) => {
    if (items.length === 0) {
      toast.error("Seu carrinho está vazio!");
      return;
    }

    const totalValue = subtotal + deliveryFee;

    try {
      const { error } = await supabase.from('orders').insert({
        store_id: storeId,
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        customer_address: customerData.address,
        subtotal: subtotal,
        total: totalValue,
        delivery_fee: deliveryFee,
        status: 'pending'
      } as any);

      if (error) throw error;

      toast.success("Pedido enviado com sucesso! Aguarde a confirmação.");
      clearCart();
    } catch (error: any) {
      toast.error("Erro ao finalizar pedido: " + error.message);
    }
  };

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      checkout, 
      subtotal, 
      total: subtotal 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de um CartProvider");
  return context;
};