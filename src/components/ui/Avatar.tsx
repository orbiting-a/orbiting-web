"use client";

import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";
import { useRef, useEffect, useState } from "react";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}

const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

const onlineSizeMap = {
  xs: "h-1.5 w-1.5 ring-1",
  sm: "h-2 w-2 ring-[1.5px]",
  md: "h-2.5 w-2.5 ring-2",
  lg: "h-3 w-3 ring-2",
  xl: "h-4 w-4 ring-[3px]",
};

export function Avatar({
  src,
  name = "",
  size = "md",
  online,
  className,
}: AvatarProps) {
  const initials = getInitials(name || "?");
  const prevSrc = useRef(src);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (src && src !== prevSrc.current) {
      setVersion((v) => v + 1);
      prevSrc.current = src;
    }
  }, [src]);

  const imageSrc = src
    ? `${src}${src.includes("?") ? "&" : "?"}_=${version}`
    : undefined;

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {imageSrc ? (
        <Image
          key={version}
          src={imageSrc}
          alt={name || "Avatar"}
          width={80}
          height={80}
          className={cn(
            "rounded-full object-cover bg-brand-100 dark:bg-brand-900",
            sizeMap[size]
          )}
          unoptimized
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-semibold",
            "bg-gradient-to-br from-brand-400 to-brand-600 text-white",
            sizeMap[size]
          )}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-surface-raised",
            online ? "bg-green-500" : "bg-text-muted",
            onlineSizeMap[size]
          )}
        />
      )}
    </div>
  );
}
