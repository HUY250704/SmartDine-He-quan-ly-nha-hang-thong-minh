import React, { useState, useEffect } from "react";
import api from "@/lib/api.js";

export default function BillsManagementPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [printView, setPrintView] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get("/bills"), api.get("/bills/stats/revenue")])
      .then(([billsRes, statsRes]) => {
        setBills(billsRes.data);
        setRevenueStats(statsRes.data);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load bills"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = bills.filter((b) => {
    if (!search) return true;
    const billId = b._id?.toString() || "";
    const tableNumber = b.sessionId?.tableId?.number?.toString() || "";
    const method = b.paymentMethod || "";
    return (
      billId.toLowerCase().includes(search.toLowerCase()) ||
      tableNumber.includes(search) ||
      method.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalRevenue = bills.reduce((s, b) => s + (b.total || 0), 0);
  const avgBill = bills.length ? totalRevenue / bills.length : 0;

  const paymentMethodLabels = {
    CASH: "Cash",
    CARD: "Card",
    BANK_TRANSFER: "Bank Transfer",
    E_WALLET: "E-Wallet",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">Loading bills...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-error">error</span>
          <p className="text-error text-sm mt-2">{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.01em] text-white">Bills Management</h1>
          <p className="text-on-surface-variant/60 text-sm mt-1">Track invoices and revenue</p>
        </div>
        <div className="relative group">
          <input
            type="text"
            placeholder="Search bills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 pl-10 pr-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/30 text-lg">search</span>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { l: "Total Revenue", v: `$${totalRevenue.toFixed(0)}`, icon: "trending_up", c: "#56e5a9" },
          { l: "Total Bills", v: bills.length, icon: "receipt_long", c: "#ffc174" },
          { l: "Avg Bill", v: `$${avgBill.toFixed(0)}`, icon: "analytics", c: "#a78bfa" },
          { l: "Today Revenue", v: `$${(revenueStats?.totalRevenue || 0).toFixed(0)}`, icon: "today", c: "#60a5fa" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="material-symbols-outlined text-2xl mb-3 block" style={{ color: s.c }}>{s.icon}</span>
            <p className="text-on-surface-variant/40 text-[11px] uppercase tracking-wider mb-1">{s.l}</p>
            <p className="text-white text-2xl font-bold font-mono">{s.v}</p>
          </div>
        ))}
      </div>

      {/* Bills Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-4 block">receipt_long</span>
              <p className="text-on-surface-variant/40 text-sm">No bills found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-on-surface-variant/40 text-[11px] uppercase tracking-wider border-b border-white/5">
                  <th className="text-left py-3 px-6 font-semibold">Bill ID</th>
                  <th className="text-left py-3 px-6 font-semibold">Table</th>
                  <th className="text-left py-3 px-6 font-semibold">Total</th>
                  <th className="text-left py-3 px-6 font-semibold">Payment</th>
                  <th className="text-left py-3 px-6 font-semibold">Date</th>
                  <th className="text-left py-3 px-6 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bill) => (
                  <tr key={bill._id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-6 font-mono text-xs text-primary">#{bill._id.toString().slice(-8)}</td>
                    <td className="py-3.5 px-6 font-mono text-white font-bold">Table {bill.sessionId?.tableId?.number || "-"}</td>
                    <td className="py-3.5 px-6 font-mono text-primary font-semibold">${bill.total?.toFixed(0) || 0}</td>
                    <td className="py-3.5 px-6">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-white/5 border-white/10 text-on-surface-variant">
                        {paymentMethodLabels[bill.paymentMethod] || bill.paymentMethod || "-"}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-on-surface-variant/40 text-xs">
                      {bill.paidAt ? new Date(bill.paidAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-white transition-colors"
                          title="View details"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedBill(null)}>
          <div className="rounded-3xl p-6 w-full max-w-sm" style={{ backdropFilter: "blur(32px)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white font-bold text-lg">Bill #{selectedBill._id.toString().slice(-8)}</h2>
                <p className="text-on-surface-variant/50 text-xs">Table {selectedBill.sessionId?.tableId?.number || "-"}</p>
              </div>
              <button onClick={() => setSelectedBill(null)} className="text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mb-4 pb-3 border-b border-white/5 space-y-2 text-sm text-on-surface-variant">
              <div className="flex justify-between"><span>Payment:</span><span className="text-white">{paymentMethodLabels[selectedBill.paymentMethod] || selectedBill.paymentMethod}</span></div>
              <div className="flex justify-between"><span>Date:</span><span className="font-mono">{selectedBill.paidAt ? new Date(selectedBill.paidAt).toLocaleString() : "-"}</span></div>
            </div>
            <div className="flex justify-between pt-3 border-t border-white/10">
              <span className="text-white font-bold text-lg">Total</span>
              <span className="font-mono font-bold text-lg" style={{ color: "#ffc174" }}>${selectedBill.total?.toFixed(0) || 0}</span>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => { setSelectedBill(null); setPrintView(selectedBill); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#dce2f7" }}
              >
                <span className="material-symbols-outlined text-lg">print</span>Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {printView && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPrintView(null)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-md text-black" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">SmartDine</h2>
              <p className="text-gray-500 text-sm">Restaurant Invoice</p>
              <div className="w-12 h-0.5 bg-orange-400 mx-auto mt-2" />
            </div>
            <div className="flex justify-between text-sm mb-4">
              <div><p className="font-semibold">#{printView._id.toString().slice(-8)}</p><p className="text-gray-500">Table {printView.sessionId?.tableId?.number || "-"}</p></div>
              <div className="text-right"><p>{printView.paidAt ? new Date(printView.paidAt).toLocaleDateString() : "-"}</p></div>
            </div>
            <div className="border-t border-dashed border-gray-200 pt-4 mb-4">
              <div className="flex justify-between text-sm py-1.5">
                <span>Grand Total</span>
                <span className="font-mono font-bold">${printView.total?.toFixed(0) || 0}</span>
              </div>
            </div>
            <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="font-mono">${printView.total?.toFixed(0) || 0}</span>
            </div>
            <div className="text-center text-xs text-gray-400 mt-4">Thank you for dining with us!</div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setPrintView(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 transition-colors">Close</button>
              <button className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-orange-400 text-white hover:bg-orange-500 transition-colors" onClick={() => window.print()}>
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
