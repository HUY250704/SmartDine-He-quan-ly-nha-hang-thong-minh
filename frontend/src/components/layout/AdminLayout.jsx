import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`min-h-screen transition-all duration-300 w-full ${collapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
