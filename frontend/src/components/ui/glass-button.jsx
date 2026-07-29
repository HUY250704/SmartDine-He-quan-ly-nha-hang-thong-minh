import React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "glass-btn text-on-surface hover:border-primary/50 hover:bg-white/15",
  primary:
    "bg-primary/15 backdrop-blur-md border border-primary/30 text-primary hover:bg-primary/25 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(255,193,116,0.15)]",
  secondary:
    "bg-secondary/15 backdrop-blur-md border border-secondary/30 text-secondary hover:bg-secondary/25 hover:border-secondary/50 hover:shadow-[0_0_20px_rgba(255,182,144,0.15)]",
  tertiary:
    "bg-tertiary/15 backdrop-blur-md border border-tertiary/30 text-tertiary hover:bg-tertiary/25 hover:border-tertiary/50 hover:shadow-[0_0_20px_rgba(86,229,169,0.15)]",
  gradient:
    "bg-gradient-to-r from-primary-container via-primary to-primary-container text-on-primary-container shadow-xl hover:shadow-primary/20",
  ghost: "bg-transparent border border-transparent text-on-surface-variant hover:text-white hover:bg-white/5",
  danger:
    "bg-error/15 backdrop-blur-md border border-error/30 text-error hover:bg-error/25 hover:border-error/50",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-base rounded-xl",
  lg: "px-6 py-3 text-lg rounded-xl",
  xl: "px-8 py-4 text-headline-md rounded-2xl",
  icon: "p-2 rounded-xl",
};

export function GlassButton({
  children,
  className,
  variant = "default",
  size = "md",
  icon,
  ...props
}) {
  return (
    <button
      className={cn(
        "relative overflow-hidden inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 active:scale-[0.95]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && <span className="material-symbols-outlined">{icon}</span>}
      {children}
    </button>
  );
}
