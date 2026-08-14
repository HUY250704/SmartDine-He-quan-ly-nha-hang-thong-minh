import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { formatPrice } from "@/lib/price.js";

const glassCard = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const paymentLabels = {
  CASH: "Tiền mặt",
  CARD: "Thẻ",
  BANK_TRANSFER: "Chuyển khoản",
  E_WALLET: "Ví điện tử",
};

export default function BillSuccessPage() {
  const { t } = useLang();
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("smartdine_lastBill");
    if (saved) {
      try { setBill(JSON.parse(saved)); } catch {}
    }
  }, []);

  const handlePrintOrDownload = (download = false) => {
    const originalTitle = document.title;
    document.title = `SmartDine_Invoice_${bill?._id?.toString().slice(-8) || "receipt"}`;

    if (download) {
      // Trigger save as PDF via print dialog
      window.print();
    } else {
      window.print();
    }

    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  if (!bill) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center p-8 rounded-3xl max-w-sm" style={glassCard}>
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4">receipt</span>
          <h2 className="text-xl font-bold text-white mb-2">No Bill Found</h2>
          <p className="text-on-surface-variant/60 text-sm mb-4">Your session has ended or no payment was recorded.</p>
          <button onClick={() => navigate(`/customer/${tableId}`)} className="px-6 py-3 rounded-xl text-sm font-bold"
            style={{ background: "rgba(255,193,116,0.15)", border: "1px solid rgba(255,193,116,0.3)", color: "#ffc174" }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm md:max-w-md mx-auto">
      {/* Success Banner */}
      <div className="text-center mb-6 animate-[slideUp_0.5s_ease]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ background: "rgba(86,229,169,0.15)", border: "2px solid rgba(86,229,169,0.3)" }}>
          <span className="material-symbols-outlined text-4xl" style={{ color: "#56e5a9", fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Payment Successful!</h2>
        <p className="text-on-surface-variant/50 text-xs md:text-sm">
          {bill.paymentMethod === "CASH"
            ? "Please proceed to the counter to pay."
            : "Thank you for dining with us!"}
        </p>
      </div>

      {/* Bill Card */}
      <div className="rounded-2xl p-5 md:p-6 mb-6 bill-print-area" style={glassCard}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
          <div>
            <p className="text-white font-bold text-sm">Smart<span style={{ color: "#ffc174" }}>Dine</span></p>
            <p className="text-on-surface-variant/40 text-[10px]">Bill #{bill._id?.toString().slice(-8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="text-on-surface-variant/40 text-[10px]">
              {bill.paidAt ? new Date(bill.paidAt).toLocaleDateString("vi-VN") : ""}
            </p>
            <p className="text-on-surface-variant/40 text-[10px]">
              {bill.paidAt ? new Date(bill.paidAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}
            </p>
          </div>
        </div>

        {/* Table info */}
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg" style={{ background: "rgba(255,193,116,0.08)", border: "1px solid rgba(255,193,116,0.15)" }}>
          <span className="material-symbols-outlined text-primary text-sm">table_restaurant</span>
          <span className="text-white text-xs font-semibold">Table #{bill.tableNumber || tableId}</span>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-4">
          {(bill.items || []).map((item, i) => (
            <div key={i} className="flex justify-between items-start text-xs md:text-sm">
              <div className="flex-1 min-w-0">
                <span className="text-white">{item.name}</span>
                <span className="text-on-surface-variant/40 ml-1">x{item.quantity}</span>
              </div>
              <span className="text-on-surface font-mono text-xs ml-2 shrink-0">{formatPrice(Number(item.price) * (item.quantity || 1))}</span>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border-t border-white/10 pt-4 space-y-1.5 text-xs md:text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant/50">Subtotal</span>
            <span className="text-on-surface font-mono">{formatPrice(Number(bill.subtotal))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant/50">Tax (8%)</span>
            <span className="text-on-surface font-mono">{formatPrice(Number(bill.tax))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant/50">Service (5%)</span>
            <span className="text-on-surface font-mono">{formatPrice(Number(bill.serviceCharge))}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-white/10">
            <span className="text-white font-bold">Total</span>
            <span className="font-mono font-bold text-base md:text-lg" style={{ color: "#ffc174" }}>
              {formatPrice(Number(bill.total))}
            </span>
          </div>
        </div>

        {/* Payment method */}
        <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="material-symbols-outlined text-on-surface-variant/50 text-sm">payments</span>
          <span className="text-on-surface-variant/60 text-xs">{paymentLabels[bill.paymentMethod] || bill.paymentMethod}</span>
          <span className="ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
            style={{
              background: bill.paymentStatus === "PAID" ? "rgba(86,229,169,0.15)" : "rgba(255,193,116,0.15)",
              color: bill.paymentStatus === "PAID" ? "#56e5a9" : "#ffc174"
            }}>
            {bill.paymentStatus}
          </span>
        </div>
      </div>

      {/* Invoice Actions */}
      <div className="flex flex-col gap-3 mb-4 no-print">
        <button onClick={() => handlePrintOrDownload(false)}
          className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#dce2f7" }}>
          <span className="material-symbols-outlined text-lg">print</span>
          Print Invoice
        </button>
        <button onClick={() => handlePrintOrDownload(true)}
          className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ background: "rgba(86,229,169,0.12)", border: "1px solid rgba(86,229,169,0.25)", color: "#56e5a9" }}>
          <span className="material-symbols-outlined text-lg">download</span>
          Download Invoice
        </button>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 no-print">
        <button onClick={() => navigate(`/customer/${tableId}`)}
          className="flex-1 py-3 rounded-xl text-sm font-bold border border-white/10 text-white hover:bg-white/5 transition-colors">
          New Session
        </button>
        <button onClick={() => { localStorage.removeItem("smartdine_lastBill"); navigate(`/customer/${tableId}/menu`); }}
          className="flex-1 py-3 rounded-xl text-sm font-bold bg-primary text-on-primary active:scale-95 transition-all"
          style={{ boxShadow: "0 0 20px rgba(255,193,116,0.2)" }}>
          Order More
        </button>
      </div>

      {/* Print styles */}
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          body { background: white !important; color: black !important; }
          body * { visibility: hidden !important; }
          /* Show only bill content */
          .bill-print-area,
          .bill-print-area * { visibility: visible !important; color: black !important; }
          .bill-print-area { 
            position: fixed !important; 
            inset: 0 !important; 
            display: block !important; 
            max-width: 100% !important; 
            padding: 0 !important; 
          }
          .no-print { display: none !important; }
          /* Override glass effects */
          .bill-print-area [style*="background"] { background: white !important; backdrop-filter: none !important; }
          .bill-print-area [style*="border"] { border-color: #ddd !important; }
          .bill-print-area [style*="color"] { color: black !important; }
          .bill-print-area [style*="#ffc174"] { color: #d4a017 !important; }
          .bill-print-area [style*="#56e5a9"] { color: #1a8a5a !important; }
          /* Brand name */
          .bill-print-area::before {
            content: 'SmartDine - Invoice';
            display: block !important;
            font-size: 20px !important;
            font-weight: bold !important;
            text-align: center !important;
            margin-bottom: 20px !important;
            padding-bottom: 10px !important;
            border-bottom: 2px solid #333 !important;
            visibility: visible !important;
            color: black !important;
          }
          /* Footer */
          .bill-print-area::after {
            content: 'Thank you for dining with us! - www.smartdine.vn';
            display: block !important;
            font-size: 10px !important;
            text-align: center !important;
            margin-top: 30px !important;
            padding-top: 10px !important;
            border-top: 1px solid #ddd !important;
            visibility: visible !important;
            color: #666 !important;
          }
        }
      `}</style>
    </div>
  );
}
