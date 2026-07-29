import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserBottomNav } from "@/components/layout/UserBottomNav";

const STATUS_STEPS = [
  { key: "received", label: "Order Received", icon: "receipt" },
  { key: "confirmed", label: "Confirmed", icon: "check_circle" },
  { key: "preparing", label: "Preparing", icon: "cooking" },
  { key: "ready", label: "Ready to Serve", icon: "room_service" },
  { key: "served", label: "Served", icon: "done_all" },
];

const mockOrders = [
  {
    id: "#SD-4091", status: "preparing", statusIndex: 2, eta: "12 min",
    items: [
      { name: "Wagyu Beef Tartare", qty: 2, price: "$58.00" },
      { name: "Ribeye Steak 300g", qty: 1, price: "$95.00" },
      { name: "Chocolate Lava Cake", qty: 1, price: "$12.00" },
    ],
    total: "$223.00",
    time: "19:45",
  },
  {
    id: "#SD-4090", status: "confirmed", statusIndex: 1, eta: "18 min",
    items: [
      { name: "Sparkling Yuzu", qty: 2, price: "$14.00" },
    ],
    total: "$28.00",
    time: "19:52",
  },
];

export default function OrderTrackingPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState(mockOrders);

  // Simulate real-time status update
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.statusIndex < 4 && Math.random() > 0.7) {
            const next = o.statusIndex + 1;
            return { ...o, status: STATUS_STEPS[next].key, statusIndex: next, eta: next === 4 ? null : `${Math.max(1, parseInt(o.eta) - 3)} min` };
          }
          return o;
        })
      );
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen text-on-surface pb-24 relative" style={{ background: "radial-gradient(circle at top right, #1a2333, #0c1322)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(`/customer/${tableId}`)} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span><span className="text-sm font-medium">Table {tableId}</span>
          </button>
          <h1 className="text-lg font-bold text-white">Track Orders</h1>
          <span className="w-16" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {orders.map((order, oIdx) => {
          const currentStep = order.statusIndex;
          return (
            <div key={oIdx} className="rounded-2xl p-5"
              style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "inset 1px 1px 0px rgba(255,255,255,0.05)" }}>
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-on-surface-variant/50 text-xs uppercase tracking-wider">Order</p>
                  <p className="font-mono text-white font-bold">{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-on-surface-variant/50 text-xs uppercase tracking-wider">Placed</p>
                  <p className="font-mono text-on-surface-variant text-sm">{order.time}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="mb-5">
                <div className="flex items-start">
                  {STATUS_STEPS.map((step, idx) => {
                    const done = idx <= currentStep;
                    const active = idx === currentStep;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          done ? "bg-tertiary/20 border border-tertiary/40 text-tertiary" :
                          active ? "bg-primary/20 border border-primary/40 text-primary animate-pulse" :
                          "bg-white/5 border border-white/10 text-on-surface-variant/30"
                        }`}>
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}>
                            {step.icon}
                          </span>
                        </div>
                        <p className={`text-[9px] mt-2 text-center font-semibold ${done ? "text-tertiary" : active ? "text-primary" : "text-on-surface-variant/30"}`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {/* Progress bar */}
                <div className="h-1 rounded-full mt-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%`, background: "linear-gradient(90deg, #56e5a9, #ffc174)" }} />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-4">
                {order.items.map((item, j) => (
                  <div key={j} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-on-surface-variant">{item.name} <span className="text-on-surface-variant/40">x{item.qty}</span></span>
                    <span className="font-mono text-on-surface-variant text-xs">{item.price}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: currentStep >= 4 ? "#a78bfa" : currentStep >= 2 ? "#56e5a9" : "#ffc174" }} />
                  <span className="text-sm font-semibold text-white capitalize">{order.status}</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold text-lg">{order.total}</span>
                  {order.eta && <p className="font-mono text-xs text-on-surface-variant/40">Est. {order.eta}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <UserBottomNav tableId={tableId} />
    </div>
  );
}
