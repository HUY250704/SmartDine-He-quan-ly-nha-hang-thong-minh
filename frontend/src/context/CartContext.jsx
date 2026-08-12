import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useLocation, matchPath } from "react-router-dom";

const CartContext = createContext();

function cartKey(tableId) {
  return `smartdine_cart_${tableId || "guest"}`;
}

export function CartProvider({ children }) {
  const location = useLocation();

  // Derive tableId from URL path instead of useParams() since CartProvider
  // wraps the entire app at BrowserRouter level (outside <Routes>).
  const match = matchPath("/customer/:tableId/*", location.pathname);
  const tableId = match?.params?.tableId;

  const key = cartKey(tableId);

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  });

  // Reload cart when tableId changes
  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem(key)) || []);
    } catch {
      setCart([]);
    }
  }, [key]);

  const save = useCallback(
    (c) => {
      setCart(c);
      localStorage.setItem(key, JSON.stringify(c));
    },
    [key]
  );

  const addToCart = useCallback(
    (item) => {
      setCart((prev) => {
        const found = prev.find((i) => i._id === item._id);
        const next = found
          ? prev.map((i) => (i._id === item._id ? { ...i, qty: i.qty + 1 } : i))
          : [...prev, { ...item, qty: 1, note: "" }];
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  
  const addToCartWithDetails = useCallback(
    (item, qty, note) => {
      const quantity = Math.max(1, qty || 1);
      const itemNote = note || "";
      setCart((prev) => {
        const found = prev.find((i) => i._id === item._id && i.note === itemNote);
        const next = found
          ? prev.map((i) => (i._id === item._id && i.note === itemNote ? { ...i, qty: i.qty + quantity } : i))
          : [...prev, { ...item, qty: quantity, note: itemNote }];
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );
const removeFromCart = useCallback(
    (id) => {
      setCart((prev) => {
        const next = prev.filter((i) => i._id !== id);
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  const updateQty = useCallback(
    (id, delta) => {
      setCart((prev) => {
        const next = prev
          .map((i) => (i._id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
          .filter((i) => i.qty > 0);
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  const updateNote = useCallback(
    (id, note) => {
      setCart((prev) => {
        const next = prev.map((i) => (i._id === id ? { ...i, note } : i));
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  const clearCart = useCallback(() => {
    save([]);
  }, [save]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, addToCartWithDetails, removeFromCart, updateQty, updateNote, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
