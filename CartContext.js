import React, { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addItem = (item) => setCart(prev => [...prev, item]);
  const removeItem = (index) => setCart(prev => prev.filter((_,i)=>i!==index));
  const clear = () => setCart([]);
  const subtotal = cart.reduce((s,i)=>s + (i.price || 0), 0);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, clear, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};
