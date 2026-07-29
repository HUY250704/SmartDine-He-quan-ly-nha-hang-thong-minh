import React, { createContext, useContext, useState, useCallback } from "react";

const CartContext = createContext();

const CART_KEY = "smartdine_cart";

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  });

  const save = (c) => {
    setCart(c);
    localStorage.setItem(CART_KEY, JSON.stringify(c));
  };

  const addToCart = useCallback(
    (item) => {
      setCart((prev) => {
        const found = prev.find((i) => i._id === item._id);
        const next = found
          ? prev.map((i) => (i._id === item._id ? { ...i, qty: i.qty + 1 } : i))
          : [...prev, { ...item, qty: 1, note: "" }];
        localStorage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const removeFromCart = useCallback(
    (id) => {
      setCart((prev) => {
        const next = prev.filter((i) => i._id !== id);
        localStorage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const updateQty = useCallback(
    (id, delta) => {
      setCart((prev) => {
        const next = prev
          .map((i) => (i._id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
          .filter((i) => i.qty > 0);
        localStorage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const updateNote = useCallback(
    (id, note) => {
      setCart((prev) => {
        const next = prev.map((i) => (i._id === id ? { ...i, note } : i));
        localStorage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const clearCart = useCallback(() => {
    save([]);
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, updateNote, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
