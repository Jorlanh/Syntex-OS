import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { KpiCard } from "@/components/KpiCard";
import { 
  Clock, Truck, Package, TrendingDown, TrendingUp, 
  AlertTriangle, CheckCircle2, Filter, Search, Calendar
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { cn } from "@/lib/utils";

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

type DateFilter = "today" | "week" | "month";

const TorreDeControle = () => {
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Torre de Controle</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão executiva em tempo real — Atualizado há 2 min</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {(["today", "week", "month"] as DateFilter[]).map((f) => (
            <button key={f} onClick={() => setDateFilter(f)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${dateFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {f === "today" ? "Hoje" : f === "week" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Tempo Médio de Espera" value="38 min" change="↓ 12%" changeType="positive" icon={Clock} subtitle="Meta: < 45 min" />
        <KpiCard title="Caminhões no Pátio" value="47" change="↑ 8%" changeType="negative" icon={Truck} subtitle="Capacidade: 60" />
        <KpiCard title="Volume Carga/Descarga" value="1.284 t" change="↑ 15%" changeType="positive" icon={Package} />
        <KpiCard title="Ociosidade de Docas" value="20%" change="↓ 5pp" changeType="positive" icon={TrendingDown} subtitle="4 de 20 docas" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard title="Fluxo de Entrada/Saída" subtitle={`Período: ${dateFilter === "today" ? "Últimas 24h" : dateFilter === "week" ? "Últimos 7 dias" : "Último mês"}`} className="lg:col-span-2">
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
        <GlassCard title="Ranking SLA Transportadoras" subtitle="Pontualidade p/ renegociação de frete">
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
                      {row.status === "excellent" && <CheckCircle2 className="inline h-4 w-4 text-success" />}
                      {row.status === "good" && <TrendingUp className="inline h-4 w-4 text-info" />}
                      {row.status === "warning" && <AlertTriangle className="inline h-4 w-4 text-warning" />}
                      {row.status === "critical" && <TrendingDown className="inline h-4 w-4 text-destructive" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard title="Tempo Médio Semanal" subtitle="Tendência dos últimos 7 dias">
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
