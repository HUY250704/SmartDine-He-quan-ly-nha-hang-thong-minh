import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { useCart } from "@/context/CartContext.jsx";
import api from "@/lib/api.js";
import { formatPrice, normalizeVND } from "@/lib/price.js";

const glassCard = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
};

export default function CartPage() {
  const { t } = useLang();
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { cart, updateQty, updateNote, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [editingNote, setEditingNote] = useState(null);

  const subtotal = cart.reduce((s, i) => s + normalizeVND(i.price) * i.qty, 0);
  const tax = Math.round(subtotal * 0.08);
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + tax + serviceCharge;

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
      <div className="flex items-center justify-center py-32">
        <div className="text-center p-8 rounded-3xl max-w-sm" style={glassCard}>
          <span className="material-symbols-outlined text-6xl text-tertiary mb-4 animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{t("user.orderPlaced")}</h2>
          <p className="text-on-surface-variant/60 text-sm mb-4">{t("user.orderPlacedDesc")}</p>
          <p className="font-mono text-primary font-bold text-xl">{formatPrice(total)}</p>
          <p className="text-on-surface-variant/30 text-xs mt-4">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 max-w-sm md:max-w-2xl lg:max-w-[1200px] mx-auto pb-20 lg:pb-0">
      {/* Left: Cart Items */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-bold text-white">{t("user.cart") || "My Cart"}</h2>
          {cart.length > 0 && (
            <button onClick={clearCart} className="flex items-center gap-1.5 text-xs font-semibold text-error/70 hover:text-error transition-colors">
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              Clear All
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-12 md:py-20 rounded-2xl" style={glassCard}>
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4">shopping_cart</span>
            <p className="text-on-surface-variant/50 text-sm mb-4">{t("user.emptyCart") || "Your cart is empty"}</p>
            <button onClick={() => navigate(`/customer/${tableId}/menu`)} className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: "rgba(255,193,116,0.15)", border: "1px solid rgba(255,193,116,0.3)", color: "#ffc174" }}>
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => {
              const itemTotal = normalizeVND(item.price) * item.qty;
              return (
                <div key={item._id} className="flex gap-3 p-3 md:p-4 rounded-2xl group" style={glassCard}>
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white/5 overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant/20 text-2xl">restaurant</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-white font-semibold text-xs md:text-sm truncate">{item.name}</h3>
                      <button onClick={() => updateQty(item._id, -item.qty)} className="text-on-surface-variant/30 hover:text-error transition-colors shrink-0">
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>

                    {editingNote === item._id ? (
                      <input autoFocus value={item.note || ""} onChange={(e) => updateNote(item._id, e.target.value)}
                        onBlur={() => setEditingNote(null)} onKeyDown={(e) => { if (e.key === "Enter") setEditingNote(null); }}
                        placeholder="Add a note..."
                        className="mt-1 w-full px-2 py-1 text-xs rounded-lg outline-none"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,193,116,0.3)", color: "#dce2f7" }} />
                    ) : (
                      <button onClick={() => setEditingNote(item._id)} className="mt-1 text-xs text-on-surface-variant/40 hover:text-primary transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">edit_note</span>
                        {item.note || "Add note"}
                      </button>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <button onClick={() => updateQty(item._id, -1)} className="w-9 h-9 md:w-8 md:h-8 flex items-center justify-center text-on-surface-variant/60 hover:text-white transition-colors rounded-lg">
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span className="text-white text-sm font-mono w-7 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item._id, 1)} className="w-9 h-9 md:w-8 md:h-8 flex items-center justify-center text-on-surface-variant/60 hover:text-white transition-colors rounded-lg">
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                      <span className="font-mono font-bold text-xs md:text-sm" style={{ color: "#ffc174" }}>{formatPrice(itemTotal)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Order Summary */}
      <div className="w-[340px] shrink-0 hidden lg:block">
        <div className="sticky top-20 rounded-2xl p-6 space-y-5" style={{ ...glassCard, border: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 className="text-xs md:text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Order Summary</h3>
          {cart.length === 0 ? (
            <p className="text-on-surface-variant/40 text-xs">Add items to see your order summary.</p>
          ) : (
            <>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-on-surface-variant/60">
                    <span className="material-symbols-outlined text-sm">receipt</span>
                    Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} items)
                  </span>
                  <span className="text-on-surface font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant/60">Tax (8%)</span>
                  <span className="text-on-surface font-medium">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant/60">Service (5%)</span>
                  <span className="text-on-surface font-medium">{formatPrice(serviceCharge)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white font-bold text-base">Total</span>
                  <span className="font-mono font-bold text-base md:text-lg" style={{ color: "#ffc174" }}>{formatPrice(total)}</span>
                </div>
              </div>

              {orderError && (
                <div className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(255,180,171,0.1)", border: "1px solid rgba(255,180,171,0.3)", color: "#ffb4ab" }}>
                  {orderError}
                </div>
              )}

              <button onClick={handlePlaceOrder} disabled={submitting}
                className="w-full py-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "#ffc174", color: "#472a00", boxShadow: "0 0 20px rgba(255,193,116,0.2)" }}>
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Processing...</>
                ) : (
                  <><span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
                  {t("user.submitOrder") || "Place Order"}</>
                )}
              </button>
              <p className="text-center text-on-surface-variant/30 text-[11px]">By placing order you agree to our Terms of Service</p>
            </>
          )}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4" style={{ background: "rgba(12,19,34,0.95)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-bold text-sm md:text-base">{cart.reduce((s, i) => s + i.qty, 0)} items</span>
            <span className="font-mono font-bold text-base md:text-lg" style={{ color: "#ffc174" }}>{formatPrice(total)}</span>
          </div>
          <button onClick={handlePlaceOrder} disabled={submitting}
            className="w-full py-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "#ffc174", color: "#472a00" }}>
            {submitting ? "Processing..." : `${t("user.submitOrder") || "Place Order"} - ${formatPrice(total)}`}
          </button>
        </div>
      )}
    </div>
  );
}
