import React from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { UserBottomNav } from "@/components/layout/UserBottomNav";

const statusSteps = [
  { label: "Order Placed", time: "19:45", done: true, icon: "receipt" },
  { label: "Preparing", time: "19:52", done: true, icon: "cooking" },
  { label: "Ready to Serve", time: "--", done: false, active: true, icon: "room_service" },
  { label: "Served", time: "--", done: false, icon: "done_all" },
];

export default function OrderStatusPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-warm text-on-surface pb-24 relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-lg font-bold text-white">Track Order</h1>
          <span className="w-16" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Order Header */}
        <GlassCard className="rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-on-surface-variant text-sm">Order #</p>
              <p className="font-mono text-white font-bold text-data-lg">SD-4091</p>
            </div>
            <div className="text-right">
              <p className="text-on-surface-variant text-sm">Table</p>
              <p className="font-mono text-primary font-bold text-data-lg">A7</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-status-pulse" />
              <span className="text-tertiary text-sm font-medium">Preparing</span>
            </div>
            <span className="text-on-surface-variant/60 text-sm">Est. 12 min</span>
          </div>
        </GlassCard>

        {/* Status Timeline */}
        <GlassCard className="rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-6">Order Progress</h3>
          <div className="space-y-0">
            {statusSteps.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      step.done
                        ? "bg-tertiary/20 border border-tertiary/40 text-tertiary"
                        : step.active
                        ? "bg-primary/20 border border-primary/40 text-primary animate-status-pulse"
                        : "bg-white/5 border border-white/10 text-on-surface-variant/40"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-lg"
                      style={{ fontVariationSettings: step.done ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {step.icon}
                    </span>
                  </div>
                  {idx < statusSteps.length - 1 && (
                    <div className={`w-0.5 h-8 my-1 ${step.done ? "bg-tertiary" : "bg-white/10"}`} />
                  )}
                </div>
                <div className="pb-6">
                  <p className={`font-semibold ${step.done || step.active ? "text-white" : "text-on-surface-variant/40"}`}>
                    {step.label}
                  </p>
                  <p className="font-mono text-xs text-on-surface-variant/50 mt-0.5">{step.time}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Order Items */}
        <GlassCard className="rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-4">Your Order</h3>
          <div className="space-y-3">
            {[
              { name: "Wagyu Beef Tartare", qty: 2, price: 580000 },
              { name: "Ribeye Steak 300g", qty: 1, price: 950000 },
              { name: "Chocolate Lava Cake", qty: 1, price: 280000 },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <div>
                  <span className="text-white text-sm">{item.name}</span>
                  <span className="text-on-surface-variant/50 text-xs ml-2">x{item.qty}</span>
                </div>
                <span className="font-mono text-on-surface-variant text-sm">{(item.price * item.qty).toLocaleString("vi-VN")}đ</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 mt-4 pt-4 flex justify-between">
            <span className="text-white font-semibold">Total</span>
            <span className="font-mono text-primary font-bold">{(580000 * 2 + 950000 + 280000 + 35000).toLocaleString("vi-VN")}đ</span>
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="space-y-3">
          <GlassButton
            variant="secondary"
            size="lg"
            className="w-full"
            icon="support_agent"
          >
            Call Staff
          </GlassButton>
          <GlassButton
            variant="primary"
            size="lg"
            className="w-full"
            icon="payments"
            onClick={() => navigate("/support")}
          >
            View Bill & Pay
          </GlassButton>
        </div>
      </div>

      <UserBottomNav />
    </div>
  );
}
