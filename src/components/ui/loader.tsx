import * as React from "react";
import { cn } from "@/lib/utils";

type LoaderProps = {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  className?: string;
};

export function Loader({ size = "md", color, className }: LoaderProps) {
  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10",
  };

  const defaultColor = color || "var(--color-destructive)";

  return (
    <div className="flex items-center justify-center">
      <svg
        className={cn("animate-spin", sizeClasses[size], className)}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="spinner-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={defaultColor} stopOpacity="0" />
            <stop offset="100%" stopColor={defaultColor} stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="url(#spinner-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="75 100"
          strokeDashoffset="0"
        />
      </svg>
    </div>
  );
}
