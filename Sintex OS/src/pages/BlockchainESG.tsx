import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Link2, QrCode, CheckCircle2, Package, Truck, FlaskConical, ShieldCheck, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface TimelineEvent {
  step: string;
  icon: React.ElementType;
  detail: string;
  date: string;
  hash: string;
}

const iconOptions: Record<string, React.ElementType> = {
  "Matéria-Prima": Package,
  "Recebimento": Truck,
  "Produção": FlaskConical,
  "Controle de Qualidade": ShieldCheck,
  "Expedição": Package,
};

const initialTimeline: TimelineEvent[] = [
  { step: "Matéria-Prima", icon: Package, detail: "NaOH — Lote MP-2026-0847", date: "25/02/2026 08:12", hash: "0x3a7f...c1d2" },
  { step: "Recebimento", icon: Truck, detail: "Inspeção e laudo aprovado", date: "25/02/2026 14:30", hash: "0x8b2e...f4a9" },
  { step: "Produção", icon: FlaskConical, detail: "Reator R-101 — Lote PR-4521", date: "26/02/2026 06:00", hash: "0xd1c5...7e83" },
  { step: "Controle de Qualidade", icon: ShieldCheck, detail: "Aprovado — Certificado CQ-4521", date: "26/02/2026 18:45", hash: "0xf9a2...b016" },
];

const BlockchainESG = () => {
  const [timeline, setTimeline] = useState<TimelineEvent[]>(initialTimeline);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lotFinalized, setLotFinalized] = useState(false);
  const [form, setForm] = useState({ step: "Matéria-Prima", detail: "" });

  const generateHash = () => {
    const chars = "0123456789abcdef";
    const start = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * 16)]).join("");
    const end = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * 16)]).join("");
    return `0x${start}...${end}`;
  };

  const handleAddEvent = () => {
    if (!form.detail) return;
    const now = new Date();
    const dateStr = `${now.toLocaleDateString("pt-BR")} ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    setTimeline([...timeline, {
      step: form.step,
      icon: iconOptions[form.step] || Package,
      detail: form.detail,
      date: dateStr,
      hash: generateHash(),
    }]);
    setForm({ step: "Matéria-Prima", detail: "" });
    setDialogOpen(false);
    toast.success("Evento registrado na blockchain!");
  };

  const handleFinalizeLot = () => {
    setLotFinalized(true);
    toast.success("Lote PR-4521 finalizado! QR Code gerado para embalagem.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rastreabilidade Blockchain</h1>
        <p className="text-sm text-muted-foreground mt-1">Selo ESG de Ouro — Ciclo de vida do lote imutável</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard title="Lote PR-4521 — Timeline" subtitle="Cadeia de custódia imutável" className="lg:col-span-2" action={
          !lotFinalized ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> Adicionar Evento
                </button>
              </DialogTrigger>
              <DialogContent className="glass-panel border-border">
                <DialogHeader><DialogTitle className="text-foreground">Registrar Evento no Lote</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo de Evento</label>
                    <select value={form.step} onChange={(e) => setForm({ ...form, step: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                      {Object.keys(iconOptions).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</label>
                    <input value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="Ex: Laudo aprovado — Certificado CQ-XXXX" className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <button onClick={handleAddEvent} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Registrar na Blockchain</button>
                </div>
              </DialogContent>
            </Dialog>
          ) : <span className="text-xs text-success font-medium">✓ Lote Finalizado</span>
        }>
          <div className="mt-6 relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-primary/30" />
            <div className="space-y-6">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-4 relative animate-fade-in">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center z-10 shrink-0">
                    <t.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{t.step}</p>
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.detail}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] font-mono text-muted-foreground">{t.date}</span>
                      <span className="text-[10px] font-mono text-primary/70">{t.hash}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard title="QR Code do Lote" subtitle="Para embalagem e auditoria externa">
          <div className="mt-4 flex flex-col items-center">
            <div className={cn("h-48 w-48 rounded-xl border flex items-center justify-center mb-4 transition-all", lotFinalized ? "border-success/40 bg-success/5 glow-primary" : "border-primary/30 bg-primary/5")}>
              <QrCode className={cn("h-24 w-24", lotFinalized ? "text-success/80" : "text-primary/60")} />
            </div>
            <p className="text-xs text-muted-foreground text-center">Lote PR-4521</p>
            <p className="text-[10px] text-muted-foreground text-center mt-0.5 font-mono">Detergente Industrial NaOH 50%</p>
            <p className="text-[10px] text-muted-foreground text-center mt-1">{timeline.length} eventos registrados</p>

            {!lotFinalized ? (
              <button onClick={handleFinalizeLot} className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Finalizar Lote & Gerar QR Code
              </button>
            ) : (
              <>
                <button className="mt-4 w-full rounded-lg border border-success/30 bg-success/10 py-2.5 text-sm font-medium text-success hover:bg-success/20 transition-colors">
                  Exportar QR Code
                </button>
                <button className="mt-2 w-full rounded-lg border border-border/40 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors">
                  Imprimir Etiqueta
                </button>
              </>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default BlockchainESG;
