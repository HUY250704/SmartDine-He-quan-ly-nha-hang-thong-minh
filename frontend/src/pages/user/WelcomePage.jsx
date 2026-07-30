import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { useCart } from "@/context/CartContext.jsx";
import api from "@/lib/api.js";

const glassCard = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
};

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

  useEffect(() => {
    const onMouse = (e) => {
      const el = floatRef.current;
      if (!el) return;
      const x = (window.innerWidth / 2 - e.pageX) / 80;
      const y = (window.innerHeight / 2 - e.pageY) / 80;
      el.style.transform = `translate(${x}px, ${y}px)`;
    };
    document.addEventListener("mousemove", onMouse);
    return () => document.removeEventListener("mousemove", onMouse);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
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

  const QuickAction = ({ icon, title, desc, color, to }) => (
    <button
      onClick={() => navigate(to)}
      className="group relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
      style={glassCard}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `rgba(${color},0.08)`;
        e.currentTarget.style.borderColor = `rgba(${color},0.3)`;
        e.currentTarget.style.boxShadow = `0 0 30px rgba(${color},0.1)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `rgba(${color},0.15)` }}>
          <span className="material-symbols-outlined text-2xl" style={{ color: `rgb(${color})`, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <div className="text-left">
          <h3 className="text-white font-semibold text-base mb-1">{title}</h3>
          <p className="text-on-surface-variant/50 text-xs leading-relaxed">{desc}</p>
        </div>
      </div>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="material-symbols-outlined text-sm" style={{ color: `rgb(${color})` }}>arrow_forward</span>
      </div>
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="relative mb-10 overflow-hidden rounded-3xl p-8 md:p-12" style={{ background: "linear-gradient(135deg, rgba(255,193,116,0.1) 0%, rgba(236,106,6,0.05) 50%, rgba(12,19,34,0) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/5 blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-tertiary/5 blur-[60px]" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div ref={floatRef} className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 transition-transform duration-75">
            <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
          </div>
          <div className="flex-1">
            <p className="text-on-surface-variant/60 text-xs uppercase tracking-widest mb-2">{t("user.welcome") || "Welcome to"}</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Smart<span style={{ color: "#ffc174" }}>Dine</span>
            </h1>
            <p className="text-on-surface-variant/60 text-sm mt-2 max-w-md">
              {t("user.welcomeDesc") || "Scan the QR, browse our menu, and enjoy a seamless dining experience."}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <h2 className="text-xs font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-4">
        {t("user.quickActions") || "Quick Actions"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <QuickAction icon="restaurant_menu" title={t("user.viewMenu") || "Browse Menu"} desc={t("user.viewMenuDesc") || "Explore our curated dishes & drinks"} color="255,193,116" to={`/customer/${tableId}/menu`} />
        <QuickAction icon="receipt_long" title={t("user.viewOrders") || "My Orders"} desc={t("user.viewOrdersDesc") || "Track your order status in real-time"} color="236,106,6" to={`/customer/${tableId}/tracking`} />
        <QuickAction icon="shopping_cart" title={t("user.cart") || "My Cart"} desc="Review and submit your order" color="86,229,169" to={`/customer/${tableId}/cart`} />
        <QuickAction icon="support_agent" title={t("user.callStaff") || "Call Staff"} desc={t("user.callStaffDesc") || "Need water, napkins, or the bill?"} color="167,139,250" to={`/customer/${tableId}/support`} />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: "wifi", label: "Free Wi-Fi", desc: "Connected & secure", color: "#56e5a9" },
          { icon: "schedule", label: "Open Hours", desc: "10:00 AM - 10:00 PM", color: "#ffc174" },
          { icon: "location_on", label: "Location", desc: "123 Gourmet Street", color: "#ffb690" },
        ].map((card, i) => (
          <div key={i} className="p-5 rounded-2xl flex items-center gap-4" style={glassCard}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${card.color}20` }}>
              <span className="material-symbols-outlined text-lg" style={{ color: card.color }}>{card.icon}</span>
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{card.label}</p>
              <p className="text-on-surface-variant/50 text-xs">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
