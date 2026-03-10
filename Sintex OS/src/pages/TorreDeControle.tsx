import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { KpiCard } from "@/components/KpiCard";
import { 
  Clock, Truck, Package, TrendingDown, TrendingUp, 
  AlertTriangle, CheckCircle2, Filter, Search, Calendar, Settings2, Save
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { cn } from "@/lib/utils";

// ... (Dados volumeData, slaData, docaUsage, weeklyTrend e chartTooltipStyle permanecem iguais)

const volumeData = [
  { hour: "06h", entrada: 12, saida: 8 },
  { hour: "08h", entrada: 28, saida: 15 },
  { hour: "10h", entrada: 35, saida: 22 },
  { hour: "12h", entrada: 20, saida: 30 },
  { hour: "14h", entrada: 32, saida: 28 },
  { hour: "16h", entrada: 25, saida: 35 },
  { hour: "18h", entrada: 15, saida: 20 },
  { hour: "20h", entrada: 8, saida: 12 },
];

const slaData = [
  { name: "TransLog BR", pontualidade: 96, viagens: 342, status: "excellent" },
  { name: "QuimTrans", pontualidade: 91, viagens: 218, status: "good" },
  { name: "ChemFreight", pontualidade: 87, viagens: 156, status: "good" },
  { name: "LogQuímica", pontualidade: 78, viagens: 289, status: "warning" },
  { name: "ExpressChem", pontualidade: 65, viagens: 134, status: "critical" },
];

const docaUsage = [
  { name: "Em uso", value: 14, color: "hsl(145, 63%, 49%)" },
  { name: "Ociosa", value: 4, color: "hsl(38, 92%, 50%)" },
  { name: "Manutenção", value: 2, color: "hsl(0, 72%, 51%)" },
];

const weeklyTrend = [
  { day: "Seg", tempo: 42 }, { day: "Ter", tempo: 38 }, { day: "Qua", tempo: 55 },
  { day: "Qui", tempo: 35 }, { day: "Sex", tempo: 30 }, { day: "Sáb", tempo: 22 }, { day: "Dom", tempo: 15 },
];

const chartTooltipStyle = {
  contentStyle: { background: "hsl(217, 60%, 14%)", border: "1px solid hsl(217, 30%, 22%)", borderRadius: "8px", fontSize: "12px", color: "hsl(210, 40%, 96%)" },
};

type DateFilter = "today" | "week" | "month" | "custom";

const TorreDeControle = () => {
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customDates, setCustomDates] = useState({ start: "", end: "" });
  
  // Controle de Meta (Admin/Responsável)
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [metaEspera, setMetaEspera] = useState(45);
  const [tempMeta, setTempMeta] = useState(metaEspera);

  // Mock de permissão
  const canEditMeta = true; 

  const handleSaveMeta = () => {
    setMetaEspera(tempMeta);
    setIsEditingMeta(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Torre de Controle</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão executiva em tempo real — Atualizado há 2 min</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-background/50">
            {(["today", "week", "month", "custom"] as DateFilter[]).map((f) => (
              <button 
                key={f} 
                onClick={() => setDateFilter(f)} 
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  dateFilter === f ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f === "today" ? "Hoje" : f === "week" ? "Semana" : f === "month" ? "Mês" : "Personalizado"}
              </button>
            ))}
          </div>

          {dateFilter === "custom" && (
            <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
              <input 
                type="date" 
                className="bg-secondary/50 border border-border rounded px-2 py-1 text-xs outline-none" 
                onChange={(e) => setCustomDates({...customDates, start: e.target.value})}
              />
              <span className="text-xs text-muted-foreground">até</span>
              <input 
                type="date" 
                className="bg-secondary/50 border border-border rounded px-2 py-1 text-xs outline-none"
                onChange={(e) => setCustomDates({...customDates, end: e.target.value})}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative group">
          <KpiCard 
            title="Tempo Médio de Espera" 
            value="38 min" 
            change="↓ 12%" 
            changeType="positive" 
            icon={Clock} 
            subtitle={`Meta: < ${metaEspera} min`} 
          />
          {canEditMeta && (
            <button 
              onClick={() => setIsEditingMeta(!isEditingMeta)}
              className="absolute top-2 right-2 p-1.5 rounded-md bg-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          )}
          {isEditingMeta && (
            <div className="absolute z-50 top-full mt-2 p-3 bg-card border border-primary/50 rounded-lg shadow-xl w-48 animate-in zoom-in-95 duration-200">
              <p className="text-[10px] font-bold mb-2 uppercase text-primary">Ajustar Meta (min)</p>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={tempMeta}
                  onChange={(e) => setTempMeta(Number(e.target.value))}
                  className="w-full bg-secondary border border-border rounded px-2 py-1 text-sm outline-none"
                />
                <button onClick={handleSaveMeta} className="bg-success text-white p-1 rounded hover:bg-success/80 transition-colors">
                  <Save className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        <KpiCard title="Caminhões no Pátio" value="47" change="↑ 8%" changeType="negative" icon={Truck} subtitle="Capacidade: 60" />
        <KpiCard title="Volume Carga/Descarga" value="1.284 t" change="↑ 15%" changeType="positive" icon={Package} />
        <KpiCard title="Ociosidade de Docas" value="20%" change="↓ 5pp" changeType="positive" icon={TrendingDown} subtitle="4 de 20 docas" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard 
          title="Fluxo de Entrada/Saída" 
          subtitle={dateFilter === "custom" && customDates.start ? `Período: ${customDates.start} a ${customDates.end}` : `Período: Último filtro selecionado`} 
          className="lg:col-span-2"
        >
          <div className="h-[260px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 30%, 22%)" />
                <XAxis dataKey="hour" stroke="hsl(215, 20%, 55%)" fontSize={11} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={11} />
                <Tooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="entrada" stroke="hsl(145, 63%, 49%)" fill="hsl(145, 63%, 49%)" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="saida" stroke="hsl(199, 89%, 48%)" fill="hsl(199, 89%, 48%)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard title="Ocupação de Docas" subtitle="20 docas totais">
          <div className="h-[260px] flex flex-col items-center justify-center mt-4">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={docaUsage} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {docaUsage.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-xs text-muted-foreground">
              {docaUsage.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard title="Ranking SLA Transportadoras" subtitle="Filtrado por período customizado">
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">#</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">Transportadora</th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">SLA %</th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">Viagens</th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {slaData.map((row, i) => (
                  <tr key={row.name} className="border-b border-border/20 hover:bg-secondary/30 transition-colors cursor-pointer">
                    <td className="py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                    <td className="py-3 font-medium text-foreground">{row.name}</td>
                    <td className="py-3 text-right font-mono">{row.pontualidade}%</td>
                    <td className="py-3 text-right text-muted-foreground font-mono">{row.viagens}</td>
                    <td className="py-3 text-right">
                      {row.status === "excellent" && <CheckCircle2 className="h-4 w-4 text-success inline" />}
                      {row.status === "good" && <TrendingUp className="h-4 w-4 text-info inline" />}
                      {row.status === "warning" && <AlertTriangle className="h-4 w-4 text-warning inline" />}
                      {row.status === "critical" && <TrendingDown className="h-4 w-4 text-destructive inline" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard title="Tempo Médio Semanal" subtitle="Baseado no filtro de período">
          <div className="h-[240px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 30%, 22%)" />
                <XAxis dataKey="day" stroke="hsl(215, 20%, 55%)" fontSize={11} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={11} unit=" min" />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey="tempo" fill="hsl(145, 63%, 49%)" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default TorreDeControle;