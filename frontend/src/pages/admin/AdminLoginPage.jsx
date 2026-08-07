import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";
import { useLang } from "@/context/LanguageContext.jsx";

export default function AdminLoginPage() {
  const cardRef = useRef(null);
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLang();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      cardRef.current.style.setProperty("--mouse-x", `${x}%`);
      cardRef.current.style.setProperty("--mouse-y", `${y}%`);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError(t("login.credentialsRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.error || t("login.error"));
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(ellipse at 30% 20%, #1a2333 0%, #0c1322 70%)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: "radial-gradient(ellipse at 30% 20%, #1a2333 0%, #0c1322 70%)" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,193,116,0.08) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(236,106,6,0.06) 0%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,193,116,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,193,116,0.2)", boxShadow: "0 0 30px rgba(255,193,116,0.1)" }}>
            <span className="material-symbols-outlined text-4xl" style={{ color: "#ffc174", fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          </div>
          <h1 className="text-4xl md:text-[48px] font-bold tracking-[-0.02em] text-white leading-tight">SmartDine</h1>
          <p className="text-on-surface-variant/60 text-xs uppercase tracking-[0.3em] mt-2">{t("login.subtitle")}</p>
        </div>

        <div ref={cardRef} className="rounded-3xl p-6 md:p-8 relative overflow-hidden"
          style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          <div className="absolute inset-0 pointer-events-none opacity-30 transition-opacity duration-300"
            style={{ background: "radial-gradient(circle 200px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(255,193,116,0.15), transparent 80%)" }} />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-2xl" style={{ color: "#ffc174" }}>shield_person</span>
              <div><p className="text-white font-bold text-sm">{t("login.title")}</p><p className="text-on-surface-variant/50 text-[10px] uppercase tracking-wider">Operator Authentication</p></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-on-surface-variant/80 text-[11px] font-semibold uppercase tracking-wider mb-2">{t("login.username")}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 material-symbols-outlined text-lg pointer-events-none">person</span>
                  <input type="text" placeholder="Enter operator ID" value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/30 outline-none transition-all duration-300"
                    style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)", border: username.length > 3 ? "1px solid rgba(48,200,143,0.4)" : "1px solid rgba(255,255,255,0.1)" }} />
                  {username.length > 3 && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm" style={{ color: "#30c88f" }}>check_circle</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant/80 text-[11px] font-semibold uppercase tracking-wider mb-2">{t("login.password")}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 material-symbols-outlined text-lg pointer-events-none">lock</span>
                  <input type={showPassword ? "text" : "password"} placeholder="Enter security key" value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className={`w-full pl-11 pr-12 py-3 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/30 outline-none transition-all duration-300 ${error ? "animate-shake" : ""}`}
                    style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)", border: error ? "1px solid rgba(255,180,171,0.5)" : "1px solid rgba(255,255,255,0.1)" }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-white/80 transition-colors">
                    <span className="material-symbols-outlined text-sm">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {error && (
                  <div className="flex items-center gap-1.5 mt-2" style={{ color: "#ffb4ab" }}>
                    <span className="material-symbols-outlined text-sm">error</span><span className="text-xs">{error}</span>
                  </div>
                )}
              </div>

              <button type="submit" disabled={submitting}
                className="w-full py-4 rounded-xl font-bold text-[24px] flex items-center justify-center gap-2 transition-all duration-300 bg-gradient-to-r from-[#f59e0b] via-[#ffc174] to-[#f59e0b] text-[#472a00] shadow-xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait">
                <span className={`material-symbols-outlined ${submitting ? "animate-spin" : ""}`}>{submitting ? "progress_activity" : "login"}</span>
                <span>{submitting ? t("login.signingIn") : t("login.signIn")}</span>
              </button>
            </form>

            <div className="mt-7 pt-7 border-t flex flex-col items-center space-y-4" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-5">
                <button className="flex items-center gap-1.5 text-on-surface-variant/50 hover:text-white text-xs transition-colors">
                  <span className="material-symbols-outlined text-sm">support_agent</span><span>{t("sidebar.support")}</span>
                </button>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <button className="flex items-center gap-1.5 text-on-surface-variant/50 hover:text-white text-xs transition-colors">
                  <span className="material-symbols-outlined text-sm">security</span><span>Policy</span>
                </button>
              </div>
              <div className="font-mono text-[10px] text-white/20 tracking-[0.2em] uppercase">Encrypted Session ID: 77-SD-4091-LX</div>
            </div>
          </div>
        </div>

        <p className="text-center mt-10 text-on-surface-variant/30 text-[11px] uppercase tracking-[0.2em]">
          © 2024 SmartDine Systems. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
