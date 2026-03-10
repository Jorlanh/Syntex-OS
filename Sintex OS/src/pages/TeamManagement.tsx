import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Edit2, ShieldCheck, User as UserIcon, Lock, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  modules: string[];
  lastAccess: string;
  cpf?: string;
  phone?: string;
}

const allModules = [
  "Torre de Controle", "Pátio & Logística", "Gêmeo Digital", "Smart Procurement",
  "Backoffice IA", "Formulações IA", "Tributário", "Blockchain ESG",
];

const initialMembers: TeamMember[] = [
  { id: "u-1", name: "Ana Souza", email: "ana@quimicabr.com", role: "user", modules: ["Torre de Controle", "Pátio & Logística", "Backoffice IA"], lastAccess: "02/03/2026 14:32" },
];

const TeamManagement = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [form, setForm] = useState({ 
    name: "", email: "", password: "", role: "user" as "admin" | "user", 
    modules: [] as string[], cpf: "", phone: "" 
  });

  useEffect(() => {
    if (user && !members.find(m => m.id === user.id)) {
      const adminMember: TeamMember = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "admin",
        modules: allModules,
        lastAccess: "Agora",
      };
      setMembers(prev => [adminMember, ...prev]);
    }
  }, [user]);

  const toggleModule = (mod: string) => {
    setForm((f) => ({
      ...f,
      modules: f.modules.includes(mod) ? f.modules.filter((m) => m !== mod) : [...f.modules, mod],
    }));
  };

  const handleSave = () => {
    if (!form.name || !form.email) return;
    // Se for novo usuário, a senha é obrigatória
    if (!editingId && !form.password) return;

    if (editingId) {
      setMembers(members.map((m) => m.id === editingId ? { ...m, ...form } : m));
    } else {
      setMembers([...members, { 
        ...form, 
        id: `m-${Date.now()}`, 
        lastAccess: "-" 
      }]);
    }
    resetForm();
  };

  const handleEdit = (m: TeamMember) => {
    setForm({ 
      name: m.name, email: m.email, password: "", 
      role: m.role, modules: m.modules, 
      cpf: m.cpf || "", phone: m.phone || "" 
    });
    setEditingId(m.id);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", role: "user", modules: [], cpf: "", phone: "" });
    setEditingId(null);
    setDialogOpen(false);
    setShowPassword(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Equipe</h1>
          <p className="text-sm text-muted-foreground mt-1">{user?.tenantName} — Gerenciar permissões e acessos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <button className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" /> Novo Membro
            </button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-border max-w-md overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingId === user?.id ? "Editar Meus Dados" : editingId ? "Editar Cadastro" : "Criar Novo Membro"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase">Nome</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase">E-mail</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase">CPF</label>
                  <input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase">Telefone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none" />
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] font-medium text-muted-foreground uppercase">
                  {editingId ? "Alterar Senha (deixe em branco para manter)" : "Senha de Acesso"}
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                    className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase">Cargo</label>
                <select 
                  value={form.role} 
                  onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                  className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground outline-none"
                  disabled={editingId === user?.id}
                >
                  <option value="user">Usuário Comum</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase mb-2 block">Módulos de Acesso</label>
                <div className="grid grid-cols-2 gap-2">
                  {allModules.map((mod) => (
                    <button key={mod} type="button" onClick={() => toggleModule(mod)} className={`text-[10px] rounded-lg border px-2 py-1.5 transition-colors text-left ${form.modules.includes(mod) ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-secondary/20 text-muted-foreground"}`}>
                      {mod}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleSave} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                {editingId ? "Salvar Alterações" : "Confirmar Cadastro"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <GlassCard title="Colaboradores" subtitle={`${members.length} membros ativos`}>
        <div className="mt-4 space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-4 py-3 border-b border-border/20 last:border-0 hover:bg-secondary/10 rounded px-2 transition-colors">
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", m.role === "admin" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground")}>
                {m.role === "admin" ? <ShieldCheck className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{m.name}</p>
                  {m.id === user?.id && <span className="text-[8px] bg-primary/10 text-primary px-1 rounded uppercase font-bold tracking-tighter">Você</span>}
                </div>
                <p className="text-xs text-muted-foreground">{m.email} • {m.role.toUpperCase()}</p>
              </div>
              
              <div className="hidden md:flex flex-wrap gap-1 max-w-[200px] justify-end">
                {m.modules.slice(0, 2).map((mod) => (
                  <span key={mod} className="text-[9px] rounded bg-secondary px-1.5 py-0.5 text-muted-foreground">{mod}</span>
                ))}
                {m.modules.length > 2 && <span className="text-[9px] text-muted-foreground">+{m.modules.length - 2}</span>}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleEdit(m)} className="p-1.5 rounded hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-colors">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                {m.id !== user?.id ? (
                  <button onClick={() => setMembers(members.filter((x) => x.id !== m.id))} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="p-1.5 text-muted-foreground/30 cursor-not-allowed">
                    <Lock className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default TeamManagement;