import React, { useState, useEffect } from "react";
import api from "@/lib/api.js";
import { GlassCard } from "@/components/ui/glass-card.jsx";
import { useLang } from "@/context/LanguageContext.jsx";

const paymentMethods = {
  CASH: { label: "bills.cash", icon: "payments", color: "#f59e0b" },
  CARD: { label: "bills.card", icon: "credit_card", color: "#60a5fa" },
  BANK_TRANSFER: { label: "bills.bankTransfer", icon: "account_balance", color: "#a78bfa" },
  E_WALLET: { label: "bills.eWallet", icon: "contactless", color: "#56e5a9" },
};

const ITEMS_PER_PAGE = 10;

export default function BillsManagementPage() {
  const { t } = useLang();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [page, setPage] = useState(1);

  const fetchData = () => {
    setLoading(true);
    api.get("/bills")
      .then((res) => setBills(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load bills"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = bills.filter((b) => {
    if (search) {
      const id = (b._id?.toString() || "").toLowerCase();
      const table = (b.sessionId?.tableId?.number?.toString() || "").toLowerCase();
      const q = search.toLowerCase();
      if (!id.includes(q) && !table.includes(q)) return false;
    }
    if (paymentFilter !== "All" && b.paymentMethod !== paymentFilter) return false;
    if (dateFilter && b.paidAt) {
      const billDate = new Date(b.paidAt).toISOString().slice(0, 10);
      if (billDate !== dateFilter) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const totalRevenue = bills.reduce((s, b) => s + (b.total || 0), 0);
  const avgBill = bills.length ? totalRevenue / bills.length : 0;
  const todayRevenue = bills
    .filter((b) => b.paidAt && new Date(b.paidAt).toDateString() === new Date().toDateString())
    .reduce((s, b) => s + (b.total || 0), 0);

  const statCards = [
    { label: t("bills.totalRevenue"), value: `$${totalRevenue.toFixed(0)}`, icon: "payments", color: "#ffb690", sub: t("bills.allTimeGross") },
    { label: t("bills.billsIssued"), value: bills.length, icon: "receipt_long", color: "#56e5a9", sub: t("bills.totalTransactions") },
    { label: t("bills.todayRevenue"), value: `$${todayRevenue.toFixed(0)}`, icon: "today", color: "#ffc174", sub: t("bills.todaysVolume") },
    { label: t("bills.averageBill"), value: `$${avgBill.toFixed(2)}`, icon: "analytics", color: "#56e5a9", sub: t("bills.perTableAvg") },
  ];

  if (loading) {
    return (<div className="flex items-center justify-center h-96"><div className="flex flex-col items-center gap-4"><div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><p className="text-on-surface-variant/60 text-sm">{t("common.loading")}</p></div></div>);
  }
  if (error) {
    return (<div className="flex items-center justify-center h-96"><div className="text-center"><span className="material-symbols-outlined text-4xl text-error">error</span><p className="text-error text-sm mt-2">{error}</p><button onClick={fetchData} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30">{t("common.retry")}</button></div></div>);
  }

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["Bill ID", "Table", "Date", "Time", "Payment Method", "Total (USD)"];
    const rows = filtered.map((b) => {
      const id = "#SD-" + (b._id?.toString().slice(-4) || "").toUpperCase();
      const table = "Table " + (b.sessionId?.tableId?.number || "-");
      const date = b.paidAt ? new Date(b.paidAt).toLocaleDateString("en-US") : "-";
      const time = b.paidAt ? new Date(b.paidAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-";
      const method = b.paymentMethod || "Cash";
      const total = (b.total || 0).toFixed(2);
      return [id, table, date, time, method, total].map(v => `"${v}"`).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smartdine-bills-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-[32px] font-bold tracking-[-0.01em] text-white">{t("bills.title")}</h1><p className="text-on-surface-variant text-sm mt-1">{t("bills.subtitle")}</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <GlassCard key={i} className="rounded-xl p-4 md:p-6 flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110" style={{ color: s.color }}><span className="material-symbols-outlined text-8xl">{s.icon}</span></div>
            <div className="relative z-10"><p className="text-on-surface-variant text-xs uppercase tracking-widest mb-1">{s.label}</p><h3 className="text-[32px] font-bold tracking-[-0.01em]" style={{ color: s.color }}>{s.value}</h3><div className="flex items-center mt-2 text-on-surface-variant text-xs"><span className="material-symbols-outlined text-sm mr-1">{s.icon}</span><span>{s.sub}</span></div></div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="rounded-xl p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">{t("common.search").toLowerCase()}</span>
            <input className="w-full pl-10 pr-4 py-2 rounded-lg text-sm text-on-surface outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors placeholder:text-on-surface-variant/50" placeholder={t("bills.searchBillID")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="flex gap-2">
            <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} className="px-4 py-2 rounded-lg text-sm text-on-surface outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors">
              <option value="All">{t("bills.allPaymentMethods")}</option>
              {Object.entries(paymentMethods).map(([k, v]) => (<option key={k} value={k} className="bg-[#1a2333]">{t(v.label)}</option>))}
            </select>
            <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }} className="px-4 py-2 rounded-lg text-sm text-on-surface outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors" />
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="glass-card rounded-lg px-4 py-2 flex items-center gap-2 text-on-surface flex-1 md:flex-none justify-center text-sm font-semibold hover:bg-white/10 transition-colors"><span className="material-symbols-outlined">filter_list</span><span>{t("bills.advanced")}</span></button>
          <button onClick={handleExportCSV} className="glass-card rounded-lg px-4 py-2 flex items-center gap-2 text-primary flex-1 md:flex-none justify-center text-sm font-semibold hover:bg-primary/10 transition-colors" style={{ background: "rgba(255,193,116,0.1)", borderColor: "rgba(255,193,116,0.2)" }}><span className="material-symbols-outlined">download</span><span>{t("common.exportCSV")}</span></button>
        </div>
      </GlassCard>

      <GlassCard className="rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-20"><span className="material-symbols-outlined text-6xl text-on-surface-variant/10 mb-4 block">receipt_long</span><p className="text-on-surface-variant/40 text-sm">{t("bills.noBillsFound")}</p><button onClick={() => { setSearch(""); setPaymentFilter("All"); setDateFilter(""); }} className="mt-4 text-primary text-xs font-semibold hover:underline">{t("bills.clearFilters")}</button></div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="bg-surface-container-highest/50 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 md:px-6 md:py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("bills.billID")}</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("bills.tableNum")}</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("bills.dateTime")}</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold text-right">{t("bills.total")}</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("bills.method")}</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold text-center">{t("bills.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginated.map((bill) => {
                  const pm = paymentMethods[bill.paymentMethod] || { label: bill.paymentMethod || "Cash", icon: "payments", color: "#a08e7a" };
                  const tableNum = bill.sessionId?.tableId?.number || "-";
                  const dateStr = bill.paidAt ? new Date(bill.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";
                  const timeStr = bill.paidAt ? new Date(bill.paidAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "-";
                  const billId = bill._id ? "#SD-" + bill._id.toString().slice(-4).toUpperCase() : "-";
                  return (
                    <tr key={bill._id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-3 md:px-6 md:py-4"><span className="font-mono text-sm text-primary">{billId}</span></td>
                      <td className="px-4 py-3 md:px-6 md:py-4 text-sm text-on-surface">Table {tableNum}</td>
                      <td className="px-4 py-3 md:px-6 md:py-4"><div className="flex flex-col"><span className="text-sm text-on-surface">{dateStr}</span><span className="text-xs text-on-surface-variant">{timeStr}</span></div></td>
                      <td className="px-4 py-3 md:px-6 md:py-4 text-right"><span className="font-mono text-lg font-medium text-secondary">${(bill.total || 0).toFixed(2)}</span></td>
                      <td className="px-4 py-3 md:px-6 md:py-4"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm" style={{ color: pm.color }}>{pm.icon}</span><span className="text-sm text-on-surface">{t(pm.label)}</span></div></td>
                      <td className="px-4 py-3 md:px-6 md:py-4"><div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setSelectedBill(bill)} className="p-2 rounded-lg bg-white/10 text-on-surface hover:text-primary transition-colors" title={t("bills.printBill")}><span className="material-symbols-outlined">print</span></button><button className="p-2 rounded-lg bg-white/10 text-on-surface hover:text-secondary transition-colors" title={t("bills.exportPDF")}><span className="material-symbols-outlined">picture_as_pdf</span></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 md:px-6 md:py-4 bg-surface-container-highest/30 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">{t("bills.showing")} {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filtered.length)} {t("bills.entries")}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="glass-card p-2 rounded-lg flex items-center disabled:opacity-30"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pn; if (totalPages <= 5) pn = i + 1; else if (page <= 3) pn = i + 1; else if (page >= totalPages - 2) pn = totalPages - 4 + i; else pn = page - 2 + i;
                return (<button key={pn} onClick={() => setPage(pn)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${page === pn ? "glass-card bg-primary/20 text-primary border-primary/50" : "glass-card hover:bg-white/10"}`}>{pn}</button>);
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="glass-card p-2 rounded-lg flex items-center disabled:opacity-30"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
            </div>
          </div>
        )}
      </GlassCard>

      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print-modal-overlay" onClick={() => setSelectedBill(null)}>
          <GlassCard className="rounded-3xl p-6 w-full max-w-sm bill-print-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><div><h2 className="text-white font-bold text-lg">{t("bills.billDetail")} #{selectedBill._id?.toString().slice(-8)}</h2><p className="text-on-surface-variant/50 text-xs">Table {selectedBill.sessionId?.tableId?.number || "-"}</p></div><button onClick={() => setSelectedBill(null)} className="text-on-surface-variant hover:text-white"><span className="material-symbols-outlined">{t("common.close")}</span></button></div>
            <div className="mb-4 pb-3 border-b border-white/5 space-y-2 text-sm text-on-surface-variant">
              <div className="flex justify-between"><span>{t("bills.paymentMethod")}</span><span className="text-white">{t(paymentMethods[selectedBill.paymentMethod]?.label || selectedBill.paymentMethod)}</span></div>
              <div className="flex justify-between"><span>{t("bills.date")}</span><span className="font-mono text-white">{selectedBill.paidAt ? new Date(selectedBill.paidAt).toLocaleString() : "-"}</span></div>
            </div>
            <div className="flex justify-between pt-3 border-t border-white/10"><span className="text-white font-bold text-lg">{t("bills.total")}</span><span className="font-mono font-bold text-lg text-primary">${(selectedBill.total || 0).toFixed(2)}</span></div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setSelectedBill(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-white/10 text-on-surface hover:bg-white/5 transition-colors">{t("common.close")}</button>
              <button onClick={handlePrint} className="flex-1 py-3 rounded-xl text-sm font-bold bg-primary text-on-primary active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"><span className="material-symbols-outlined text-lg">print</span>{t("bills.printBill")}</button>
            </div>
          </GlassCard>
        </div>
      )}
      {/* Print-only styles */}
      <style>{`
        @media print {
          @page { margin: 1cm; }
          body * { visibility: hidden !important; }
          .print-modal-overlay, .print-modal-overlay * { visibility: visible !important; }
          .print-modal-overlay { position: fixed !important; inset: 0 !important; background: white !important; backdrop-filter: none !important; display: flex !important; align-items: flex-start !important; justify-content: center !important; padding-top: 2cm !important; z-index: 99999 !important; }
          .bill-print-card { background: white !important; backdrop-filter: none !important; border: 2px solid #000 !important; box-shadow: none !important; border-radius: 0 !important; color: #000 !important; max-width: 100% !important; }
          .bill-print-card * { color: #000 !important; }
          .bill-print-card button { display: none !important; }
          .bill-print-card .material-symbols-outlined { display: none !important; }
          .print-modal-overlay > .bill-print-card { color: #000 !important; }
        }
      `}</style>
    </div>
  );
}
