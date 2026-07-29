import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserBottomNav } from "@/components/layout/UserBottomNav";

const initialCart = [
  { id: 1, name: "Wagyu Beef Tartare", price: 580000, qty: 2, note: "", image: "🥩" },
  { id: 5, name: "Ribeye Steak 300g", price: 950000, qty: 1, note: "Medium rare", image: "🥩" },
  { id: 7, name: "Chocolate Lava Cake", price: 280000, qty: 1, note: "", image: "🍫" },
  { id: 9, name: "Signature Old Fashioned", price: 195000, qty: 2, note: "", image: "🥃" },
];

export default function CartPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState(initialCart);
  const [showSuccess, setShowSuccess] = useState(false);

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? {...i, qty: Math.max(0, i.qty + delta)} : i).filter(i => i.qty > 0));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.08);
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + tax + serviceCharge;
  const formatPrice = p => p.toLocaleString("vi-VN") + "đ";

  const handlePlaceOrder = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate(`/customer/${tableId}/tracking`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface pb-24 relative">
      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(`/customer/${tableId}/menu`)} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span><span className="text-sm font-medium">Menu</span>
          </button>
          <h1 className="text-lg font-bold text-white">Your Cart</h1>
          <span className="w-16" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {cart.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">shopping_cart_off</span>
            <p className="text-on-surface-variant text-lg mb-2">Your cart is empty</p>
            <p className="text-on-surface-variant/50 text-sm mb-4">Add some delicious items from our menu</p>
            <button onClick={() => navigate(`/customer/${tableId}/menu`)}
              className="px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all"
              style={{ background: "rgba(255,193,116,0.15)", border: "1px solid rgba(255,193,116,0.3)", color: "#ffc174" }}>Browse Menu</button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="rounded-2xl divide-y divide-white/5" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-surface-container-high to-surface-container flex items-center justify-center text-2xl flex-shrink-0">{item.image}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{item.name}</h3>
                    {item.note && <p className="text-on-surface-variant/40 text-xs italic mt-0.5">"{item.note}"</p>}
                    <p className="font-mono text-primary text-sm font-bold">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"><span className="material-symbols-outlined text-sm">remove</span></button>
                    <span className="font-mono text-white w-6 text-center text-sm font-bold">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-primary/20 hover:bg-primary/30 flex items-center justify-center text-primary transition-colors"><span className="material-symbols-outlined text-sm">add</span></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="rounded-2xl p-5 space-y-3" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Order Summary</h3>
              <div className="flex justify-between text-on-surface-variant"><span>Subtotal</span><span className="font-mono">{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-on-surface-variant"><span>Tax (8%)</span><span className="font-mono">{formatPrice(tax)}</span></div>
              <div className="flex justify-between text-on-surface-variant"><span>Service Charge (5%)</span><span className="font-mono">{formatPrice(serviceCharge)}</span></div>
              <div className="border-t border-white/10 pt-3 flex justify-between"><span className="font-bold text-white text-lg">Total</span><span className="font-mono font-bold text-primary text-lg">{formatPrice(total)}</span></div>
            </div>

            <button onClick={handlePlaceOrder}
              className="w-full py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl hover:shadow-primary/20"
              style={{ background: "linear-gradient(to right, #f59e0b, #ffc174, #f59e0b)", color: "#472a00" }}>
              <span className="material-symbols-outlined">restaurant</span>Place Order
            </button>

            <button onClick={() => navigate(`/customer/${tableId}/menu`)}
              className="w-full py-4 rounded-xl border border-dashed border-white/15 text-on-surface-variant hover:text-white hover:border-white/30 transition-all text-sm font-medium">+ Add More Items</button>
          </>
        )}
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-3xl p-8 text-center animate-[slideUp_0.3s_cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ backdropFilter: "blur(32px)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(86,229,169,0.3)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
            <span className="material-symbols-outlined text-6xl mb-4" style={{ color: "#56e5a9" }}>check_circle</span>
            <h2 className="text-white font-bold text-xl mb-2">Order Placed!</h2>
            <p className="text-on-surface-variant/60 text-sm">Your order has been sent to the kitchen. Redirecting to tracking...</p>
          </div>
        </div>
      )}

      <UserBottomNav tableId={tableId} />
    </div>
  );
}
