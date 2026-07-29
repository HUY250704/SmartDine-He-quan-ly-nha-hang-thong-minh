import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserBottomNav } from "@/components/layout/UserBottomNav";
import { useLang } from "@/context/LanguageContext.jsx";
import { useCart } from "@/context/CartContext.jsx";
import api from "@/lib/api.js";

const SHIMMER_KEYFRAMES = `
@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}
@keyframes floating {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
@keyframes pulse-ring {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}
`;

export default function WelcomePage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const floatRef = useRef(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: active } = await api.get(`/sessions/table/${tableId}/active`);
        if (active && active._id) {
          localStorage.setItem("smartdine_sessionId", active._id);
        } else {
          const { data: newSession } = await api.post("/sessions/open", { tableId });
          localStorage.setItem("smartdine_sessionId", newSession._id);
        }
      } catch (err) {
        setError(err.response?.data?.error || "Failed to start session");
      } finally {
        setLoading(false);
      }
    };
    clearCart();
    localStorage.removeItem("smartdine_sessionId");
    initSession();
  }, [tableId]);

  // Parallax on floating branding
  useEffect(() => {
    const onMouse = (e) => {
      const el = floatRef.current;
      if (!el) return;
      const x = (window.innerWidth / 2 - e.pageX) / 50;
      const y = (window.innerHeight / 2 - e.pageY) / 50;
      el.style.transform = `translate(${x}px, ${y}px)`;
    };
    document.addEventListener("mousemove", onMouse);
    return () => document.removeEventListener("mousemove", onMouse);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(circle at center, #191f2f 0%, #0c1322 100%)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(circle at center, #191f2f 0%, #0c1322 100%)" }}>
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-error mb-4">error</span>
          <p className="text-error text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors">
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden" style={{ background: "radial-gradient(circle at center, #191f2f 0%, #0c1322 100%)" }}>
      <style>{SHIMMER_KEYFRAMES}</style>

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" style={{ animation: "floating 6s ease-in-out infinite" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-tertiary/5 rounded-full blur-[80px]" style={{ animation: "floating 6s ease-in-out 2s infinite" }} />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px]" style={{ animation: "floating 6s ease-in-out 4s infinite" }} />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Branding with parallax */}
        <div ref={floatRef} className="text-center mb-10 transition-transform duration-75">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(255,193,116,0.15)]" style={{ animation: "floating 6s ease-in-out infinite" }}>
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
          </div>
          <h1 className="text-[48px] md:text-6xl font-bold tracking-[-0.02em] text-white mb-2">
            Smart<span style={{ color: "#ffc174" }}>Dine</span>
          </h1>
          <p className="text-on-surface-variant text-lg">{t("user.welcome")}</p>
          <div className="w-12 h-1 mx-auto mt-4 rounded-full bg-gradient-to-r from-primary via-primary-container to-transparent" />
        </div>

        {/* Glass Card */}
        <div className="rounded-3xl p-6 space-y-4" style={{ backdropFilter: "blur(20px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px 0 rgba(0,0,0,0.37)" }}>
          {/* Your Table */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5 px-1">
            <div>
              <p className="text-on-surface-variant text-sm">{t("user.yourTable")}</p>
              <p className="font-mono text-2xl font-bold mt-1" style={{ color: "#ffc174" }}>Table {tableId}</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors">
              {t("user.changeTable")}
            </button>
          </div>

          {/* View Menu */}
          <button onClick={() => navigate(`/customer/${tableId}/menu`)} className="w-full py-6 px-6 rounded-2xl flex items-center justify-between group relative overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,193,116,0.1)"; e.currentTarget.style.borderColor = "rgba(255,193,116,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(255,193,116,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            <div className="absolute top-0 -left-full w-full h-full pointer-events-none" style={{ background: "linear-gradient(120deg, transparent, rgba(255,193,116,0.1), transparent)", transition: "0.5s", left: "var(--shimmer-left, -100%)" }} />
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors" style={{ background: "rgba(245,158,11,0.2)" }}>
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant_menu</span>
              </div>
              <div className="text-left">
                <span className="block text-white text-lg font-semibold">{t("user.viewMenu")}</span>
                <span className="text-on-surface-variant text-sm">{t("user.viewMenuDesc")}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary-fixed-dim opacity-40 group-hover:opacity-100 transition-all relative z-10" style={{ transform: "translateX(0)" }}>arrow_forward_ios</span>
          </button>

          {/* Call Staff */}
          <button onClick={() => navigate(`/customer/${tableId}/support`)} className="w-full py-6 px-6 rounded-2xl flex items-center justify-between group relative overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(86,229,169,0.08)"; e.currentTarget.style.borderColor = "rgba(86,229,169,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(86,229,169,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors" style={{ background: "rgba(48,200,143,0.1)" }}>
                <span className="material-symbols-outlined text-tertiary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
              </div>
              <div className="text-left">
                <span className="block text-white text-lg font-semibold">{t("user.callStaff")}</span>
                <span className="text-on-surface-variant text-sm">{t("user.callStaffDesc")}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-tertiary opacity-40 group-hover:opacity-100 transition-all relative z-10">arrow_forward_ios</span>
          </button>

          {/* View My Orders */}
          <button onClick={() => navigate(`/customer/${tableId}/tracking`)} className="w-full py-6 px-6 rounded-2xl flex items-center justify-between group relative overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,182,144,0.08)"; e.currentTarget.style.borderColor = "rgba(255,182,144,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(255,182,144,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors" style={{ background: "rgba(236,106,6,0.1)" }}>
                <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
              </div>
              <div className="text-left">
                <span className="block text-white text-lg font-semibold">{t("user.viewOrders")}</span>
                <span className="text-on-surface-variant text-sm">{t("user.viewOrdersDesc")}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-secondary opacity-40 group-hover:opacity-100 transition-all relative z-10">arrow_forward_ios</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-16 text-on-surface-variant/40 flex flex-col items-center">
          <div className="w-1 h-12 rounded-full bg-gradient-to-b from-primary/40 to-transparent mb-4" />
          <p className="text-label-sm tracking-widest uppercase">{t("user.bonAppetit")}</p>
        </div>
      </div>

      <div className="md:hidden h-20" />
      <UserBottomNav tableId={tableId} />
    </div>
  );
}
