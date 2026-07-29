import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { useCart } from "@/context/CartContext.jsx";
import { UserBottomNav } from "@/components/layout/UserBottomNav";
import api from "@/lib/api.js";

const formatPrice = (p) => {
  const vnd = typeof p === "number" ? p * 25000 : p || 0;
  return vnd.toLocaleString("vi-VN") + "\u0111";
};

const glassCard = {
  backdropFilter: "blur(16px)",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 8px 32px 0 rgba(0,0,0,0.37)",
};

export default function CartPage() {
  const { t } = useLang();
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { cart, updateQty, updateNote, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [clearing, setClearing] = useState(false);

  const subtotal = cart.reduce((s, i) => s + (i.price || 0) * 25000 * i.qty, 0);
  const tax = Math.round(subtotal * 0.08);
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + tax + serviceCharge;

  const handleClear = () => {
    setClearing(true);
    setTimeout(() => {
      clearCart();
      setClearing(false);
    }, 300);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    const sessionId = localStorage.getItem("smartdine_sessionId");
    if (!sessionId) {
      setOrderError(t("user.sessionNotFound") || "Session not found. Please scan QR again.");
      return;
    }
    setSubmitting(true);
    setOrderError("");
    try {
      const items = cart.map((i) => ({ menuItemId: i._id, quantity: i.qty, note: i.note || "" }));
      await api.post("/orders", { sessionId, items });
      clearCart();
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); navigate(`/customer/${tableId}/tracking`); }, 2500);
    } catch (err) {
      setOrderError(err.response?.data?.error || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(circle at center, #191f2f 0%, #0c1322 100%)" }}>
        <div className="text-center p-8 rounded-3xl glass-card animate-pulse-soft" style={glassCard}>
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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(`/customer/${tableId}/menu`)} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm font-medium">{t("user.backToMenu")}</span>
          </button>
          <div className="flex items-center gap-4">
            {cart.length > 0 && (
              <button onClick={handleClear} className="flex items-center gap-1.5 text-xs font-semibold text-error/70 hover:text-error transition-colors">
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                Clear All
              </button>
            )}
            <span className="text-lg font-bold text-white">{t("user.cart")}</span>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Error */}
        {orderError && (
          <div className="px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,180,171,0.1)", border: "1px solid rgba(255,180,171,0.3)", color: "#ffb4ab" }}>
            <span className="material-symbols-outlined text-sm mr-2 align-text-bottom">error</span>
            {orderError}
          </div>
        )}

        {/* Empty State */}
        {cart.length === 0 && !clearing ? (
          <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center gap-4" style={{
            ...glassCard,
            opacity: clearing ? 0 : 1,
            transform: clearing ? "translateY(20px)" : "none",
            transition: "opacity 0.3s, transform 0.3s",
          }}>
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/20" style={{ fontVariationSettings: "'FILL' 0" }}>shopping_cart_off</span>
            <h3 className="text-xl font-bold text-white">{t("user.emptyCart")}</h3>
            <p className="text-on-surface-variant/60 text-sm">Time to discover our exquisite menu.</p>
            <button
              onClick={() => navigate(`/customer/${tableId}/menu`)}
              className="px-8 py-3 rounded-full font-bold text-sm bg-primary text-on-primary active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              {t("user.menu")}
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3">
              {cart.map((item) => {
                const itemTotal = (item.price || 0) * 25000 * item.qty;
                return (
                  <div key={item._id} className="rounded-2xl p-4 flex gap-4 items-center transition-all duration-300" style={glassCard}>
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface-variant/20 text-2xl">restaurant</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                      <input
                        type="text"
                        placeholder={t("user.note") + "..."}
                        value={item.note || ""}
                        onChange={(e) => updateNote(item._id, e.target.value)}
                        className="mt-1.5 w-full bg-white/5 rounded-lg px-2.5 py-1.5 text-xs text-on-surface-variant placeholder-on-surface-variant/30 outline-none border border-white/5 focus:border-primary/30 transition-colors"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQty(item._id, -1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
                          >
                            <span className="material-symbols-outlined text-sm">remove</span>
                          </button>
                          <span className="text-white text-sm w-6 text-center font-mono font-semibold">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item._id, 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                          </button>
                        </div>
                        <span className="font-mono font-bold text-sm" style={{ color: "#ffc174" }}>{formatPrice(itemTotal)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="rounded-2xl p-5" style={glassCard}>
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant/40">receipt</span>
                    Subtotal
                  </span>
                  <span className="text-on-surface font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant/40">percent</span>
                    Tax (8%)
                  </span>
                  <span className="text-on-surface font-medium">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant/40">room_service</span>
                    Service Charge (5%)
                  </span>
                  <span className="text-on-surface font-medium">{formatPrice(serviceCharge)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white font-bold text-lg">{t("user.total")}</span>
                  <span className="font-mono font-bold text-xl" style={{ color: "#ffc174" }}>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Place Order */}
            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              style={{ background: "#ffc174", color: "#472a00", boxShadow: "0 0 20px rgba(255,193,116,0.25)" }}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Placing order...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
                  {t("user.submitOrder")}
                </>
              )}
            </button>
            <p className="text-center text-on-surface-variant/40 text-[11px]">
              By placing order you agree to our <span className="underline cursor-pointer hover:text-on-surface-variant/60">Terms of Service</span>
            </p>

            {/* Payment Methods */}
            <div className="pt-2 space-y-3">
              <span className="text-[10px] text-on-surface-variant/30 uppercase tracking-widest block text-center">Accepted Payments</span>
              <div className="flex justify-center gap-3 opacity-40 hover:opacity-70 transition-opacity duration-500">
                <div className="w-10 h-6 rounded bg-white/10 flex items-center justify-center text-[9px] font-bold text-on-surface-variant/50">VISA</div>
                <div className="w-10 h-6 rounded bg-white/10 flex items-center justify-center text-[9px] font-bold text-on-surface-variant/50">MC</div>
                <div className="w-10 h-6 rounded bg-white/10 flex items-center justify-center text-[9px] font-bold text-on-surface-variant/50">MOMO</div>
                <div className="w-10 h-6 rounded bg-white/10 flex items-center justify-center text-[9px] font-bold text-on-surface-variant/50">CASH</div>
              </div>
            </div>
          </>
        )}
      </div>

      <UserBottomNav tableId={tableId} />
    </div>
  );
}
