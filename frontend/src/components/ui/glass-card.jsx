import React from "react";
import { cn } from "@/lib/utils";

export function GlassCard({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassCardHover({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-primary/30 transition-all duration-300 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassCardSubtle({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "backdrop-blur-md bg-white/[0.03] border border-white/[0.06]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
