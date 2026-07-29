import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { UserBottomNav } from "@/components/layout/UserBottomNav";

const quickMessages = ["Need water", "Need napkins", "Menu question", "Ready to pay"];

export default function SupportPaymentPage() {
  const { t } = useLang();
  
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [confirmMsg, setConfirmMsg] = useState(null);

  const formatPrice = p => p.toLocaleString("vi-VN") + "đ";

  const billItems = [
    { name: "Wagyu Beef Tartare", qty: 2, price: 580000 },
    { name: "Ribeye Steak 300g", qty: 1, price: 950000 },
    { name: "Chocolate Lava Cake", qty: 1, price: 280000 },
    { name: "Signature Old Fashioned", qty: 2, price: 195000 },
  ];
  const subtotal = billItems.reduce((s,i) => s + i.price * i.qty, 0);
  const total = subtotal + Math.round(subtotal * 0.08) + Math.round(subtotal * 0.05);

  const callStaff = (msg) => {
    setConfirmMsg(msg || "Staff has been notified and will be at your table shortly.");
    setTimeout(() => setConfirmMsg(null), 3000);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface pb-24 relative">
      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span><span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-lg font-bold text-white">Support & Pay</h1>
          <span className="w-16" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Confirmation Toast */}
        {confirmMsg && (
          <div className="px-4 py-3 rounded-xl flex items-center gap-3 animate-[slideDown_0.3s_ease]"
            style={{ background: "rgba(86,229,169,0.1)", border: "1px solid rgba(86,229,169,0.3)", color: "#56e5a9" }}>
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span className="text-sm font-semibold">{confirmMsg}</span>
          </div>
        )}

        {/* Call Staff */}
        <div className="rounded-2xl p-5 text-center" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "#ffc174" }}>support_agent</span>
          <h3 className="text-white font-bold text-lg mb-3">Need Assistance?</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {quickMessages.map(msg => (
              <button key={msg} onClick={() => callStaff(msg)}
                className="py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#dce2f7" }}>{msg}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Custom message..." id="customMsg"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/30 outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <button onClick={() => { const el = document.getElementById("customMsg"); callStaff(el?.value || "Custom request"); if (el) el.value = ""; }}
              className="px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
              style={{ background: "#ffc174", color: "#472a00" }}>Send</button>
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
            <span className="ml-auto font-mono font-bold text-xl" style={{ color: "#ffc174" }}>{formatPrice(total)}</span>
          </div>
          {!showPayment ? (
            <button onClick={() => setShowPayment(true)}
              className="w-full py-3 rounded-xl font-bold text-sm active:scale-95 transition-all"
              style={{ background: "#56e5a9", color: "#003824" }}>Proceed to Payment</button>
          ) : (
            <div className="space-y-3 pt-3 border-t border-white/5">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "cash", label: "Cash", icon: "payments" },
                  { id: "card", label: "Card", icon: "credit_card" },
                  { id: "momo", label: "Momo", icon: "wallet" },
                  { id: "bank", label: "Bank", icon: "account_balance" },
                ].map(m => (
                  <button key={m.id} onClick={() => setSelectedMethod(m.id)}
                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${selectedMethod === m.id ? "bg-primary/15 border-primary/50 text-primary" : "bg-white/5 border-white/10 text-on-surface-variant hover:bg-white/10 hover:text-white"}`}>
                    <span className="material-symbols-outlined text-xl">{m.icon}</span><span className="text-xs font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
              {selectedMethod && (
                <button onClick={() => { setConfirmMsg("Payment request sent. Staff will bring your bill."); setShowPayment(false); setSelectedMethod(null); }}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                  style={{ background: "#56e5a9", color: "#003824" }}>
                  <span className="material-symbols-outlined text-lg">lock</span>Pay {formatPrice(total)}
                </button>
              )}
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="rounded-2xl p-5" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">FAQ</h3>
          {[
            { q: "How to split the bill?", a: "Ask our staff or select split payment at checkout." },
            { q: "Can I modify my order?", a: "Yes, call staff and we will adjust it for you." },
          ].map((faq, i) => (
            <details key={i} className="group mb-2 last:mb-0">
              <summary className="flex items-center justify-between cursor-pointer text-on-surface-variant hover:text-white transition-colors text-sm py-1">{faq.q}<span className="material-symbols-outlined text-lg group-open:rotate-180 transition-transform">expand_more</span></summary>
              <p className="text-on-surface-variant/60 text-xs mt-2 pl-2 border-l border-white/10">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      <UserBottomNav tableId={tableId} />
    </div>
  );
}


