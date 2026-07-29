import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";

export function UserBottomNav({ tableId = 7 }) {
  const location = useLocation();
  const { t } = useLang();

  const navItems = [
    { to: `/customer/${tableId}/menu`, icon: "restaurant", label: "user.menu" },
    { to: `/customer/${tableId}/cart`, icon: "shopping_cart", label: "user.cart" },
    { to: `/customer/${tableId}/tracking`, icon: "receipt_long", label: "user.orders" },
    { to: `/customer/${tableId}/support`, icon: "person", label: "user.support" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface-container/60 backdrop-blur-lg border-t border-white/10 flex justify-around items-center px-4 pb-2 h-16 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center justify-center transition-all duration-200 pt-1 ${
              isActive
                ? "text-primary scale-110 font-bold"
                : "text-on-surface-variant hover:text-primary-fixed-dim"
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {item.icon}
            </span>
            <span className="text-label-sm">{t(item.label)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
