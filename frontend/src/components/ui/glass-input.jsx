import React from "react";
import { cn } from "@/lib/utils";

export function GlassInput({ className, icon, error, ...props }) {
  return (
    <div className="relative w-full">
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 material-symbols-outlined text-xl pointer-events-none">
          {icon}
        </span>
      )}
      <input
        className={cn(
          "w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl py-3 text-on-surface placeholder-on-surface-variant/50 outline-none transition-all duration-300",
          "focus:border-primary/50 focus:shadow-[0_0_12px_rgba(255,193,116,0.15)] focus:bg-white/8",
          icon ? "pl-12 pr-4" : "px-4",
          error && "border-error/50 animate-shake",
          className
        )}
        {...props}
      />
    </div>
  );
}
