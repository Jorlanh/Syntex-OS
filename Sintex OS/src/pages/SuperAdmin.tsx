import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Building2, Plus, Trash2, Edit2, Users, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Tenant {
  id: string;
  name: string;
  cnpj: string;
  adminEmail: string;
  plan: string;
  status: "active" | "suspended";
  usersCount: number;
  createdAt: string;
}

const initialTenants: Tenant[] = [
  { id: "t-1", name: "Química BR Ltda", cnpj: "12.345.678/0001-99", adminEmail: "admin@quimicabr.com", plan: "Enterprise", status: "active", usersCount: 24, createdAt: "15/01/2026" },
  { id: "t-2", name: "PetroQuím S.A.", cnpj: "98.765.432/0001-11", adminEmail: "admin@petroquim.com", plan: "Pro", status: "active", usersCount: 12, createdAt: "20/01/2026" },
  { id: "t-3", name: "Solventes Norte", cnpj: "55.444.333/0001-22", adminEmail: "admin@solventesnorte.com", plan: "Starter", status: "suspended", usersCount: 5, createdAt: "01/02/2026" },
];

const SuperAdmin = () => {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", cnpj: "", adminEmail: "", adminPassword: "", plan: "Pro" });

  const handleCreate = () => {
    if (!form.name || !form.adminEmail) return;
    const newTenant: Tenant = {
      id: `t-${Date.now()}`,
      name: form.name,
      cnpj: form.cnpj,
      adminEmail: form.adminEmail,
      plan: form.plan,
      status: "active",
      usersCount: 1,
      createdAt: new Date().toLocaleDateString("pt-BR"),
    };
    setTenants([...tenants, newTenant]);
    setForm({ name: "", cnpj: "", adminEmail: "", adminPassword: "", plan: "Pro" });
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setTenants(tenants.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Super Admin — Gestão de Tenants</h1>
          <p className="text-sm text-muted-foreground mt-1">Cadastro de empresas pagantes e licenças</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nova Empresa
            </button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Cadastrar Nova Empresa</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome da Empresa</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CNPJ</label>
                <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">E-mail do Admin</label>
                <input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Senha Inicial</label>
                <input type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plano</label>
                <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="Starter">Starter</option>
                  <option value="Pro">Pro</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
              <button onClick={handleCreate} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Cadastrar Empresa</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <GlassCard title="Empresas Cadastradas" subtitle={`${tenants.length} tenants ativos`}>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">Empresa</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider hidden md:table-cell">CNPJ</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">Admin</th>
                <th className="text-center text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">Plano</th>
                <th className="text-center text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">Usuários</th>
                <th className="text-center text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-muted-foreground text-xs hidden md:table-cell">{t.cnpj}</td>
                  <td className="py-3 text-muted-foreground text-xs">{t.adminEmail}</td>
                  <td className="py-3 text-center"><span className="text-xs font-medium text-primary">{t.plan}</span></td>
                  <td className="py-3 text-center font-mono text-muted-foreground">{t.usersCount}</td>
                  <td className="py-3 text-center">
                    <span className={`text-[10px] uppercase tracking-wider font-medium ${t.status === "active" ? "text-success" : "text-destructive"}`}>{t.status === "active" ? "Ativo" : "Suspenso"}</span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default SuperAdmin;
