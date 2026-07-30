import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { UserBottomNav } from "@/components/layout/UserBottomNav";
import api from "@/lib/api.js";
import { formatVND } from "@/lib/price.js";

const formatPrice = (p) => (p || 0).toLocaleString("vi-VN") + "\u0111";

const glassCard = {
  backdropFilter: "blur(16px)",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "inset 1px 1px 0px rgba(255,255,255,0.1)",
};

const quickChips = [
  { label: "Need water", icon: "water_drop", color: "#60a5fa" },
  { label: "Need napkins", icon: "cleaning_services", color: "#a78bfa" },
  { label: "Menu question", icon: "menu_book", color: "#ffc174" },
  { label: "Ready to pay", icon: "credit_card", color: "#56e5a9" },
];

const paymentMethods = [
  { id: "CARD", label: "Credit Card", desc: "VISA / Mastercard", icon: "credit_card", iconBg: "rgba(255,193,116,0.15)" },
  { id: "E_WALLET", label: "E-Wallet", desc: "Momo, ZaloPay", icon: "wallet", iconBg: "rgba(86,229,169,0.15)" },
  { id: "BANK_TRANSFER", label: "Bank Transfer", desc: "Direct bank to bank", icon: "account_balance", iconBg: "rgba(167,139,250,0.15)" },
  { id: "CASH", label: "Cash", desc: "Pay at the counter", icon: "payments", iconBg: "rgba(96,165,250,0.15)" },
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

  const subtotal = billItems.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.08);
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + tax + serviceCharge;

  useEffect(() => {
    const sessionId = localStorage.getItem("smartdine_sessionId");
    if (!sessionId) { setBillLoading(false); return; }
    api.get(`/orders/session/${sessionId}`)
      .then((res) => {
        const items = [];
        res.data.forEach((order) => {
          order.items?.forEach((it) => {
            const existing = items.find((bi) => bi.name === (it.menuItemId?.name || "Item"));
            if (existing) {
              existing.qty += it.quantity;
              existing.price += (it.menuItemId?.price || 0) * it.quantity * 25000;
            } else {
              items.push({
                name: it.menuItemId?.name || "Item",
                qty: it.quantity,
                price: (it.menuItemId?.price || 0) * it.quantity * 25000,
                image: it.menuItemId?.image || "",
              });
            }
          });
        });
        setBillItems(items);
      })
      .catch(() => {})
      .finally(() => setBillLoading(false));
  }, []);

  const showToast = (msg, isError = false) => {
    setConfirmMsg({ text: msg, isError });
    setTimeout(() => setConfirmMsg(null), 3500);
  };

  const callStaff = async (msg) => {
    setSending(true);
    try {
      await api.post("/support/call", { tableId, message: msg, type: "assistance" });
      showToast(`Request sent: "${msg}"`);
    } catch {
      showToast("Failed to notify staff", true);
    } finally {
      setSending(false);
    }
  };

  const requestPayment = async () => {
    if (!selectedMethod) return;
    setSending(true);
    try {
      const sessionId = localStorage.getItem("smartdine_sessionId");
      await api.post("/support/payment", { sessionId, tableId, message: `Payment requested via ${selectedMethod}` });
      showToast("Bill request received. Preparing your final check.");
      setSelectedMethod(null);
    } catch {
      showToast("Failed to send payment request", true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen text-on-surface pb-24 relative" style={{
      background: "#0c1322",
      backgroundImage: "radial-gradient(circle at 0% 0%, rgba(255,193,116,0.05) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(236,106,6,0.05) 0%, transparent 50%)",
    }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-lg font-bold text-white">Support &amp; Pay</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>table_restaurant</span>
            <span className="text-xs font-bold text-white">Table <span style={{ color: "#ffc174" }}>#{tableId}</span></span>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Toast */}
        {confirmMsg && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-full flex items-center gap-3 animate-[slideUp_0.4s_ease] shadow-lg"
            style={{
              background: confirmMsg.isError ? "rgba(255,180,171,0.9)" : "rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              border: confirmMsg.isError ? "1px solid rgba(255,180,171,0.4)" : "1px solid rgba(255,255,255,0.2)",
              color: confirmMsg.isError ? "#690005" : "#dce2f7",
            }}>
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1", color: confirmMsg.isError ? "#690005" : "#ffc174" }}>
              {confirmMsg.isError ? "error" : "info"}
            </span>
            <span className="text-sm font-semibold">{confirmMsg.text}</span>
          </div>
        )}

        {/* Hero intro */}
        <div className="text-center pt-2 pb-4">
          <h2 className="text-2xl font-bold text-white mb-1">Need help?</h2>
          <p className="text-on-surface-variant/50 text-sm">We are here to serve you</p>
        </div>

        {/* Need Assistance */}
        <div className="rounded-2xl p-5" style={glassCard}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,193,116,0.15)", color: "#ffc174" }}>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Need Assistance?</h3>
              <p className="text-on-surface-variant/50 text-xs">Tap a quick request</p>
            </div>
          </div>

          {/* Quick chips */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {quickChips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => callStaff(chip.label)}
                disabled={sending}
                className="flex items-center gap-2.5 p-3 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95 hover:scale-[1.02] disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#dce2f7",
                }}
              >
                <span className="material-symbols-outlined text-base" style={{ color: chip.color }}>{chip.icon}</span>
                {chip.label}
              </button>
            ))}
          </div>

          {/* Custom message input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Write custom message..."
              id="customMsg"
              className="flex-1 px-4 py-3 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/30 outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = e.currentTarget.value.trim();
                  if (val) { callStaff(val); e.currentTarget.value = ""; }
                }
              }}
            />
            <button
              onClick={() => {
                const el = document.getElementById("customMsg");
                const val = el?.value?.trim();
                if (val) { callStaff(val); el.value = ""; }
              }}
              disabled={sending}
              className="px-4 py-3 rounded-xl text-sm font-bold active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: "#ffc174", color: "#472a00", boxShadow: "0 0 20px rgba(255,193,116,0.2)" }}
            >
              <span className="material-symbols-outlined text-lg">send</span>
              Send
            </button>
          </div>

          {/* Response time */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
            <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
            <p className="text-xs text-on-surface-variant/50">Our team typically responds within <span style={{ color: "#56e5a9" }}>2-3 minutes</span></p>
          </div>
        </div>

        {/* Request Bill & Payment */}
        <div className="rounded-2xl p-5" style={glassCard}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(86,229,169,0.15)", color: "#56e5a9" }}>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Your Bill</h3>
              <p className="text-on-surface-variant/50 text-xs">Review and proceed to payment</p>
            </div>
          </div>

          {/* Bill items */}
          {billLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : billItems.length === 0 ? (
            <p className="text-center text-on-surface-variant/30 text-sm py-6">No items ordered yet</p>
          ) : (
            <div className="space-y-2 mb-4">
              {billItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "rgba(255,255,255,0.08)", color: "#dce2f7" }}>
                      {item.qty}
                    </div>
                    <span className="text-sm text-on-surface">{item.name}</span>
                  </div>
                  <span className="font-mono text-sm text-on-surface-variant">{formatVND(item.price)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="text-on-surface font-medium">{formatVND(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Tax (8%)</span>
              <span className="text-on-surface font-medium">{formatVND(tax)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Service (5%)</span>
              <span className="text-on-surface font-medium">{formatVND(serviceCharge)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-white/10">
              <span className="text-white font-bold text-lg">Total</span>
              <span className="font-mono font-bold text-xl" style={{ color: "#ffc174" }}>{formatVND(total)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Select Payment Method</p>
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id === selectedMethod ? null : method.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 glass-button ${
                  selectedMethod === method.id ? "" : ""
                }`}
                style={{
                  background: selectedMethod === method.id ? "rgba(255,193,116,0.08)" : "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(8px)",
                  border: selectedMethod === method.id ? "1px solid rgba(255,193,116,0.5)" : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: selectedMethod === method.id ? "0 0 20px rgba(255,193,116,0.1)" : "none",
                }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: method.iconBg }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: selectedMethod === method.id ? "#ffc174" : "rgba(255,255,255,0.5)" }}>
                    {method.icon}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm" style={{ color: selectedMethod === method.id ? "#ffc174" : "#dce2f7" }}>{method.label}</p>
                  <p className="text-xs text-on-surface-variant">{method.desc}</p>
                </div>
                {selectedMethod === method.id && (
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                )}
              </button>
            ))}
          </div>

          {/* Checkout button */}
          <button
            onClick={requestPayment}
            disabled={!selectedMethod || sending}
            className="w-full mt-6 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed glow-primary"
            style={{
              background: "#ffc174",
              color: "#472a00",
              boxShadow: selectedMethod ? "0 0 20px rgba(255,193,116,0.25)" : "none",
            }}
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                Proceed to Checkout
              </>
            )}
          </button>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl p-5" style={glassCard}>
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm" style={{ color: "#a78bfa" }}>help</span>
            Frequently Asked Questions
          </h3>
          {[
            { q: "How to split the bill?", a: "Ask our staff when they arrive or select split payment at checkout." },
            { q: "Can I modify my order?", a: "Yes! Call staff and we'll adjust your order right away." },
            { q: "What payment methods are accepted?", a: "We accept VISA, Mastercard, Momo, ZaloPay, bank transfer, and cash." },
          ].map((faq, i) => (
            <details key={i} className="group mb-2 last:mb-0">
              <summary className="flex items-center justify-between cursor-pointer text-on-surface-variant hover:text-white transition-colors text-sm py-1.5">
                {faq.q}
                <span className="material-symbols-outlined text-lg group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-on-surface-variant/50 text-xs mt-1.5 pl-3 border-l border-white/10 py-1">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes pulse-ring { 0% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.05); opacity: 0.8; } 100% { transform: scale(0.95); opacity: 0.5; } }
      `}</style>

      <UserBottomNav tableId={tableId} />
    </div>
  );
}


