import React, { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      {/* Hamburger - mobile only */}
      <button onClick={() => setMobileOpen(true)} className="md:hidden fixed top-4 left-4 z-[55] w-10 h-10 flex items-center justify-center rounded-xl text-white bg-surface-container/80 backdrop-blur border border-white/10 hover:bg-surface-container transition-colors">
        <span className="material-symbols-outlined text-2xl">menu</span>
      </button>
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} onMobileClose={closeMobile} />
      <main className={`min-h-screen transition-all duration-300 w-full ml-0 ${collapsed ? "md:ml-20" : "md:ml-64"}`}>
        <div className="p-3 pt-14 md:p-6 md:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
