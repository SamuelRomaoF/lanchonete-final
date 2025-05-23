import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from "../../shared/schema.js";

// Tipo para um item do carrinho
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

// Interface para o contexto do carrinho
interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  isItemInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// Criando o contexto
const CartContext = createContext<CartContextType | undefined>(undefined);

// Storage key para salvar/restaurar o carrinho
const CART_STORAGE_KEY = 'falecomigo-cart';

// Provedor do contexto
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado para armazenar os itens do carrinho
  const [items, setItems] = useState<CartItem[]>([]);

  // Carregar carrinho do localStorage quando o componente montar
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Erro ao carregar carrinho do localStorage:', error);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Salvar carrinho no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Adicionar um item ao carrinho
  const addItem = (product: Product, quantity: number = 1) => {
    setItems(currentItems => {
      // Verificar se o produto já existe no carrinho
      const existingItemIndex = currentItems.findIndex(
        item => item.productId === product.id.toString()
      );

      // Se já existe, atualizar a quantidade
      if (existingItemIndex >= 0) {
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      }

      // Se não existe, adicionar como novo item
      const newItem: CartItem = {
        id: `${product.id}-${Date.now()}`, // ID único para o item do carrinho
        productId: product.id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        quantity: quantity,
        imageUrl: product.imageUrl
      };

      return [...currentItems, newItem];
    });
  };

  // Atualizar a quantidade de um item
  const updateItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // Remover um item do carrinho
  const removeItem = (id: string) => {
    setItems(currentItems => 
      currentItems.filter(item => item.id !== id)
    );
  };

  // Limpar todo o carrinho
  const clearCart = () => {
    setItems([]);
  };

  // Verificar se um produto já está no carrinho
  const isItemInCart = (productId: string) => {
    return items.some(item => item.productId === productId);
  };

  // Obter a quantidade de um produto específico no carrinho
  const getItemQuantity = (productId: string) => {
    const item = items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  // Obter o total de itens no carrinho
  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Calcular o preço total do carrinho
  const getTotalPrice = () => {
    return items.reduce(
      (total, item) => total + item.price * item.quantity, 
      0
    );
  };

  // Valor do contexto
  const value: CartContextType = {
    items,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    isItemInCart,
    getItemQuantity,
    getTotalItems,
    getTotalPrice
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
};
