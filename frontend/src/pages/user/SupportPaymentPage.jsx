import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { UserBottomNav } from "@/components/layout/UserBottomNav";
import api from "@/lib/api.js";

const formatPrice = (p) => (p || 0).toLocaleString("vi-VN") + "\u0111";

const quickMessages = ["Need water", "Need napkins", "Menu question", "Ready to pay"];

export default function SupportPaymentPage() {
  const { t } = useLang();
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [billItems, setBillItems] = useState([]);
  const [billLoading, setBillLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [confirmMsg, setConfirmMsg] = useState(null);
  const [sending, setSending] = useState(false);

  const subtotal = billItems.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + Math.round(subtotal * 0.08) + Math.round(subtotal * 0.05);

  // Fetch current session orders for bill
  useEffect(() => {
    const sessionId = localStorage.getItem("smartdine_sessionId");
    if (!sessionId) {
      setBillLoading(false);
      return;
    }

    api
      .get(`/orders/session/${sessionId}`)
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
              });
            }
          });
        });
        setBillItems(items);
      })
      .catch(() => {})
      .finally(() => setBillLoading(false));
  }, []);

  const callStaff = async (msg) => {
    setSending(true);
    try {
      await api.post("/support/call", {
        tableId,
        message: msg,
        type: "assistance",
      });
      setConfirmMsg(msg || "Staff has been notified and will be at your table shortly.");
      setTimeout(() => setConfirmMsg(null), 3000);
    } catch (err) {
      setConfirmMsg("Failed to notify staff. Please try again.");
      setTimeout(() => setConfirmMsg(null), 3000);
    } finally {
      setSending(false);
    }
  };

  const requestPayment = async (method) => {
    setSending(true);
    setSelectedMethod(method);
    try {
      const sessionId = localStorage.getItem("smartdine_sessionId");
      await api.post("/support/payment", {
        sessionId,
        tableId,
        message: `Payment requested via ${method}`,
      });
      setConfirmMsg("Payment request sent. Staff will bring your bill.");
      setShowPayment(false);
      setTimeout(() => {
        setConfirmMsg(null);
        setSelectedMethod(null);
      }, 3000);
    } catch (err) {
      setConfirmMsg("Failed to send payment request.");
      setTimeout(() => {
        setConfirmMsg(null);
        setSelectedMethod(null);
      }, 3000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface pb-24 relative">
      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-lg font-bold text-white">Support &amp; Pay</h1>
          <span className="w-16" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Confirmation Toast */}
        {confirmMsg && (
          <div className="px-4 py-3 rounded-xl flex items-center gap-3 animate-[slideDown_0.3s_ease]"
            style={{ background: confirmMsg.includes("Failed") ? "rgba(255,180,171,0.1)" : "rgba(86,229,169,0.1)", border: confirmMsg.includes("Failed") ? "1px solid rgba(255,180,171,0.3)" : "1px solid rgba(86,229,169,0.3)", color: confirmMsg.includes("Failed") ? "#ffb4ab" : "#56e5a9" }}>
            <span className="material-symbols-outlined text-lg">{confirmMsg.includes("Failed") ? "error" : "check_circle"}</span>
            <span className="text-sm font-semibold">{confirmMsg}</span>
          </div>
        )}

        {/* Call Staff */}
        <div className="rounded-2xl p-5 text-center" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "#ffc174" }}>support_agent</span>
          <h3 className="text-white font-bold text-lg mb-3">Need Assistance?</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {quickMessages.map((msg) => (
              <button
                key={msg}
                onClick={() => callStaff(msg)}
                disabled={sending}
                className="py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 hover:bg-white/10 disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#dce2f7" }}
              >
                {msg}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Custom message..."
              id="customMsg"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/30 outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <button
              onClick={() => {
                const el = document.getElementById("customMsg");
                const val = el?.value?.trim() || "Custom request";
                callStaff(val);
                if (el) el.value = "";
              }}
              disabled={sending}
              className="px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all disabled:opacity-50"
              style={{ background: "#ffc174", color: "#472a00" }}
            >
              Send
            </button>
          </div>
        </div>

        {/* Request Payment */}
        <div className="rounded-2xl p-5" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-3xl" style={{ color: "#56e5a9" }}>payments</span>
            <div>
              <h3 className="text-white font-bold">Request Payment</h3>
              <p className="text-on-surface-variant/50 text-xs">Your current bill</p>
            </div>
            {billLoading ? (
              <span className="ml-auto text-on-surface-variant/40 text-xs">{t("common.loading")}</span>
            ) : (
              <span className="ml-auto font-mono font-bold text-xl" style={{ color: "#ffc174" }}>{formatPrice(total)}</span>
            )}
          </div>
          {!showPayment ? (
            <button
              onClick={() => setShowPayment(true)}
              className="w-full py-3 rounded-xl font-bold text-sm active:scale-95 transition-all"
              style={{ background: "#56e5a9", color: "#003824" }}
            >
              Proceed to Payment
            </button>
          ) : (
            <div className="space-y-3 pt-3 border-t border-white/5">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "CASH", label: "Cash", icon: "payments" },
                  { id: "CARD", label: "Card", icon: "credit_card" },
                  { id: "BANK_TRANSFER", label: "Bank", icon: "account_balance" },
                  { id: "E_WALLET", label: "E-Wallet", icon: "wallet" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => requestPayment(m.id)}
                    disabled={sending}
                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 disabled:opacity-50 ${selectedMethod === m.id ? "bg-primary/15 border-primary/50 text-primary" : "bg-white/5 border-white/10 text-on-surface-variant hover:bg-white/10 hover:text-white"}`}
                  >
                    <span className="material-symbols-outlined text-xl">{m.icon}</span>
                    <span className="text-xs font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current Bill */}
        {billItems.length > 0 && (
          <div className="rounded-2xl p-5" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Current Bill</h3>
            <div className="space-y-2">
              {billItems.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-on-surface">{item.qty}x {item.name}</span>
                  <span className="font-mono text-on-surface-variant">{formatPrice(item.price)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-white/10 font-bold text-sm">
                <span>Total</span>
                <span className="font-mono text-primary">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="rounded-2xl p-5" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">FAQ</h3>
          {[
            { q: "How to split the bill?", a: "Ask our staff or select split payment at checkout." },
            { q: "Can I modify my order?", a: "Yes, call staff and we will adjust it for you." },
          ].map((faq, i) => (
            <details key={i} className="group mb-2 last:mb-0">
              <summary className="flex items-center justify-between cursor-pointer text-on-surface-variant hover:text-white transition-colors text-sm py-1">
                {faq.q}
                <span className="material-symbols-outlined text-lg group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-on-surface-variant/60 text-xs mt-2 pl-2 border-l border-white/10">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      <UserBottomNav tableId={tableId} />
    </div>
  );
}
