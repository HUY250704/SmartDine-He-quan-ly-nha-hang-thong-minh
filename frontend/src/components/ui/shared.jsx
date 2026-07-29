import React from "react";

const variants = {
  success: { bg: "rgba(86,229,169,0.1)", text: "#56e5a9", border: "rgba(86,229,169,0.3)", icon: "check_circle" },
  warning: { bg: "rgba(255,193,116,0.1)", text: "#ffc174", border: "rgba(255,193,116,0.3)", icon: "warning" },
  error: { bg: "rgba(255,180,171,0.1)", text: "#ffb4ab", border: "rgba(255,180,171,0.3)", icon: "error" },
  info: { bg: "rgba(255,182,144,0.1)", text: "#ffb690", border: "rgba(255,182,144,0.3)", icon: "info" },
  neutral: { bg: "rgba(255,255,255,0.05)", text: "#dce2f7", border: "rgba(255,255,255,0.1)", icon: null },
};

export function GlassBadge({ children, variant = "neutral", dot = false, className = "" }) {
  const v = variants[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${className}`}
      style={{ background: v.bg, color: v.text, border: `1px solid ${v.border}` }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {v.icon && <span className="material-symbols-outlined text-xs">{v.icon}</span>}
      {children}
    </span>
  );
}

export function GlassSpinner({ size = "md", className = "" }) {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg className="animate-spin w-full h-full" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <path d="M12 2a10 10 0 019.95 9" stroke="#ffc174" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function EmptyState({ icon = "inventory_2", title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <span className="material-symbols-outlined text-7xl text-on-surface-variant/20 mb-4">{icon}</span>
      <h3 className="text-white font-bold text-xl mb-1">{title}</h3>
      {description && <p className="text-on-surface-variant/50 text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
