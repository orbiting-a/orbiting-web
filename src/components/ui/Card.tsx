"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

export function Card({
  children,
  className,
  hover = false,
  padding = "md",
  onClick,
}: CardProps) {
  const paddingMap = {
    none: "",
    sm: "p-3",
    md: "p-4 sm:p-5",
    lg: "p-6 sm:p-8",
  };

  return (
    <div
      className={cn(
        "rounded-2xl bg-surface-raised border border-border-subtle",
        "transition-all duration-200",
        hover && "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
        paddingMap[padding],
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      {children}
    </div>
  );
}
