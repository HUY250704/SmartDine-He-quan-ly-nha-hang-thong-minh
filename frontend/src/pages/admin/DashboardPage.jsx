import React, { useState, useEffect } from "react";
import api from "@/lib/api.js";
import { BarChart, LineChart, DonutChart } from "@/components/ui/Charts.jsx";

const statusColors = {
  Paid: { bg: "bg-tertiary/10", text: "text-tertiary", border: "border-tertiary/20" },
  PENDING: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  CONFIRMED: { bg: "bg-blue-400/10", text: "text-blue-400", border: "border-blue-400/20" },
  PREPARING: { bg: "bg-blue-400/10", text: "text-blue-400", border: "border-blue-400/20" },
  READY: { bg: "bg-orange-300/10", text: "text-orange-300", border: "border-orange-300/20" },
  SERVED: { bg: "bg-violet-400/10", text: "text-violet-400", border: "border-violet-400/20" },
  CANCELLED: { bg: "bg-error/10", text: "text-error", border: "border-error/20" },
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [tableStats, setTableStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/stats"),
      api.get("/tables"),
      api.get("/dashboard/recent-orders"),
      api.get("/dashboard/top-items?limit=5"),
      api.get("/dashboard/revenue-chart"),
    ])
      .then(([statsRes, tablesRes, ordersRes, topRes, chartRes]) => {
        const s = statsRes.data;
        setStats({
          totalRevenue: s.totalRevenue || 0,
          avgBill: s.avgBill || 0,
          totalOrders: s.pendingOrders || 0,
          activeTables: s.occupiedTables || 0,
          totalTables: s.totalTables || 0,
          todayRevenue: s.todayRevenue || 0,
          todaySessions: s.todaySessions || 0,
        });

        const tables = tablesRes.data;
        setTableStats({
          occupied: tables.filter((t) => t.status === "OCCUPIED").length,
          available: tables.filter((t) => t.status === "AVAILABLE").length,
          reserved: tables.filter((t) => t.status === "RESERVED").length,
          total: tables.length,
        });

        setRecentOrders(ordersRes.data.slice(0, 5));
        setTopItems(topRes.data);

        const cd = chartRes.data;
        if (cd && cd.length > 0) {
          setChartData(cd);
        } else {
          setChartData([
            { label: "Mon", value: 0 }, { label: "Tue", value: 0 },
            { label: "Wed", value: 0 }, { label: "Thu", value: 0 },
            { label: "Fri", value: 0 }, { label: "Sat", value: 0 },
            { label: "Sun", value: 0 },
          ]);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load dashboard data");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-error mb-4">error</span>
          <p className="text-error text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Today Revenue", value: "$" + (stats.todayRevenue || 0).toFixed(0), change: stats.todaySessions + " sessions", icon: "payments", accent: "#ffc174" },
    { label: "Pending Orders", value: stats.totalOrders, change: "Active", icon: "receipt_long", accent: "#56e5a9" },
    { label: "Active Tables", value: stats.activeTables + " / " + stats.totalTables, change: Math.round((stats.activeTables / Math.max(stats.totalTables, 1)) * 100) + "%", icon: "table_restaurant", accent: "#ffb690" },
    { label: "Avg. Bill", value: "$" + (stats.avgBill || 0).toFixed(0), change: "Total: $" + (stats.totalRevenue || 0).toFixed(0), icon: "star", accent: "#a78bfa" },
  ];

  const tableDonutData = tableStats
    ? [{ label: "Occupied", value: tableStats.occupied }, { label: "Available", value: tableStats.available }, { label: "Reserved", value: tableStats.reserved }].filter((d) => d.value > 0)
    : [];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.01em] text-white">Dashboard</h1>
          <p className="text-on-surface-variant/60 text-sm mt-1">Real-time restaurant overview</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div key={i} className="rounded-2xl p-5 transition-all hover:-translate-y-1" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 30px rgba(0,0,0,0.1)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-2xl" style={{ color: card.accent }}>{card.icon}</span>
            </div>
            <p className="text-on-surface-variant/40 text-[11px] uppercase tracking-wider mb-1">{card.label}</p>
            <p className="text-white text-2xl font-bold font-mono">{card.value}</p>
            <p className="text-on-surface-variant/50 text-xs mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 30px rgba(0,0,0,0.1)" }}>
          <h3 className="text-white font-bold text-lg mb-1">Revenue Overview</h3>
          <p className="text-on-surface-variant/40 text-xs mb-4">Last 7 days</p>
          <BarChart data={chartData} height={200} color="#ffc174" />
        </div>

        <div className="rounded-2xl p-6" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 30px rgba(0,0,0,0.1)" }}>
          <h3 className="text-white font-bold text-lg mb-1">Table Status</h3>
          <p className="text-on-surface-variant/40 text-xs mb-4">{tableStats?.total || 0} total tables</p>
          <div className="flex justify-center">
            <DonutChart data={tableDonutData} width={180} height={180} />
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {tableDonutData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ["#ffc174", "#56e5a9", "#a78bfa"][i % 3] }} />
                <span className="text-on-surface-variant/60">{d.label}</span>
                <span className="text-white font-mono">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl overflow-hidden" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 30px rgba(0,0,0,0.1)" }}>
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="text-white font-bold text-lg">Recent Orders</h3>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant/40 text-sm">No recent orders</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-on-surface-variant/40 text-[11px] uppercase tracking-wider border-b border-white/5">
                    <th className="text-left py-3 px-6 font-semibold">Order ID</th>
                    <th className="text-left py-3 px-6 font-semibold">Status</th>
                    <th className="text-left py-3 px-6 font-semibold">Items</th>
                    <th className="text-left py-3 px-6 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const sc = statusColors[order.status] || statusColors["PENDING"];
                    return (
                      <tr key={order._id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-6 font-mono text-xs text-primary">#{order._id.toString().slice(-8)}</td>
                        <td className="py-3.5 px-6"><span className={"text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border " + sc.bg + " " + sc.text + " " + sc.border}>{order.status}</span></td>
                        <td className="py-3.5 px-6 text-on-surface-variant">{order.items?.length || 0}</td>
                        <td className="py-3.5 px-6 font-mono text-on-surface-variant/40 text-xs">{order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl p-6" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 30px rgba(0,0,0,0.1)" }}>
          <h3 className="text-white font-bold text-lg mb-4">Top Selling Items</h3>
          {topItems.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant/40 text-sm">No order data yet</div>
          ) : (
            <div className="space-y-4">
              {topItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {item.menuItem?.image && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"><img src={item.menuItem.image} alt="" className="w-full h-full object-cover" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{item.menuItem?.name || "Unknown"}</p>
                    <p className="text-on-surface-variant/50 text-[11px]">{item.totalQuantity} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary text-sm font-bold">${item.menuItem?.price || 0}</p>
                    <p className="text-on-surface-variant/40 text-[10px] font-mono">x{item.orderCount}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
