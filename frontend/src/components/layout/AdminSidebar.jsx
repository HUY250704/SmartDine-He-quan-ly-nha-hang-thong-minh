import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";

const navItems = [
  { to: "/admin/dashboard", icon: "dashboard", label: "Dashboard" },
  { to: "/admin/orders", icon: "list_alt", label: "Orders" },
  { to: "/admin/menu", icon: "restaurant_menu", label: "Menu" },
  { to: "/admin/tables", icon: "table_restaurant", label: "Tables" },
  { to: "/admin/bills", icon: "receipt_long", label: "Bills" },
  { to: "/admin/support", icon: "support_agent", label: "Support" },
];

export function AdminSidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-50 bg-surface-container/60 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 ${
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
              <h2 className="font-bold text-white text-sm tracking-tight">SmartDine</h2>
              <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-[0.2em]">Admin Panel</p>
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
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-sm">person</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.username || "Admin User"}</p>
              <p className="text-on-surface-variant/40 text-[10px]">{user?.role || "Administrator"}</p>
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-error/60 hover:text-error hover:bg-error/10 transition-all"
          title="Sign out"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          {!collapsed && <span className="text-xs font-medium">Sign Out</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-on-surface-variant/50 hover:text-white hover:bg-white/5 transition-all"
        >
          <span className="material-symbols-outlined text-sm">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>
      </div>
    </aside>
  );
}
