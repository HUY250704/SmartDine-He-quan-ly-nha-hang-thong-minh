import React, { useEffect, useRef } from "react";

export function GlassModal({ open, onClose, title, children, size = "md" }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`rounded-3xl p-6 w-full ${sizeClasses[size]} animate-[slideUp_0.3s_cubic-bezier(0.34,1.56,0.64,1)]`}
        style={{
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-xl">{title}</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
