import React, { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet, useParams, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { useCart } from "@/context/CartContext.jsx";
import api from "@/lib/api.js";

const navItems = (tableId, t) => [
  { to: `/customer/${tableId}`, icon: "dashboard", label: "Home", exact: true },
  { to: `/customer/${tableId}/menu`, icon: "restaurant_menu", label: t("user.menu") || "Menu" },
  { to: `/customer/${tableId}/cart`, icon: "shopping_cart", label: t("user.cart") || "Cart" },
  { to: `/customer/${tableId}/tracking`, icon: "receipt_long", label: t("user.orders") || "Orders" },
  { to: `/customer/${tableId}/support`, icon: "support_agent", label: t("user.support") || "Support" },
];

const statusConfig = {
  AVAILABLE: { color: "#56e5a9", bg: "rgba(86,229,169,0.1)", label: "Trống" },
  OCCUPIED:  { color: "#ffb690", bg: "rgba(255,182,144,0.1)", label: "Đang dùng" },
  RESERVED:  { color: "#ffc174", bg: "rgba(255,193,116,0.1)", label: "Đã đặt" },
  CLEANING:  { color: "#a08e7a", bg: "rgba(160,142,122,0.1)", label: "Dọn dẹp" },
};

export function UserSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { t } = useLang();
  const { tableId } = useParams();
  const location = useLocation();
  const { cartCount } = useCart();
  const items = navItems(tableId, t);

  const sidebarContent = (
    <aside
      className={`h-full flex flex-col ${collapsed ? "w-[72px]" : "w-[240px]"}`}
      style={{ background: "linear-gradient(180deg, #0f172a 0%, #0c1322 100%)", borderRight: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
        </div>
        {!collapsed && <span className="font-bold text-white text-sm tracking-tight">Smart<span style={{ color: "#ffc174" }}>Dine</span></span>}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
          return (
            <NavLink key={item.to} to={item.to}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${active ? "bg-primary/10 text-primary" : "text-on-surface-variant/70 hover:text-white hover:bg-white/5"}`}>
              <span className="material-symbols-outlined text-xl shrink-0" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.icon === "shopping_cart" && cartCount > 0 && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold flex items-center justify-center">{cartCount}</span>
                  )}
                </>
              )}
              {collapsed && item.icon === "shopping_cart" && cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-tertiary text-on-tertiary text-[9px] font-bold flex items-center justify-center">{cartCount}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5 hidden md:block">
        <button onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-on-surface-variant/50 hover:text-white hover:bg-white/5 transition-all">
          <span className="material-symbols-outlined text-lg">{collapsed ? "chevron_right" : "chevron_left"}</span>
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className={`hidden md:block fixed left-0 top-0 h-full z-50 transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[240px]"}`}>
        {sidebarContent}
      </div>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
      )}
      {/* Mobile sidebar slide-in */}
      <div className={`md:hidden fixed left-0 top-0 h-full z-[65] transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebarContent}
      </div>
    </>
  );
}

export function UserTopBar({ onMenuClick }) {
  const { lang, toggleLang } = useLang();
  const { tableId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [showSwitch, setShowSwitch] = useState(false);
  const [tables, setTables] = useState([]);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDish, setAiDish] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState("");

  const fetchTables = async () => {
    setSwitchLoading(true);
    setSwitchError("");
    try {
      const { data } = await api.get("/tables/public");
      setTables(data);
    } catch (err) {
      console.error("fetchTables error:", err.response?.status, err.response?.data || err.message);
      setSwitchError("Không thể tải danh sách bàn");
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleSwitchTable = async (newTableNumber) => {
    const sessionId = localStorage.getItem("smartdine_sessionId");
    if (!sessionId) {
      setSwitchError("Không tìm thấy phiên hoạt động");
      return;
    }
    setSwitching(true);
    setSwitchError("");
    try {
      const { data } = await api.post("/sessions/switch", { sessionId, newTableId: newTableNumber });

      // Update localStorage with new table session
      localStorage.setItem("smartdine_sessionId", data._id);

      // Build new path from current location
      const pathParts = location.pathname.split("/");
      // pathParts: ["", "customer", "OLDTABLEID", ...rest]
      if (pathParts.length >= 3) {
        pathParts[2] = String(newTableNumber);
        navigate(pathParts.join("/"), { replace: true });
      } else {
        navigate(`/customer/${newTableNumber}`, { replace: true });
      }
      setShowSwitch(false);
    } catch (err) {
      setSwitchError(err.response?.data?.error || "Không thể đổi bàn");
    } finally {
      setSwitching(false);
    }
  };

  const generateAi = async () => {
    if (!aiDish.trim()) return;
    setAiGenerating(true);
    setAiResult("");
    try {
      const { data } = await api.post("/menu/public/ai-description", {
        name: aiDish.trim(),
        type: "description",
      });
      setAiResult(data.aiDescription);
    } catch (err) {
      const errMsg = err.response?.data?.error || "Xin lỗi, không thể tạo mô tả. Vui lòng thử lại.";
      setAiResult(errMsg);
      console.error("AI error:", errMsg);
    } finally {
      setAiGenerating(false);
    }
  };

  useEffect(() => {
    if (showSwitch) fetchTables();
  }, [showSwitch]);

  return (
    <>
      <header className="sticky top-0 z-40 h-16 md:h-16 flex items-center justify-between px-4 md:px-6"
        style={{ background: "rgba(12,19,34,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Hamburger - mobile only */}
        <button onClick={onMenuClick} className="md:hidden mr-2 w-11 h-11 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition-colors shrink-0">
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="material-symbols-outlined text-primary text-sm">table_restaurant</span>
            <span className="text-white text-sm font-semibold">Bàn #{tableId}</span>
          </div>
          <button onClick={() => setShowSwitch(true)}
            className="flex items-center gap-1.5 px-3 py-2 md:px-3 md:py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "rgba(255,193,116,0.1)", border: "1px solid rgba(255,193,116,0.2)", color: "#ffc174" }}>
            <span className="material-symbols-outlined text-sm">swap_horiz</span>
            Đổi bàn
          </button>
          <button onClick={() => { setAiOpen(true); setAiDish(""); setAiResult(""); }}
            className="flex items-center gap-1.5 px-3 py-2 md:px-3 md:py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg active:scale-95"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", color: "#fff" }}>
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            AI Mô tả
          </button>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          <button onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-2 md:px-3 md:py-1.5 rounded-lg bg-white/5 border border-white/10 text-on-surface-variant text-xs font-medium hover:text-white hover:bg-white/10 transition-all">
            <span className="material-symbols-outlined text-sm">translate</span>
            {lang === "vi" ? "EN" : "VI"}
          </button>
        </div>
      </header>


      {/* AI Description Modal */}
      {aiOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setAiOpen(false)}>
          <div className="rounded-3xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}
            style={{ background: "#141b2b", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">AI Mô tả món ăn</h2>
              <button onClick={() => setAiOpen(false)} className="text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-on-surface-variant/50 text-xs mb-4">
              Nhập tên món ăn để AI tạo mô tả hấp dẫn bằng tiếng Việt.
            </p>
            <div className="flex gap-2 mb-4">
              <input
                value={aiDish}
                onChange={(e) => setAiDish(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generateAi()}
                placeholder="VD: Phở bò tái, Bún chả Hà Nội..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm border outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                autoFocus
              />
              <button onClick={generateAi} disabled={aiGenerating || !aiDish.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", color: "#fff" }}>
                {aiGenerating ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang tạo...
                  </span>
                ) : (
                  "Tạo mô tả"
                )}
              </button>
            </div>
            {aiResult && (
              <div className="p-4 rounded-xl text-sm leading-relaxed"
                style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", color: "#e2d9ff" }}>
                {aiResult}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change Table Modal */}
      {showSwitch && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowSwitch(false)}>
          <div className="rounded-3xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}
            style={{ background: "#141b2b", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Đổi bàn</h2>
              <button onClick={() => setShowSwitch(false)} className="text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-on-surface-variant/50 text-xs mb-4">
              Bạn đang ở <span className="text-primary font-semibold">Bàn #{tableId}</span>. Chọn bàn trống để chuyển sang.
            </p>

            {switchError && (
              <div className="px-3 py-2 rounded-lg text-xs font-semibold mb-4"
                style={{ background: "rgba(255,180,171,0.1)", border: "1px solid rgba(255,180,171,0.3)", color: "#ffb4ab" }}>
                {switchError}
              </div>
            )}

            {switchLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {tables.map((t) => {
                  const sc = statusConfig[t.status] || statusConfig.AVAILABLE;
                  const isCurrent = String(t.number) === String(tableId);
                  const canSwitch = t.status === "AVAILABLE" && !isCurrent;

                  return (
                    <button key={t._id} disabled={!canSwitch}
                      onClick={() => canSwitch && handleSwitchTable(t.number)}
                      className={`
                        flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200
                        ${isCurrent ? "border-primary/40 bg-primary/10" : canSwitch ? "cursor-pointer hover:border-primary/30 hover:bg-white/5" : "opacity-40 cursor-not-allowed"}
                      `}
                      style={{ borderColor: isCurrent ? "rgba(255,193,116,0.4)" : canSwitch ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)", background: isCurrent ? "rgba(255,193,116,0.08)" : "transparent" }}>
                      <span className="material-symbols-outlined text-xl" style={{ color: isCurrent ? "#ffc174" : sc.color }}>
                        {isCurrent ? "table_bar" : "table_restaurant"}
                      </span>
                      <span className="text-white text-xs font-bold">{t.number}</span>
                      <span className="text-[10px]" style={{ color: sc.color }}>{isCurrent ? "Hiện tại" : sc.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {switching && (
              <div className="flex justify-center mt-5">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function UserLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="min-h-screen" style={{ background: "#0c1322" }}>
      <UserSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} mobileOpen={mobileOpen} onMobileClose={closeMobile} />
      <div className={`transition-all duration-300 ml-0 ${collapsed ? "md:ml-[72px]" : "md:ml-[240px]"}`}>
        <UserTopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="px-4 pb-28 pt-4 md:px-6 md:pb-8 md:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
