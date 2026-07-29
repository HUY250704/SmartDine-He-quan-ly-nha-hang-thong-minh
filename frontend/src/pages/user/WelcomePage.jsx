import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserBottomNav } from "@/components/layout/UserBottomNav";
import { useLang } from "@/context/LanguageContext.jsx";

export default function WelcomePage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden" style={{ background: "radial-gradient(circle at center, #191f2f 0%, #0c1322 100%)" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-floating" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-tertiary/5 rounded-full blur-[80px] animate-floating" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] animate-floating" style={{ animationDelay: "4s" }} />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-10 animate-floating">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(255,193,116,0.15)]">
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
          </div>
          <h1 className="text-[48px] md:text-6xl font-bold tracking-[-0.02em] text-white mb-2">Smart<span style={{ color: "#ffc174" }}>Dine</span></h1>
          <p className="text-on-surface-variant text-lg">{t("user.welcome")}</p>
          <div className="w-12 h-1 mx-auto mt-4 rounded-full bg-gradient-to-r from-primary via-primary-container to-transparent" />
        </div>

        <div className="rounded-3xl p-6 space-y-4" style={{ backdropFilter: "blur(20px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px 0 rgba(0,0,0,0.37)" }}>
          <div className="text-center pb-4 border-b border-white/5">
            <p className="text-on-surface-variant text-sm">{t("user.welcome")}</p>
            <p className="font-mono text-2xl font-bold mt-1" style={{ color: "#ffc174" }}>Table {tableId}</p>
          </div>

          {[{ to: `/customer/${tableId}/menu`, icon: "restaurant_menu", iconBg: "bg-primary/20", iconHover: "group-hover:bg-primary/40", iconColor: "text-primary", label: "user.menu", desc: "user.scanQR" },
            { to: `/customer/${tableId}/support`, icon: "support_agent", iconBg: "bg-tertiary/10", iconHover: "group-hover:bg-tertiary/30", iconColor: "text-tertiary", label: "user.support", desc: "user.callWaiter" },
            { to: `/customer/${tableId}/tracking`, icon: "receipt_long", iconBg: "bg-secondary/10", iconHover: "group-hover:bg-secondary/30", iconColor: "text-secondary", label: "user.trackOrder", desc: "user.orderStatus" }].map((item, i) => (
            <button key={i} onClick={() => navigate(item.to)}
              className="glass-btn w-full py-5 px-6 rounded-2xl flex items-center justify-between group hover:border-primary/40 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center ${item.iconHover} transition-colors`}>
                  <span className={`material-symbols-outlined ${item.iconColor} text-3xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <div className="text-left">
                  <span className="block font-semibold text-white text-lg">{t(item.label)}</span>
                  <span className="text-on-surface-variant text-sm">{t(item.desc)}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary-fixed-dim opacity-40 group-hover:opacity-100 transition-all group-hover:translate-x-1">arrow_forward_ios</span>
            </button>
          ))}
        </div>

        <div className="mt-10 text-on-surface-variant/40 flex flex-col items-center">
          <div className="w-1 h-10 rounded-full bg-gradient-to-b from-primary/40 to-transparent mb-3" />
          <p className="text-label-sm tracking-widest uppercase">Bon Appétit</p>
          <p className="text-[10px] text-on-surface-variant/20 mt-2 uppercase tracking-[0.2em]">© 2024 SmartDine Systems</p>
        </div>
      </div>

      <div className="md:hidden h-20" />
      <UserBottomNav tableId={tableId} />
    </div>
  );
}
