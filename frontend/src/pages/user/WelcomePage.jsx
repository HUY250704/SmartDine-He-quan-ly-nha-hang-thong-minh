import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserBottomNav } from "@/components/layout/UserBottomNav";
import { useLang } from "@/context/LanguageContext.jsx";
import { useCart } from "@/context/CartContext.jsx";
import api from "@/lib/api.js";

export default function WelcomePage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        // Check for existing active session
        const { data: active } = await api.get(`/sessions/table/${tableId}/active`);

        if (active && active._id) {
          localStorage.setItem("smartdine_sessionId", active._id);
          setSession(active);
        } else {
          // Open new session
          const { data: newSession } = await api.post("/sessions/open", { tableId });
          localStorage.setItem("smartdine_sessionId", newSession._id);
          setSession(newSession);
        }
      } catch (err) {
        setError(err.response?.data?.error || "Failed to start session");
      } finally {
        setLoading(false);
      }
    };

    // Clear old cart when entering welcome page
    clearCart();
    localStorage.removeItem("smartdine_sessionId");
    initSession();
  }, [tableId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(circle at center, #191f2f 0%, #0c1322 100%)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">Connecting...</p>
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
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] floating" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-tertiary/5 rounded-full blur-[80px] floating" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] floating" style={{ animationDelay: "4s" }} />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Branding */}
        <div className="text-center mb-10 floating">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(255,193,116,0.15)]">
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
          {/* Table info */}
          <div className="text-center pb-4 border-b border-white/5">
            <p className="text-on-surface-variant text-sm">{t("user.yourTable")}</p>
            <p className="font-mono text-2xl font-bold mt-1" style={{ color: "#ffc174" }}>Table {tableId}</p>
          </div>

          {/* Action buttons */}
          <button onClick={() => navigate(`/customer/${tableId}/menu`)} className="glass-btn w-full py-5 px-6 rounded-2xl flex items-center justify-between group hover:border-primary/40 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/40 transition-colors">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant_menu</span>
              </div>
              <div className="text-left">
                <span className="block font-semibold text-white text-lg">{t("user.viewMenu")}</span>
                <span className="text-on-surface-variant text-sm">{t("user.viewMenuDesc")}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary-fixed-dim opacity-40 group-hover:opacity-100 transition-all group-hover:translate-x-1">arrow_forward_ios</span>
          </button>

          <button onClick={() => navigate(`/customer/${tableId}/support`)} className="glass-btn w-full py-5 px-6 rounded-2xl flex items-center justify-between group hover:border-primary/40 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center group-hover:bg-tertiary/30 transition-colors">
                <span className="material-symbols-outlined text-tertiary text-3xl">support_agent</span>
              </div>
              <div className="text-left">
                <span className="block font-semibold text-white text-lg">{t("user.callStaff")}</span>
                <span className="text-on-surface-variant text-sm">{t("user.callStaffDesc")}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-tertiary opacity-40 group-hover:opacity-100 transition-all group-hover:translate-x-1">arrow_forward_ios</span>
          </button>

          <button onClick={() => navigate(`/customer/${tableId}/tracking`)} className="glass-btn w-full py-5 px-6 rounded-2xl flex items-center justify-between group hover:border-primary/40 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                <span className="material-symbols-outlined text-secondary text-3xl">receipt_long</span>
              </div>
              <div className="text-left">
                <span className="block font-semibold text-white text-lg">{t("user.viewOrders")}</span>
                <span className="text-on-surface-variant text-sm">{t("user.viewOrdersDesc")}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-secondary opacity-40 group-hover:opacity-100 transition-all group-hover:translate-x-1">arrow_forward_ios</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 text-on-surface-variant/40 flex flex-col items-center">
          <div className="w-1 h-10 rounded-full bg-gradient-to-b from-primary/40 to-transparent mb-3" />
          <p className="text-label-sm tracking-widest uppercase">{t("user.bonAppetit")}</p>
        </div>
      </div>

      <div className="md:hidden h-20" />
      <UserBottomNav tableId={tableId} />
    </div>
  );
}
