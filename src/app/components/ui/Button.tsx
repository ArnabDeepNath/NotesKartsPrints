"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

const variants = {
  primary:
    "bg-[#2997ff] hover:bg-[#1a83ff] text-white shadow-[0_0_24px_rgba(41,151,255,0.3)]",
  secondary:
    "bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.1]",
  ghost: "bg-transparent hover:bg-white/[0.06] text-[#86868b] hover:text-white",
  danger:
    "bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 text-[#ff453a] border border-[#ff3b30]/20",
  outline:
    "bg-transparent border border-white/[0.2] hover:border-white/[0.4] text-white",
};

const sizes = {
  sm: "text-xs px-3.5 py-2 rounded-xl gap-1.5",
  md: "text-sm px-5 py-2.5 rounded-xl gap-2",
  lg: "text-base px-7 py-3.5 rounded-2xl gap-2.5",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight = false,
  children,
  disabled,
  fullWidth,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.03 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.2" />
          <path d="M21 12a9 9 0 00-9-9" />
        </svg>
      ) : (
        !iconRight && icon
      )}
      {children}
      {!loading && iconRight && icon}
    </motion.button>
  );
}
