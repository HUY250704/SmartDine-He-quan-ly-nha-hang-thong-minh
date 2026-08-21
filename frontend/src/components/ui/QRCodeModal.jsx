import React from "react";
import { formatPrice, normalizeVND } from "@/lib/price.js";

export default function QRCodeModal({ total, tableId, onConfirm, onCancel, sending }) {
  const amountVND = normalizeVND(total);
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}>
      <div className="relative z-10 w-full max-w-sm rounded-3xl overflow-hidden animate-[slideUp_0.3s_ease]"
        style={{ background: "#141b2b", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl" style={{ color: "#a78bfa" }}>qr_code_2</span>
            <h3 className="text-white font-bold text-lg">Quet ma QR thanh toan</h3>
          </div>
          <button onClick={onCancel} className="text-on-surface-variant/50 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center py-6">
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,193,116,0.05)", border: "1px solid rgba(255,193,116,0.15)" }}>
            {!imgError ? (
              <img
                src={`https://img.vietqr.io/image/MB-970422926710408-compact2.png?amount=${amountVND}&addInfo=Ban%20${tableId}%20Thanh%20Toan&accountName=SMARTDINE%20RESTAURANT`}
                alt="QR ngan hang"
                className="w-[220px] h-[220px] rounded-xl object-contain bg-white"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-[220px] h-[220px] rounded-xl bg-white flex flex-col items-center justify-center gap-3 p-4">
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded-sm" style={{ background: [0,2,4,6,8].includes(i) ? "#000" : "transparent" }} />
                  ))}
                </div>
                <p className="text-[#666] text-[11px] text-center leading-relaxed font-sans">
                  Vui long dat /qr-bank.png<br/>
                  vao thu muc public de<br/>
                  hien thi QR ngan hang that
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-center px-5 pb-2">
          <p className="text-on-surface-variant/40 text-[10px] uppercase tracking-wider mb-1">Tong tien</p>
          <p className="font-mono font-bold text-3xl" style={{ color: "#ffc174" }}>{formatPrice(amountVND)}</p>
        </div>

        {/* Confirm */}
        <div className="p-5 pt-3">
          <button onClick={onConfirm} disabled={sending}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "#ffc174", color: "#472a00", boxShadow: "0 0 20px rgba(255,193,116,0.2)" }}>
            {sending ? (
              <><div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Dang xu ly...</>
            ) : (
              <><span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Da thanh toan</>
            )}
          </button>
          <p className="text-center text-on-surface-variant/40 text-[10px] mt-2">
            Nhan vien se xac nhan sau khi kiem tra giao dich
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
