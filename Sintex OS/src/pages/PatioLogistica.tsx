import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Truck, Calendar, Clock, ArrowRight, ArrowDown, AlertTriangle, Plus, Share2, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Agendamento {
  id: string;
  hora: string;
  doca: number;
  transportadora: string;
  tipo: string;
  motorista?: string;
  telefone?: string;
}

interface FilaCaminhao {
  placa: string;
  transportadora: string;
  produto: string;
  doca: number | null;
  status: string;
  tempo: string;
}

const initialFilas: FilaCaminhao[] = [
  { placa: "ABC-1D23", transportadora: "TransLog BR", produto: "Ácido Sulfúrico", doca: 3, status: "carregando", tempo: "12 min" },
  { placa: "XYZ-4E56", transportadora: "QuimTrans", produto: "NaOH 50%", doca: 7, status: "aguardando", tempo: "28 min" },
  { placa: "DEF-7G89", transportadora: "ChemFreight", produto: "HCl 33%", doca: null, status: "na_fila", tempo: "45 min" },
  { placa: "GHI-0J12", transportadora: "LogQuímica", produto: "Soda Cáustica", doca: 12, status: "descarregando", tempo: "8 min" },
  { placa: "JKL-3M45", transportadora: "ExpressChem", produto: "Peróxido H2O2", doca: null, status: "na_fila", tempo: "52 min" },
];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  carregando: { label: "Carregando", variant: "default" },
  descarregando: { label: "Descarregando", variant: "default" },
  aguardando: { label: "Aguardando", variant: "secondary" },
  na_fila: { label: "Na Fila", variant: "outline" },
};

const PatioLogistica = () => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([
    { id: "a1", hora: "07:00", doca: 1, transportadora: "TransLog BR", tipo: "Carga", motorista: "José Silva", telefone: "5511999990001" },
    { id: "a2", hora: "07:30", doca: 3, transportadora: "QuimTrans", tipo: "Descarga", motorista: "Pedro Santos", telefone: "5511999990002" },
    { id: "a3", hora: "08:00", doca: 5, transportadora: "ChemFreight", tipo: "Carga" },
    { id: "a4", hora: "08:30", doca: 2, transportadora: "LogQuímica", tipo: "Descarga" },
    { id: "a5", hora: "09:00", doca: 7, transportadora: "ExpressChem", tipo: "Carga" },
  ]);
  const [filas] = useState(initialFilas);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ hora: "", doca: "1", transportadora: "", tipo: "Carga", motorista: "", telefone: "" });

  const handleCreate = () => {
    if (!form.hora || !form.transportadora) return;
    setAgendamentos([...agendamentos, { id: `a-${Date.now()}`, hora: form.hora, doca: parseInt(form.doca), transportadora: form.transportadora, tipo: form.tipo, motorista: form.motorista, telefone: form.telefone }]);
    setForm({ hora: "", doca: "1", transportadora: "", tipo: "Carga", motorista: "", telefone: "" });
    setDialogOpen(false);
    toast.success("Agendamento criado com sucesso!");
  };

  const handleWhatsApp = (a: Agendamento) => {
    const phone = a.telefone || "";
    const text = encodeURIComponent(`🚛 Syntex OS — Confirmação de Agendamento\n\n📅 Horário: ${a.hora}\n📍 Doca: ${a.doca}\n🏢 Transportadora: ${a.transportadora}\n📦 Tipo: ${a.tipo}\n\nPor favor, compareça com antecedência.`);
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  const handleDelete = (id: string) => {
    setAgendamentos(agendamentos.filter((a) => a.id !== id));
    toast.info("Agendamento removido.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestão de Pátio & Logística</h1>
        <p className="text-sm text-muted-foreground mt-1">Agendamento de docas e controle de filas</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Na Fila", value: String(filas.filter(f => f.status === "na_fila").length), icon: Truck },
          { label: "Carregando", value: String(filas.filter(f => f.status === "carregando").length), icon: ArrowRight },
          { label: "Descarregando", value: String(filas.filter(f => f.status === "descarregando").length), icon: ArrowDown },
          { label: "Agendamentos", value: String(agendamentos.length), icon: Calendar },
        ].map((s) => (
          <div key={s.label} className="glass-panel rounded-xl p-4 animate-fade-in">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <s.icon className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-xl font-bold font-mono text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard title="Agendamentos de Hoje" subtitle="Calendário de docas" action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Novo
              </button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-border">
              <DialogHeader><DialogTitle className="text-foreground">Novo Agendamento</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Horário</label>
                    <input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Doca</label>
                    <select value={form.doca} onChange={(e) => setForm({ ...form, doca: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                      {Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={i + 1}>Doca {i + 1}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transportadora</label>
                  <input value={form.transportadora} onChange={(e) => setForm({ ...form, transportadora: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</label>
                    <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                      <option>Carga</option>
                      <option>Descarga</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Motorista</label>
                    <input value={form.motorista} onChange={(e) => setForm({ ...form, motorista: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Telefone (WhatsApp)</label>
                  <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="5511999990000" className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <button onClick={handleCreate} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Criar Agendamento</button>
              </div>
            </DialogContent>
          </Dialog>
        }>
          <div className="mt-4 space-y-2">
            {agendamentos.map((a) => (
              <div key={a.id} className="flex items-center gap-4 py-2.5 border-b border-border/20 last:border-0 hover:bg-secondary/20 rounded px-2 transition-colors">
                <span className="text-sm font-mono text-primary w-12">{a.hora}</span>
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">D{a.doca}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.transportadora}</p>
                  <p className="text-xs text-muted-foreground">{a.tipo}{a.motorista ? ` • ${a.motorista}` : ""}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleWhatsApp(a)} className="p-1.5 rounded hover:bg-primary/20 text-primary transition-colors" title="Compartilhar via WhatsApp">
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Fila de Caminhões" subtitle="Fluxo de entrada e saída em tempo real">
          <div className="mt-4 space-y-2">
            {filas.map((f) => (
              <div key={f.placa} className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0 hover:bg-secondary/20 rounded px-2 transition-colors">
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">{f.placa}</p>
                  <p className="text-xs text-muted-foreground">{f.transportadora}</p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-muted-foreground">{f.produto}</p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    {f.doca && <span className="text-xs font-mono text-primary">Doca {f.doca}</span>}
                    <Badge variant={statusMap[f.status].variant} className="text-[10px]">{statusMap[f.status].label}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs font-mono">{f.tempo}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default PatioLogistica;
