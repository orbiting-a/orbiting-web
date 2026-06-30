"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  rightIcon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500",
            "hover:border-brand-300",
            icon && "pl-10",
            rightIcon && "pr-10",
            error && "border-red-500 focus:ring-red-500/40 focus:border-red-500",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted",
          "transition-all duration-200 resize-none",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500",
          "hover:border-brand-300",
          error && "border-red-500 focus:ring-red-500/40 focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
