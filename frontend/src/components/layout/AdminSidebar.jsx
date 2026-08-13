import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";
import { useLang } from "@/context/LanguageContext.jsx";

const navItems = [
  { to: "/admin/dashboard", icon: "dashboard", label: "sidebar.dashboard" },
  { to: "/admin/orders", icon: "list_alt", label: "sidebar.orders" },
  { to: "/admin/menu", icon: "restaurant_menu", label: "sidebar.menu" },
  { to: "/admin/categories", icon: "category", label: "sidebar.categories" },
  { to: "/admin/tables", icon: "table_restaurant", label: "sidebar.tables" },
  { to: "/admin/bills", icon: "receipt_long", label: "sidebar.bills" },
  { to: "/admin/support", icon: "support_agent", label: "sidebar.support" },
];

export function AdminSidebar({ collapsed, setCollapsed, mobileOpen, onMobileClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, lang, toggleLang } = useLang();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const sidebarInner = (
    <aside
      className={`relative h-full bg-surface-container/60 backdrop-blur-xl border-r border-white/10 flex flex-col ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,193,116,0.15)]">
            <span className="material-symbols-outlined text-primary text-xl">restaurant</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h2 className="font-bold text-white text-sm tracking-tight">{t("sidebar.smartDine")}</h2>
              <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-[0.2em]">{t("sidebar.adminPanel")}</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? "bg-primary/15 border border-primary/30 text-primary shadow-[0_0_12px_rgba(255,193,116,0.08)]"
                  : "text-on-surface-variant hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl flex-shrink-0 transition-all ${isActive ? "scale-110" : ""}`}
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <span className="text-sm font-medium">{t(item.label)}</span>
              )}
              {isActive && !collapsed && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        {/* Language Toggle */}
        <button
          onClick={toggleLang}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-primary/15 border border-primary/25 text-primary font-semibold hover:bg-primary/25 hover:border-primary/40 hover:shadow-[0_0_12px_rgba(255,193,116,0.15)] active:scale-95 transition-all"
          title={t("language.switchTo")}
        >
          <span className="material-symbols-outlined text-sm">translate</span>
          {!collapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {lang === "vi" ? "EN" : "VI"}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-sm">person</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.username || "Admin User"}</p>
              <p className="text-on-surface-variant/40 text-[10px]">{t("sidebar.administrator")}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-error/60 hover:text-error hover:bg-error/10 transition-all"
          title={t("sidebar.signOut")}
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          {!collapsed && <span className="text-xs font-medium">{t("sidebar.signOut")}</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-white/10 bg-white/5 text-on-surface-variant transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-95"
          aria-label={collapsed ? "Mở rộng bảng điều khiển" : "Thu gọn bảng điều khiển"}
          title={collapsed ? "Mở rộng bảng điều khiển" : "Thu gọn bảng điều khiển"}
        >
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {collapsed ? "left_panel_open" : "left_panel_close"}
          </span>
          {!collapsed && <span className="text-xs font-semibold">Thu gọn</span>}
        </button>

      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className={`hidden md:block fixed left-0 top-0 h-screen z-50 transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}>
        {sidebarInner}
      </div>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
      )}
      {/* Mobile slide-in */}
      <div className={`md:hidden fixed left-0 top-0 h-screen z-[65] transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebarInner}
      </div>
    </>
  );
}
