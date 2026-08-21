import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import api from "@/lib/api.js";
import { formatPrice, normalizeVND } from "@/lib/price.js";
import QRCodeModal from "@/components/ui/QRCodeModal.jsx";

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
  { id: "CASH", label: "Cash", desc: "Pay at the counter", icon: "payments", color: "#60a5fa" },
  { id: "E_WALLET", label: "E-Wallet", desc: "Momo, ZaloPay", icon: "wallet", color: "#56e5a9" },
  { id: "BANK_TRANSFER", label: "Bank Transfer", desc: "Direct bank to bank", icon: "account_balance", color: "#a78bfa" },
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
  const [showQR, setShowQR] = useState(false);

  const subtotal = billItems.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.08);
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + tax + serviceCharge;

  useEffect(() => {
    const sessionId = localStorage.getItem("smartdine_sessionId");
    if (!sessionId) { setBillLoading(false); return; }
    api.get("/orders/session/" + sessionId)
      .then((res) => {
        const items = [];
        res.data.forEach((order) => {
          if (order.status === "CANCELLED") return;
          order.items?.forEach((it) => {
            if (it.status === "CANCELLED") return;
            if (!it.menuItemId) return;
            const existing = items.find((bi) => bi.name === (it.menuItemId?.name || "Item"));
            if (existing) {
              existing.qty += it.quantity;
            } else {
              items.push({
                name: it.menuItemId?.name || "Item",
                qty: it.quantity,
                price: normalizeVND(it.menuItemId?.price),
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

  const showToast = (msg, isError) => {
    setConfirmMsg({ text: msg, isError });
    setTimeout(() => setConfirmMsg(null), 3500);
  };

  const callStaff = async (msg) => {
    setSending(true);
    try {
      await api.post("/support/call", { tableId, message: msg, type: "assistance" });
      showToast('Request sent: "' + msg + '"');
      setCustomMsg("");
    } catch {
      showToast("Failed to notify staff", true);
    } finally {
      setSending(false);
    }
  };

  const handleManualPayment = async (method) => {
    setSending(true);
    try {
      if (method === "CASH") {
        // Cash: notify staff for manual processing
        const sessionId = localStorage.getItem("smartdine_sessionId");
        await api.post("/support/payment", { sessionId, tableId, message: "Customer wants to pay by cash" });
        showToast("Staff has been notified. Please wait at your table.");
        setSelectedMethod(null);
      } else {
        // E-WALLET / BANK_TRANSFER: send payment request, staff verifies later
        const sessionId = localStorage.getItem("smartdine_sessionId");
        await api.post("/support/payment", { sessionId, tableId, message: "Customer wants to pay via " + method });
        showToast("Staff will verify your payment. Please wait at your table.");
        setSelectedMethod(null);
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Payment failed", true);
    } finally {
      setSending(false);
    }
  };

  const handleQRConfirm = async () => {
    setShowQR(false);
    setSending(true);
    try {
      const sessionId = localStorage.getItem("smartdine_sessionId");
      await api.post("/support/payment", {
        sessionId,
        tableId,
        message: "Customer paid via QR (" + selectedMethod + ") for amount " + formatPrice(total)
      });
      showToast("Staff has been notified. Please wait for payment confirmation.");
      setSelectedMethod(null);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to notify staff", true);
    } finally {
      setSending(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;
    if (selectedMethod === "E_WALLET" || selectedMethod === "BANK_TRANSFER") {
      setShowQR(true);
    } else if (selectedMethod === "CASH") {
      await handleManualPayment("CASH");
    }
  };

  return (
    <div className="max-w-sm md:max-w-2xl lg:max-w-5xl mx-auto">
      {/* Toast */}
      {confirmMsg && (
        <div
          className="fixed top-24 md:top-20 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-bold animate-[slideUp_0.3s_ease]"
          style={{
            background: confirmMsg.isError ? "rgba(255,180,171,0.15)" : "rgba(86,229,169,0.15)",
            backdropFilter: "blur(16px)",
            border: confirmMsg.isError ? "1px solid rgba(255,180,171,0.3)" : "1px solid rgba(86,229,169,0.3)",
            color: confirmMsg.isError ? "#ffb4ab" : "#56e5a9",
          }}
        >
          {confirmMsg.text}
        </div>
      )}

      <h2 className="text-lg md:text-xl font-bold text-white mb-4">{t("user.support") || "Support & Payment"}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Quick Call Staff */}
          <div className="rounded-2xl p-4 md:p-6" style={glassCard}>
            <h3 className="text-[10px] md:text-xs font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-3">
              Call Staff
            </h3>
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 mb-4">
              {quickChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => callStaff(chip.label)}
                  disabled={sending}
                  className="flex items-center justify-center md:justify-start gap-1.5 px-2.5 py-3 md:px-4 md:py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-30"
                  style={{ background: chip.color + "15", border: "1px solid " + chip.color + "30", color: chip.color }}
                >
                  <span className="material-symbols-outlined text-base">{chip.icon}</span>
                  <span className="text-[10px] md:text-xs font-semibold whitespace-nowrap">{chip.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && customMsg.trim()) callStaff(customMsg); }}
                placeholder="Custom message..."
                className="flex-1 w-full px-3 py-2.5 md:px-4 md:py-3 rounded-xl text-xs md:text-sm text-on-surface placeholder-on-surface-variant/20 outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors"
              />
              <button
                onClick={() => customMsg.trim() && callStaff(customMsg)}
                disabled={sending || !customMsg.trim()}
                className="px-4 py-3 rounded-xl text-xs md:text-xs font-bold transition-all active:scale-95 disabled:opacity-30"
                style={{ background: "#ffc174", color: "#472a00" }}
              >
                Send
              </button>
            </div>
          </div>

          {/* Your Bill */}
          <div className="rounded-2xl p-4 md:p-6" style={glassCard}>
            <h3 className="text-[10px] md:text-xs font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-3">
              Your Bill
            </h3>
            {billLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : billItems.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/20 mb-2">receipt</span>
                <p className="text-on-surface-variant/40 text-xs">No orders yet</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5 mb-3">
                  {billItems.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs md:text-sm">
                      <span className="text-on-surface-variant/70">
                        {item.name}{" "}
                        <span className="text-on-surface-variant/30 text-xs">x{item.qty}</span>
                      </span>
                      <span className="text-on-surface font-mono text-xs">{formatPrice(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant/50">Subtotal</span>
                    <span className="text-on-surface">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant/50">Tax (8%)</span>
                    <span className="text-on-surface">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant/50">Service (5%)</span>
                    <span className="text-on-surface">{formatPrice(serviceCharge)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <span className="text-white font-bold">Total</span>
                    <span className="font-mono font-bold text-lg" style={{ color: "#ffc174" }}>
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Payment Methods */}
          <div className="rounded-2xl p-4 md:p-6" style={glassCard}>
            <h3 className="text-[10px] md:text-xs font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-3">
              Payment Method
            </h3>
            <div className="space-y-1.5 mb-3">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id === selectedMethod ? null : m.id)}
                  className="w-full flex items-center gap-3 p-3.5 md:p-4 rounded-2xl transition-all duration-300"
                  style={{
                    background: selectedMethod === m.id ? m.color + "10" : "rgba(255,255,255,0.03)",
                    border: selectedMethod === m.id ? "1px solid " + m.color + "50" : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: selectedMethod === m.id ? "0 0 20px " + m.color + "15" : "none",
                  }}
                >
                  <div
                    className="w-11 h-11 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: m.color + "20" }}
                  >
                    <span
                      className="material-symbols-outlined text-lg"
                      style={{ color: selectedMethod === m.id ? m.color : "rgba(255,255,255,0.5)" }}
                    >
                      {m.icon}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-xs md:text-sm" style={{ color: selectedMethod === m.id ? m.color : "#dce2f7" }}>
                      {m.label}
                    </p>
                    <p className="text-xs text-on-surface-variant/40">{m.desc}</p>
                  </div>
                  {selectedMethod === m.id && (
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ color: m.color, fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Payment action */}

            <button
              onClick={handlePayment}
              disabled={!selectedMethod || sending || billItems.length === 0}
              className="w-full py-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
              style={{
                background: "#ffc174",
                color: "#472a00",
                boxShadow: selectedMethod ? "0 0 20px rgba(255,193,116,0.25)" : "none",
              }}
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />{" "}
                  Processing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    payments
                  </span>
                  {selectedMethod === "CASH" ? "Request Cash Payment" : "Show QR & Request Payment"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <QRCodeModal
          total={total}
          sending={sending}
          onCancel={() => setShowQR(false)}
          onConfirm={handleQRConfirm}
        />
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 16px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}