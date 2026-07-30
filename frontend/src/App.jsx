import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import UserLayout from "@/components/layout/UserLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute.jsx";

// Admin Pages
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import DashboardPage from "@/pages/admin/DashboardPage";
import MenuManagementPage from "@/pages/admin/MenuManagementPage";
import OrdersManagementPage from "@/pages/admin/OrdersManagementPage";
import TablesManagementPage from "@/pages/admin/TablesManagementPage";
import BillsManagementPage from "@/pages/admin/BillsManagementPage";
import SupportPage from "@/pages/admin/SupportPage";

// Customer Pages
import WelcomePage from "@/pages/user/WelcomePage";
import MenuPage from "@/pages/user/MenuPage";
import CartPage from "@/pages/user/CartPage";
import OrderTrackingPage from "@/pages/user/OrderTrackingPage";
import SupportPaymentPage from "@/pages/user/SupportPaymentPage";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Routes>
        {/* Admin Login */}
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        {/* Admin Routes (protected) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="orders" element={<OrdersManagementPage />} />
            <Route path="menu" element={<MenuManagementPage />} />
            <Route path="tables" element={<TablesManagementPage />} />
            <Route path="bills" element={<BillsManagementPage />} />
            <Route path="support" element={<SupportPage />} />
          </Route>
        </Route>

        {/* Customer Routes - Web layout with sidebar */}
        <Route path="/customer/:tableId" element={<UserLayout />}>
          <Route index element={<WelcomePage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="tracking" element={<OrderTrackingPage />} />
          <Route path="support" element={<SupportPaymentPage />} />
        </Route>

        {/* Default: customer welcome */}
        <Route path="/" element={<Navigate to="/customer/7" replace />} />
        <Route path="*" element={<Navigate to="/customer/7" replace />} />
      </Routes>
    </div>
  );
}
