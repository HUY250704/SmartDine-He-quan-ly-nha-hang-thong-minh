import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { UserBottomNav } from "@/components/layout/UserBottomNav";

const initialCart = [
  { id: 1, name: "Wagyu Beef Tartare", price: 580000, qty: 2, note: "", image: "🥩" },
  { id: 5, name: "Ribeye Steak 300g", price: 950000, qty: 1, note: "Medium rare", image: "🥩" },
  { id: 7, name: "Chocolate Lava Cake", price: 280000, qty: 1, note: "", image: "🍫" },
  { id: 9, name: "Signature Old Fashioned", price: 195000, qty: 2, note: "", image: "🥃" },
];

export default function CartPage() {
  const { t } = useLang();
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
    setTimeout(() => { setShowSuccess(false); navigate(`/customer/${tableId}/tracking`); }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(circle at center, #191f2f 0%, #0c1322 100%)" }}>
        <div className="text-center p-8 rounded-3xl" style={{ backdropFilter: "blur(20px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <span className="material-symbols-outlined text-7xl text-tertiary mb-4 animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <h2 className="text-2xl font-bold text-white mb-2">{t("user.orderPlaced")}</h2>
          <p className="text-on-surface-variant text-sm">{t("user.orderPlacedDesc")}</p>
          <p className="font-mono text-primary font-bold text-xl mt-4">{formatPrice(total)}</p>
          <p className="text-on-surface-variant/40 text-xs mt-4">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface pb-24 relative">
      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(`/customer/${tableId}/menu`)} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span><span className="text-sm font-medium">{t("user.backToMenu")}</span>
          </button>
          <h1 className="text-lg font-bold text-white">{t("user.cart")}</h1>
          <span className="w-16" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {cart.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/10 mb-4">shopping_cart</span>
            <p className="text-white font-bold text-lg">{t("user.emptyCart")}</p>
            <p className="text-on-surface-variant text-sm mt-1">{t("user.emptyCartDesc")}</p>
            <button onClick={() => navigate(`/customer/${tableId}/menu`)} className="mt-6 px-6 py-3 rounded-xl text-sm font-bold bg-primary text-on-primary active:scale-95 transition-all">{t("user.backToMenu")}</button>
          </div>
        ) : (
          <>
            {cart.map(item => (
              <div key={item.id} className="rounded-2xl p-4" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">{item.image}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{item.name}</p>
                    {item.note && <p className="text-on-surface-variant/60 text-xs italic">{item.note}</p>}
                    <p className="text-primary font-mono text-sm mt-1">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-lg bg-white/10 text-on-surface-variant hover:bg-white/20 flex items-center justify-center font-bold">-</button>
                    <span className="text-white w-6 text-center font-mono">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-white/10 text-on-surface-variant hover:bg-white/20 flex items-center justify-center font-bold">+</button>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-2xl p-5 mt-6" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex justify-between text-sm mb-2"><span className="text-on-surface-variant">Subtotal</span><span className="text-on-surface">{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-sm mb-2"><span className="text-on-surface-variant">Tax (8%)</span><span className="text-on-surface">{formatPrice(tax)}</span></div>
              <div className="flex justify-between text-sm mb-4"><span className="text-on-surface-variant">Service Charge (5%)</span><span className="text-on-surface">{formatPrice(serviceCharge)}</span></div>
              <div className="flex justify-between pt-3 border-t border-white/10"><span className="text-white font-bold text-lg">{t("user.total")}</span><span className="font-mono font-bold text-xl text-primary">{formatPrice(total)}</span></div>
            </div>

            <button onClick={handlePlaceOrder} className="w-full py-4 rounded-xl font-bold text-sm active:scale-95 transition-all bg-primary text-on-primary shadow-lg shadow-primary/20">
              {t("user.submitOrder")}
            </button>
          </>
        )}
      </div>

      <UserBottomNav tableId={tableId} />
    </div>
  );
}
