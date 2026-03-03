import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function GlassCard({ children, className, title, subtitle, action }: GlassCardProps) {
  return (
    <div className={cn("glass-panel rounded-xl animate-fade-in", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div>
            {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}
