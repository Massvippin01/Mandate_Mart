"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Panel ──────────────────────────────────────────────────
export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}

export function Panel({ children, className, as = "section", ...props }: PanelProps) {
  const Component = as;
  return (
    <Component
      className={cn(
        "bg-zinc-900/50 border border-white/[0.06] rounded-2xl backdrop-blur-sm shadow-xl transition-all",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// ── PanelHeader ────────────────────────────────────────────
export interface PanelHeaderProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function PanelHeader({ icon, title, meta, className }: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-5 border-b border-white/[0.04] gap-3",
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <div className="shrink-0 text-violet-400">{icon}</div>}
        <h3 className="text-sm font-semibold text-zinc-200 tracking-normal truncate">
          {title}
        </h3>
      </div>
      {meta && <div className="shrink-0">{meta}</div>}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────
export type BadgeTone = "neutral" | "success" | "danger" | "warn" | "info";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-zinc-800/80 text-zinc-300 border-zinc-700/40",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  warn: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  info: "bg-violet-500/10 text-violet-300 border-violet-500/20",
};

export function Badge({ tone = "neutral", children, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-normal font-sans",
        BADGE_TONES[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ── Button ─────────────────────────────────────────────────
export type ButtonVariant = "primary" | "danger" | "success" | "outline" | "ghost";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-950/40",
  danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-950/40",
  success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950/40",
  outline: "border border-zinc-700/80 hover:bg-zinc-800 text-zinc-200 bg-zinc-900/60",
  ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800/60",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "outline", size = "md", children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "rounded-lg font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950",
          "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
          BUTTON_VARIANTS[variant],
          BUTTON_SIZES[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
