import React, { useState } from "react";
import { formatPrice } from "@/lib/price.js";

const bankList = [
  { id: "vietcombank", name: "Vietcombank", icon: "account_balance", color: "#60a5fa" },
  { id: "momo", name: "Momo", icon: "wallet", color: "#e81a9b" },
  { id: "zalopay", name: "ZaloPay", icon: "phone_android", color: "#56e5a9" },
];

export default function QRCodeModal({ total, onConfirm, onCancel, sending }) {
  const [selectedBank, setSelectedBank] = useState(bankList[0].id);
  const [countdown, setCountdown] = useState(30);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const bankInfo = bankList.find((b) => b.id === selectedBank) || bankList[0];
  const amountVND = Math.round((total || 0) * 25000);
  const qrData = encodeURIComponent(`SMARTDINE|PAY|${amountVND}VND|${selectedBank.toUpperCase()}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrData}&bgcolor=0c1322&color=ffc174&margin=10`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}>
      <div className="relative z-10 w-full max-w-sm rounded-3xl overflow-hidden animate-[slideUp_0.3s_ease]"
        style={{ background: "#141b2b", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}
        onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl" style={{ color: bankInfo.color }}>qr_code_2</span>
            <h3 className="text-white font-bold text-lg">Scan to Pay</h3>
          </div>
          <button onClick={onCancel} className="text-on-surface-variant/50 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Bank selector */}
        <div className="flex gap-2 px-5 mt-4">
          {bankList.map((b) => (
            <button key={b.id} onClick={() => setSelectedBank(b.id)}
              className={`flex-1 py-2 rounded-xl text-[10px] md:text-xs font-semibold transition-all flex items-center justify-center gap-1.5`}
              style={{
                background: selectedBank === b.id ? b.color + "20" : "rgba(255,255,255,0.05)",
                border: `1px solid ${selectedBank === b.id ? b.color + "40" : "rgba(255,255,255,0.08)"}`,
                color: selectedBank === b.id ? b.color : "rgba(255,255,255,0.5)",
              }}>
              <span className="material-symbols-outlined text-sm">{b.icon}</span>
              {b.name.split("")[0]}
            </button>
          ))}
        </div>

        {/* QR Code */}
        <div className="flex justify-center py-6">
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,193,116,0.05)", border: "1px solid rgba(255,193,116,0.15)" }}>
            <img src={qrUrl} alt="QR Payment" className="w-[220px] h-[220px] rounded-xl" />
          </div>
        </div>

        {/* Amount display */}
        <div className="text-center px-5 pb-2">
          <p className="text-on-surface-variant/40 text-[10px] uppercase tracking-wider mb-1">Total Amount</p>
          <p className="font-mono font-bold text-3xl" style={{ color: "#ffc174" }}>${(total || 0).toFixed(2)}</p>
          <p className="text-on-surface-variant/50 text-xs mt-1">≈ {amountVND.toLocaleString("vi-VN")} VND</p>
        </div>

        {/* Auto-expire */}
        <div className="text-center px-5 pb-1">
          <p className="text-on-surface-variant/30 text-[10px]">
            {countdown > 0
              ? `QR expires in ${countdown}s`
              : "QR expired. Please request a new one."}
          </p>
          {countdown === 0 && (
            <button onClick={onCancel} className="mt-2 text-xs text-primary hover:underline">Refresh QR</button>
          )}
        </div>

        {/* Confirm button */}
        <div className="p-5 pt-3">
          <button onClick={onConfirm} disabled={sending || countdown === 0}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "#ffc174", color: "#472a00", boxShadow: "0 0 20px rgba(255,193,116,0.2)" }}>
            {sending ? (
              <><div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Processing...</>
            ) : (
              <><span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> I've Paid</>
            )}
          </button>
          <p className="text-center text-on-surface-variant/25 text-[10px] mt-2">
            Open your banking app and scan the QR code
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}