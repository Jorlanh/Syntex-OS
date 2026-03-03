import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Box, AlertTriangle, Gauge, Thermometer, Droplets, Zap, Plus, Upload, Trash2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Equipment {
  id: string;
  name: string;
  status: "ok" | "warning" | "critical";
  temp: string;
  pressure: string;
  flow: string;
  capacity?: string;
}

const initialEquipments: Equipment[] = [
  { id: "e1", name: "Reator R-101", status: "ok", temp: "185°C", pressure: "4.2 bar", flow: "120 L/h", capacity: "500 L" },
  { id: "e2", name: "Destilador D-201", status: "warning", temp: "92°C", pressure: "1.1 bar", flow: "85 L/h", capacity: "300 L" },
  { id: "e3", name: "Tanque T-301", status: "ok", temp: "25°C", pressure: "1.0 bar", flow: "0 L/h", capacity: "10000 L" },
  { id: "e4", name: "Reator R-102", status: "ok", temp: "210°C", pressure: "5.8 bar", flow: "95 L/h", capacity: "500 L" },
  { id: "e5", name: "Misturador M-401", status: "critical", temp: "45°C", pressure: "2.3 bar", flow: "200 L/h", capacity: "800 L" },
  { id: "e6", name: "Torre de Resfriamento", status: "ok", temp: "32°C", pressure: "0.8 bar", flow: "500 L/h", capacity: "2000 L" },
];

const DigitalTwin = () => {
  const [equipments, setEquipments] = useState<Equipment[]>(initialEquipments);
  const [setupOpen, setSetupOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const [eqForm, setEqForm] = useState({ name: "", capacity: "", temp: "", pressure: "", flow: "" });
  const [simForm, setSimForm] = useState({ productionIncrease: "20", equipment: "Reator R-101" });
  const [simResult, setSimResult] = useState<string | null>(null);

  const handleAddEquipment = () => {
    if (!eqForm.name) return;
    setEquipments([...equipments, {
      id: `e-${Date.now()}`, name: eqForm.name, status: "ok",
      temp: eqForm.temp || "25°C", pressure: eqForm.pressure || "1.0 bar", flow: eqForm.flow || "0 L/h", capacity: eqForm.capacity
    }]);
    setEqForm({ name: "", capacity: "", temp: "", pressure: "", flow: "" });
    setSetupOpen(false);
    toast.success("Equipamento adicionado à planta digital.");
  };

  const handleSimulate = () => {
    const pct = parseInt(simForm.productionIncrease) || 0;
    if (pct > 30) {
      setSimResult(`⚠️ Aumento de ${pct}% causaria gargalo no ${simForm.equipment}. Capacidade excedida em ${pct - 30}%. Recomenda-se escalonar produção em turnos.`);
    } else if (pct > 15) {
      setSimResult(`🟡 Aumento de ${pct}% viável com monitoramento intensificado. Temperatura do ${simForm.equipment} pode subir 12°C. Resfriamento adicional sugerido.`);
    } else {
      setSimResult(`✅ Aumento de ${pct}% dentro da capacidade nominal. Sem gargalos previstos. Produção estimada: +${(pct * 1.2).toFixed(0)} t/dia.`);
    }
  };

  const handleDeleteEquipment = (id: string) => {
    setEquipments(equipments.filter(e => e.id !== id));
    toast.info("Equipamento removido.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gêmeo Digital</h1>
          <p className="text-sm text-muted-foreground mt-1">Representação da planta química e simulação de cenários</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
            <DialogTrigger asChild>
              <button className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" /> Setup da Planta
              </button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-border">
              <DialogHeader><DialogTitle className="text-foreground">Adicionar Equipamento</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome do Equipamento</label>
                  <input value={eqForm.name} onChange={(e) => setEqForm({ ...eqForm, name: e.target.value })} placeholder="Ex: Reator R-103" className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Capacidade</label>
                    <input value={eqForm.capacity} onChange={(e) => setEqForm({ ...eqForm, capacity: e.target.value })} placeholder="500 L" className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Temperatura</label>
                    <input value={eqForm.temp} onChange={(e) => setEqForm({ ...eqForm, temp: e.target.value })} placeholder="25°C" className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pressão</label>
                    <input value={eqForm.pressure} onChange={(e) => setEqForm({ ...eqForm, pressure: e.target.value })} placeholder="1.0 bar" className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vazão</label>
                    <input value={eqForm.flow} onChange={(e) => setEqForm({ ...eqForm, flow: e.target.value })} placeholder="0 L/h" className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <button onClick={handleAddEquipment} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Adicionar Equipamento</button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard title="Planta Química — Visão Geral" subtitle={`${equipments.length} equipamentos mapeados`} className="lg:col-span-2">
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {equipments.map((eq) => (
              <div key={eq.id} className={cn("rounded-lg border p-4 transition-all hover:scale-[1.02] relative group",
                eq.status === "ok" && "border-primary/30 bg-primary/5",
                eq.status === "warning" && "border-warning/40 bg-warning/5 animate-pulse-slow",
                eq.status === "critical" && "border-destructive/40 bg-destructive/5 animate-pulse"
              )}>
                <button onClick={() => handleDeleteEquipment(eq.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="h-3 w-3" />
                </button>
                <div className="flex items-center gap-2 mb-3">
                  <Box className={cn("h-4 w-4", eq.status === "ok" && "text-primary", eq.status === "warning" && "text-warning", eq.status === "critical" && "text-destructive")} />
                  <span className="text-xs font-semibold text-foreground">{eq.name}</span>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Thermometer className="h-3 w-3" />{eq.temp}</div>
                  <div className="flex items-center gap-1.5"><Gauge className="h-3 w-3" />{eq.pressure}</div>
                  <div className="flex items-center gap-1.5"><Droplets className="h-3 w-3" />{eq.flow}</div>
                  {eq.capacity && <div className="text-[10px] text-primary/60 mt-1">Cap: {eq.capacity}</div>}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Simulação de Cenários" subtitle="What-if analysis interativa">
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Equipamento Alvo</label>
              <select value={simForm.equipment} onChange={(e) => setSimForm({ ...simForm, equipment: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {equipments.map(eq => <option key={eq.id} value={eq.name}>{eq.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aumentar Produção em (%)</label>
              <input type="number" value={simForm.productionIncrease} onChange={(e) => setSimForm({ ...simForm, productionIncrease: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <button onClick={handleSimulate} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <Play className="h-4 w-4" /> Simular
            </button>
            {simResult && (
              <div className="rounded-lg border border-border/40 bg-secondary/20 p-4 text-sm text-foreground animate-fade-in">
                {simResult}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default DigitalTwin;
