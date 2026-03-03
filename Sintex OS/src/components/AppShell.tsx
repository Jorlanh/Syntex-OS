import React, { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-40 md:hidden transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <AppSidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
      </div>

      {/* Main content */}
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        collapsed ? "md:ml-[68px]" : "md:ml-[260px]"
      )}>
        {/* Mobile header */}
        <div className="md:hidden flex items-center h-14 px-4 border-b border-border/40 glass-panel">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 text-sm font-bold tracking-wide">SYNTEX OS</span>
        </div>

        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
