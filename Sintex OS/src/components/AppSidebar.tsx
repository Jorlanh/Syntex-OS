import React from "react";
import {
  Truck, BarChart3, Box, ShoppingCart, ScanLine, FlaskConical, FileSearch,
  Link2, ChevronLeft, ChevronRight, Hexagon, Shield, Users, LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const modules = [
  { title: "Torre de Controle", url: "/", icon: BarChart3, description: "Analytics C-Level" },
  { title: "Pátio & Logística", url: "/patio", icon: Truck, description: "Agendamento & Filas" },
  { title: "Gêmeo Digital", url: "/digital-twin", icon: Box, description: "Simulação de Planta" },
  { title: "Smart Procurement", url: "/procurement", icon: ShoppingCart, description: "Compras Inteligentes" },
  { title: "Backoffice IA", url: "/backoffice", icon: ScanLine, description: "OCR & Documentos" },
  { title: "Formulações IA", url: "/formulations", icon: FlaskConical, description: "Motor de ML" },
  { title: "Tributário", url: "/tax", icon: FileSearch, description: "Auditoria & Créditos" },
  { title: "Blockchain ESG", url: "/blockchain", icon: Link2, description: "Rastreabilidade" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const adminLinks = [];
  if (user?.role === "super_admin") {
    adminLinks.push({ title: "Super Admin", url: "/super-admin", icon: Shield, description: "Gestão de Tenants" });
  }
  if (user?.role === "admin" || user?.role === "super_admin") {
    adminLinks.push({ title: "Gestão de Equipe", url: "/team", icon: Users, description: "Usuários & Permissões" });
  }

  return (
    <aside className={cn("glass-sidebar fixed left-0 top-0 z-40 flex h-full flex-col transition-all duration-300", collapsed ? "w-[68px]" : "w-[260px]")}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border/40">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 glow-primary-subtle">
          <Hexagon className="h-5 w-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold tracking-wide text-foreground">SYNTEX OS</h1>
            <p className="text-[10px] font-medium text-muted-foreground tracking-widest">INDÚSTRIA 4.0</p>
          </div>
        )}
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-border/40">
          <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{user.tenantName}</p>
          <span className="text-[9px] uppercase tracking-widest text-primary font-medium">{user.role === "super_admin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Usuário"}</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {adminLinks.length > 0 && (
          <>
            {!collapsed && <p className="text-[9px] uppercase tracking-widest text-muted-foreground px-3 mb-2 mt-1">Administração</p>}
            {adminLinks.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <NavLink key={item.url} to={item.url} className={cn("group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200", "text-muted-foreground hover:text-foreground hover:bg-secondary/60", collapsed && "justify-center px-2")} activeClassName="bg-primary/10 text-primary glow-primary-subtle border border-primary/20">
                  <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-primary")} />
                  {!collapsed && (
                    <div className="animate-fade-in overflow-hidden">
                      <span className="block font-medium truncate">{item.title}</span>
                      <span className="block text-[10px] text-muted-foreground truncate">{item.description}</span>
                    </div>
                  )}
                </NavLink>
              );
            })}
            <div className="my-2 mx-3 border-b border-border/30" />
          </>
        )}

        {!collapsed && <p className="text-[9px] uppercase tracking-widest text-muted-foreground px-3 mb-2">Módulos</p>}
        {modules.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink key={item.url} to={item.url} end={item.url === "/"} className={cn("group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200", "text-muted-foreground hover:text-foreground hover:bg-secondary/60", collapsed && "justify-center px-2")} activeClassName="bg-primary/10 text-primary glow-primary-subtle border border-primary/20">
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-primary")} />
              {!collapsed && (
                <div className="animate-fade-in overflow-hidden">
                  <span className="block font-medium truncate">{item.title}</span>
                  <span className="block text-[10px] text-muted-foreground truncate">{item.description}</span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/40 p-2 space-y-1">
        <button onClick={logout} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors", collapsed && "justify-center px-2")}>
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="text-xs">Sair</span>}
        </button>
        <button onClick={onToggle} className="flex w-full items-center justify-center rounded-lg py-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
