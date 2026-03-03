import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, Edit2, UserCircle, ShieldCheck, User as UserIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  modules: string[];
  lastAccess: string;
}

const allModules = [
  "Torre de Controle", "Pátio & Logística", "Gêmeo Digital", "Smart Procurement",
  "Backoffice IA", "Formulações IA", "Tributário", "Blockchain ESG",
];

const initialMembers: TeamMember[] = [
  { id: "m-1", name: "Ana Souza", email: "ana@quimicabr.com", role: "user", modules: ["Torre de Controle", "Pátio & Logística", "Backoffice IA"], lastAccess: "02/03/2026 14:32" },
  { id: "m-2", name: "Roberto Lima", email: "roberto@quimicabr.com", role: "user", modules: allModules, lastAccess: "02/03/2026 11:15" },
  { id: "m-3", name: "Fernanda Costa", email: "fernanda@quimicabr.com", role: "user", modules: ["Tributário", "Blockchain ESG"], lastAccess: "01/03/2026 09:45" },
];

const TeamManagement = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", modules: [] as string[] });

  const toggleModule = (mod: string) => {
    setForm((f) => ({
      ...f,
      modules: f.modules.includes(mod) ? f.modules.filter((m) => m !== mod) : [...f.modules, mod],
    }));
  };

  const handleSave = () => {
    if (!form.name || !form.email) return;
    if (editingId) {
      setMembers(members.map((m) => m.id === editingId ? { ...m, name: form.name, email: form.email, modules: form.modules } : m));
    } else {
      setMembers([...members, { id: `m-${Date.now()}`, name: form.name, email: form.email, role: "user", modules: form.modules, lastAccess: "-" }]);
    }
    resetForm();
  };

  const handleEdit = (m: TeamMember) => {
    setForm({ name: m.name, email: m.email, password: "", modules: m.modules });
    setEditingId(m.id);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", modules: [] });
    setEditingId(null);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Equipe</h1>
          <p className="text-sm text-muted-foreground mt-1">{user?.tenantName} — Gerenciar usuários secundários</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <button className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" /> Novo Usuário
            </button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingId ? "Editar Usuário" : "Criar Usuário"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">E-mail</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              {!editingId && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Senha</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Módulos Permitidos</label>
                <div className="grid grid-cols-2 gap-2">
                  {allModules.map((mod) => (
                    <button key={mod} type="button" onClick={() => toggleModule(mod)} className={`text-xs rounded-lg border px-3 py-2 transition-colors text-left ${form.modules.includes(mod) ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-secondary/20 text-muted-foreground hover:text-foreground"}`}>
                      {mod}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleSave} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">{editingId ? "Salvar Alterações" : "Criar Usuário"}</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <GlassCard title="Membros da Equipe" subtitle={`${members.length} usuários cadastrados`}>
        <div className="mt-4 space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-4 py-3 border-b border-border/20 last:border-0 hover:bg-secondary/20 rounded px-2 transition-colors">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
              <div className="hidden md:flex flex-wrap gap-1 max-w-[300px]">
                {m.modules.slice(0, 3).map((mod) => (
                  <span key={mod} className="text-[10px] rounded bg-primary/10 text-primary px-1.5 py-0.5">{mod}</span>
                ))}
                {m.modules.length > 3 && <span className="text-[10px] text-muted-foreground">+{m.modules.length - 3}</span>}
              </div>
              <span className="text-xs text-muted-foreground font-mono hidden lg:block">{m.lastAccess}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleEdit(m)} className="p-1.5 rounded hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => setMembers(members.filter((x) => x.id !== m.id))} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default TeamManagement;
