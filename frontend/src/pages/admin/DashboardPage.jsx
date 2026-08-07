import React, { useState, useEffect } from "react";
import api from "@/lib/api.js";
import { BarChart } from "@/components/ui/Charts.jsx";
import { useLang } from "@/context/LanguageContext.jsx";
import { GlassCard } from "@/components/ui/glass-card.jsx";

const statusPill = {
  PENDING: "bg-primary/20 text-primary border-primary/30",
  CONFIRMED: "bg-blue-400/20 text-blue-400 border-blue-400/30",
  PREPARING: "bg-secondary/20 text-secondary border-secondary/30",
  READY: "bg-orange-300/20 text-orange-300 border-orange-300/30",
  SERVED: "bg-tertiary/20 text-tertiary border-tertiary/30",
  CANCELLED: "bg-error/20 text-error border-error/30",
  Paid: "bg-tertiary/20 text-tertiary border-tertiary/30",
};

export default function DashboardPage() {  const { t } = useLang();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("month");
  const [tableStats, setTableStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch base data
  useEffect(() => {
    Promise.all([
      api.get("/dashboard/stats"),
      api.get("/tables"),
      api.get("/dashboard/recent-orders"),
      api.get("/dashboard/top-items?limit=5"),
    ])
      .then(([statsRes, tablesRes, ordersRes, topRes]) => {
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
          occupied: tables.filter((tbl) => tbl.status === "OCCUPIED").length,
          available: tables.filter((tbl) => tbl.status === "AVAILABLE").length,
          reserved: tables.filter((tbl) => tbl.status === "RESERVED").length,
          total: tables.length,
        });

        setRecentOrders(ordersRes.data.slice(0, 8));
        setTopItems(topRes.data);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load dashboard data");
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch chart data separately, re-fetch when period changes
  useEffect(() => {
    setChartLoading(true);
    api.get(`/dashboard/revenue-chart?period=${chartPeriod}`)
      .then((res) => {
        const cd = res.data;
        if (cd && cd.length > 0) {
          setChartData(cd);
        } else {
          setChartData(getFallbackData(chartPeriod));
        }
      })
      .catch(() => {
        setChartData(getFallbackData(chartPeriod));
      })
      .finally(() => setChartLoading(false));
  }, [chartPeriod]);

  function getFallbackData(period) {
    if (period === "week") {
      return [
        { label: "Mon", value: 0 }, { label: "Tue", value: 0 },
        { label: "Wed", value: 0 }, { label: "Thu", value: 0 },
        { label: "Fri", value: 0 }, { label: "Sat", value: 0 },
        { label: "Sun", value: 0 },
      ];
    }
    return [
      { label: "Week 1", value: 0 }, { label: "Week 2", value: 0 },
      { label: "Week 3", value: 0 }, { label: "Week 4", value: 0 },
    ];
  }

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
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors">{t("common.retry")}</button>
        </div>
      </div>
    );
  }

  const occupancyPct = stats.totalTables ? Math.round((stats.activeTables / stats.totalTables) * 100) : 0;
  const maxChartVal = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {/* Total Revenue */}
        <GlassCard className="rounded-xl p-4 md:p-6 flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110" style={{ color: "#56e5a9" }}><span className="material-symbols-outlined text-8xl">payments</span></div>
          <div className="relative z-10">
            <p className="text-on-surface-variant text-xs uppercase tracking-widest mb-1">{t("dashboard.totalRevenue")}</p>
            <h3 className="text-[32px] font-bold tracking-[-0.01em]" style={{ color: "#56e5a9" }}>${(stats?.totalRevenue || 0).toLocaleString()}</h3>
            <div className="flex items-center mt-2 text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-sm mr-1">today</span>
              <span>${(stats?.todayRevenue || 0).toLocaleString()} {t("dashboard.todayRevenue")}</span>
            </div>
          </div>
        </GlassCard>

        {/* Pending Orders */}
        <GlassCard className="rounded-xl p-4 md:p-6 flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110" style={{ color: "#ffc174" }}><span className="material-symbols-outlined text-8xl">list_alt</span></div>
          <div className="relative z-10">
            <p className="text-on-surface-variant text-xs uppercase tracking-widest mb-1">{t("dashboard.pendingOrders")}</p>
            <h3 className="text-[32px] font-bold tracking-[-0.01em]" style={{ color: "#ffc174" }}>{stats?.totalOrders || 0}</h3>
            <div className="flex items-center mt-2 text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-sm mr-1">schedule</span>
              <span>{t("dashboard.awaitingConfirmation")}</span>
            </div>
          </div>
        </GlassCard>

        {/* Active Tables */}
        <GlassCard className="rounded-xl p-4 md:p-6 flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110" style={{ color: "#ffb690" }}><span className="material-symbols-outlined text-8xl">table_restaurant</span></div>
          <div className="relative z-10">
            <p className="text-on-surface-variant text-xs uppercase tracking-widest mb-1">{t("dashboard.activeTables")}</p>
            <h3 className="text-[32px] font-bold tracking-[-0.01em]" style={{ color: "#ffb690" }}>{stats?.activeTables || 0}<span className="text-[14px] font-normal opacity-60">/{stats?.totalTables || 0}</span></h3>
            <div className="flex items-center mt-2 text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-sm mr-1">group</span>
              <span>{occupancyPct}% {t("dashboard.occupancy")}</span>
            </div>
          </div>
        </GlassCard>

        {/* Avg Bill */}
        <GlassCard className="rounded-xl p-4 md:p-6 flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110" style={{ color: "#a78bfa" }}><span className="material-symbols-outlined text-8xl">analytics</span></div>
          <div className="relative z-10">
            <p className="text-on-surface-variant text-xs uppercase tracking-widest mb-1">{t("dashboard.avgBill")}</p>
            <h3 className="text-[32px] font-bold tracking-[-0.01em]" style={{ color: "#a78bfa" }}>${(stats?.avgBill || 0).toLocaleString()}</h3>
            <div className="flex items-center mt-2 text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-sm mr-1">receipt_long</span>
              <span>{stats?.todaySessions || 0} {t("dashboard.sessionsToday")}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Revenue Chart */}
      <GlassCard className="rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h3 className="text-lg md:text-2xl font-semibold text-white">{t("dashboard.revenueTrend")}</h3>
            <p className="text-on-surface-variant/50 text-xs mt-1">{t("dashboard.revenueTrendDesc")}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setChartPeriod("week")} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${chartPeriod === "week" ? "bg-primary/20 text-primary border border-primary/30" : "text-on-surface-variant hover:bg-white/5"}`}>{t("dashboard.week")}</button>
            <button onClick={() => setChartPeriod("month")} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${chartPeriod === "month" ? "bg-primary/20 text-primary border border-primary/30" : "text-on-surface-variant hover:bg-white/5"}`}>{t("dashboard.month")}</button>
          </div>
        </div>
        <div className="px-4 pb-4 pt-2">{chartLoading ? (
            <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : (
            <BarChart data={chartData} height={320} color="#56e5a9" />
          )}
        </div>
      </GlassCard>

      {/* Recent Orders & Top Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List */}
        <GlassCard className="lg:col-span-2 rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-lg md:text-2xl font-semibold text-white">Recent Orders</h3>
            <button className="text-primary hover:underline text-xs font-bold">{t("common.viewAll")}</button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant/40 text-sm">No recent orders</div>
          ) : (
            <div className="overflow-auto custom-scrollbar flex-grow max-h-[500px]">
              <table className="w-full text-left min-w-[650px]">
                <thead className="bg-white/5 sticky top-0">
                  <tr>
                    <th className="p-2 md:p-4 text-[10px] md:text-xs text-on-surface-variant font-bold uppercase tracking-wider">Order ID</th>
                    <th className="p-2 md:p-4 text-[10px] md:text-xs text-on-surface-variant font-bold uppercase tracking-wider">Customer</th>
                    <th className="p-2 md:p-4 text-[10px] md:text-xs text-on-surface-variant font-bold uppercase tracking-wider">Items</th>
                    <th className="p-2 md:p-4 text-[10px] md:text-xs text-on-surface-variant font-bold uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs text-on-surface-variant font-bold uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentOrders.map((order) => {
                    const pill = statusPill[order.status] || statusPill["PENDING"];
                    const itemsText = order.items?.map((it) => it.name || it.menuItemId?.name || "Item").join(", ") || "-";
                    return (
                      <tr key={order._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-2 md:p-4 font-mono text-xs md:text-sm text-primary">#{order._id.toString().slice(-8)}</td>
                        <td className="p-2 md:p-4 text-on-surface text-xs md:text-sm">{order.tableNumber ? `Table ${order.tableNumber}` : t("dashboard.walkIn")}</td>
                        <td className="p-2 md:p-4 text-on-surface-variant text-xs md:text-sm truncate max-w-[100px] md:max-w-[160px]">{itemsText}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${pill}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-2 md:p-4 text-right font-bold text-xs md:text-sm text-white">${(order.totalAmount || 0).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* Top Selling Items */}
        <GlassCard className="rounded-xl p-4 md:p-6 flex flex-col max-h-[500px]">
          <h3 className="text-2xl font-semibold text-white mb-6">Top Selling Items</h3>
          {topItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant/40 text-sm">No order data yet</div>
          ) : (
            <div className="space-y-6 overflow-y-auto custom-scrollbar flex-grow pr-2">
              {topItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden shadow-lg transition-transform group-hover:scale-110 flex-shrink-0">
                    {item.menuItem?.image ? (
                      <img src={item.menuItem.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant/30 text-2xl">restaurant</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-bold text-on-surface truncate">{item.menuItem?.name || t("menu.uncategorized")}</p>
                    <p className="text-xs text-on-surface-variant">{item.totalQuantity || 0} {t("dashboard.ordersThisWeek")}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-primary font-bold">${(item.menuItem?.price || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-tertiary">{item.orderCount ? `x${item.orderCount}` : "+0%"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

