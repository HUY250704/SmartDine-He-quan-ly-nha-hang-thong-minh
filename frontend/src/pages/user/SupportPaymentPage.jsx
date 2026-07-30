import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import api from "@/lib/api.js";
import { formatPrice } from "@/lib/price.js";

const glassCard = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const quickChips = [
  { label: "Need water", icon: "water_drop", color: "#60a5fa" },
  { label: "Need napkins", icon: "cleaning_services", color: "#a78bfa" },
  { label: "Menu question", icon: "menu_book", color: "#ffc174" },
  { label: "Ready to pay", icon: "credit_card", color: "#56e5a9" },
];

const paymentMethods = [
  { id: "CARD", label: "Credit Card", desc: "VISA / Mastercard", icon: "credit_card", color: "#ffc174" },
  { id: "E_WALLET", label: "E-Wallet", desc: "Momo, ZaloPay", icon: "wallet", color: "#56e5a9" },
  { id: "BANK_TRANSFER", label: "Bank Transfer", desc: "Direct bank to bank", icon: "account_balance", color: "#a78bfa" },
  { id: "CASH", label: "Cash", desc: "Pay at the counter", icon: "payments", color: "#60a5fa" },
];

export default function SupportPaymentPage() {
  const { t } = useLang();
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [billItems, setBillItems] = useState([]);
  const [billLoading, setBillLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [confirmMsg, setConfirmMsg] = useState(null);
  const [sending, setSending] = useState(false);
  const [customMsg, setCustomMsg] = useState("");

  const subtotal = billItems.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.08);
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + tax + serviceCharge;

  useEffect(() => {
    const sessionId = localStorage.getItem("smartdine_sessionId");
    if (!sessionId) { setBillLoading(false); return; }
    api.get(`/orders/session/${sessionId}`).then((res) => {
      const items = [];
      res.data.forEach((order) => {
        order.items?.forEach((it) => {
          const existing = items.find((bi) => bi.name === (it.menuItemId?.name || "Item"));
          if (existing) { existing.qty += it.quantity; existing.price += (it.menuItemId?.price || 0) * it.quantity * 25000; }
          else items.push({ name: it.menuItemId?.name || "Item", qty: it.quantity, price: (it.menuItemId?.price || 0) * it.quantity * 25000, image: it.menuItemId?.image || "" });
        });
      });
      setBillItems(items);
    }).catch(() => {}).finally(() => setBillLoading(false));
  }, []);

  const showToast = (msg, isError) => {
    setConfirmMsg({ text: msg, isError });
    setTimeout(() => setConfirmMsg(null), 3500);
  };

  const callStaff = async (msg) => {
    setSending(true);
    try {
      await api.post("/support/call", { tableId, message: msg, type: "assistance" });
      showToast(`Request sent: "${msg}"`);
      setCustomMsg("");
    } catch { showToast("Failed to notify staff", true); }
    finally { setSending(false); }
  };

  const requestPayment = async () => {
    if (!selectedMethod) return;
    setSending(true);
    try {
      const sessionId = localStorage.getItem("smartdine_sessionId");
      await api.post("/support/payment", { sessionId, tableId, message: `Payment requested via ${selectedMethod}` });
      showToast("Bill request received. Preparing your final check.");
      setSelectedMethod(null);
    } catch { showToast("Failed to send payment request", true); }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Toast */}
      {confirmMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-bold animate-[slideUp_0.3s_ease]" style={{
          background: confirmMsg.isError ? "rgba(255,180,171,0.15)" : "rgba(86,229,169,0.15)",
          backdropFilter: "blur(16px)",
          border: confirmMsg.isError ? "1px solid rgba(255,180,171,0.3)" : "1px solid rgba(86,229,169,0.3)",
          color: confirmMsg.isError ? "#ffb4ab" : "#56e5a9",
        }}>{confirmMsg.text}</div>
      )}

      <h2 className="text-xl font-bold text-white mb-6">{t("user.support") || "Support & Payment"}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Quick Call Staff */}
          <div className="rounded-2xl p-6" style={glassCard}>
            <h3 className="text-xs font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-4">Call Staff</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {quickChips.map((chip, i) => (
                <button key={i} onClick={() => callStaff(chip.label)} disabled={sending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  style={{ background: `${chip.color}15`, border: `1px solid ${chip.color}30`, color: chip.color }}>
                  <span className="material-symbols-outlined text-sm">{chip.icon}</span>
                  {chip.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={customMsg} onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Custom message..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#dce2f7" }}
                onKeyDown={(e) => { if (e.key === "Enter" && customMsg.trim()) callStaff(customMsg.trim()); }}
              />
              <button onClick={() => { if (customMsg.trim()) callStaff(customMsg.trim()); }} disabled={sending || !customMsg.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
                style={{ background: "#ffc174", color: "#472a00" }}>
                {sending ? <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> : "Send"}
              </button>
            </div>
          </div>

          {/* FAQ */}
          <div className="rounded-2xl p-6" style={glassCard}>
            <h3 className="text-xs font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm" style={{ color: "#a78bfa" }}>help</span>
              Frequently Asked Questions
            </h3>
            {[
              { q: "How to split the bill?", a: "Ask our staff when they arrive or select split payment at checkout." },
              { q: "Can I modify my order?", a: "Yes! Call staff and we'll adjust your order right away." },
              { q: "What payment methods are accepted?", a: "We accept VISA, Mastercard, Momo, ZaloPay, bank transfer, and cash." },
            ].map((faq, i) => (
              <details key={i} className="group mb-2 last:mb-0">
                <summary className="flex items-center justify-between cursor-pointer text-on-surface-variant/70 hover:text-white transition-colors text-sm py-2">
                  {faq.q}
                  <span className="material-symbols-outlined text-lg group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <p className="text-on-surface-variant/40 text-xs mt-1.5 pl-3 border-l border-white/10 py-1">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Right Column: Bill & Payment */}
        <div className="space-y-6">
          {/* Bill Summary */}
          <div className="rounded-2xl p-6" style={glassCard}>
            <h3 className="text-xs font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-4">Your Bill</h3>
            {billLoading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
            ) : billItems.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/20 mb-2">receipt</span>
                <p className="text-on-surface-variant/40 text-xs">No orders yet</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {billItems.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-on-surface-variant/70">{item.name} <span className="text-on-surface-variant/30 text-xs">x{item.qty}</span></span>
                      <span className="text-on-surface font-mono text-xs">{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-on-surface-variant/50">Subtotal</span><span className="text-on-surface">{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant/50">Tax (8%)</span><span className="text-on-surface">{formatPrice(tax)}</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant/50">Service (5%)</span><span className="text-on-surface">{formatPrice(serviceCharge)}</span></div>
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <span className="text-white font-bold">Total</span>
                    <span className="font-mono font-bold text-lg" style={{ color: "#ffc174" }}>{formatPrice(total)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Payment Methods */}
          <div className="rounded-2xl p-6" style={glassCard}>
            <h3 className="text-xs font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-4">Payment Method</h3>
            <div className="space-y-2 mb-4">
              {paymentMethods.map((m) => (
                <button key={m.id} onClick={() => setSelectedMethod(m.id === selectedMethod ? null : m.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300"
                  style={{
                    background: selectedMethod === m.id ? `${m.color}10` : "rgba(255,255,255,0.03)",
                    border: selectedMethod === m.id ? `1px solid ${m.color}50` : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: selectedMethod === m.id ? `0 0 20px ${m.color}15` : "none",
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${m.color}20` }}>
                    <span className="material-symbols-outlined text-lg" style={{ color: selectedMethod === m.id ? m.color : "rgba(255,255,255,0.5)" }}>{m.icon}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm" style={{ color: selectedMethod === m.id ? m.color : "#dce2f7" }}>{m.label}</p>
                    <p className="text-xs text-on-surface-variant/40">{m.desc}</p>
                  </div>
                  {selectedMethod === m.id && (
                    <span className="material-symbols-outlined text-xl" style={{ color: m.color, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  )}
                </button>
              ))}
            </div>
            <button onClick={requestPayment} disabled={!selectedMethod || sending}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "#ffc174", color: "#472a00", boxShadow: selectedMethod ? "0 0 20px rgba(255,193,116,0.25)" : "none" }}>
              {sending ? (
                <><div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Processing...</>
              ) : (
                <><span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span> Proceed to Checkout</>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes slideUp { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
    </div>
  );
}
