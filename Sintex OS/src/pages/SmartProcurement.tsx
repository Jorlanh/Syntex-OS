import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { ShoppingCart, Bell, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const commodityData = [
  { day: "25/02", NaOH: 420, HCl: 310, H2SO4: 180 },
  { day: "26/02", NaOH: 415, HCl: 315, H2SO4: 175 },
  { day: "27/02", NaOH: 410, HCl: 308, H2SO4: 170 },
  { day: "28/02", NaOH: 405, HCl: 305, H2SO4: 168 },
  { day: "01/03", NaOH: 398, HCl: 300, H2SO4: 165 },
  { day: "02/03", NaOH: 392, HCl: 295, H2SO4: 160 },
];

const initialAlerts = [
  { id: "al1", product: "NaOH 50%", message: "Queda de 6.7% — janela de compra ideal", saving: "R$ 42.000", urgency: "high", approved: false },
  { id: "al2", product: "HCl 33%", message: "Preço estável, aguardar", saving: "-", urgency: "low", approved: false },
  { id: "al3", product: "H2SO4", message: "Tendência de baixa, considerar antecipação", saving: "R$ 18.500", urgency: "medium", approved: false },
];

interface StockItem {
  id: string;
  produto: string;
  atual: string;
  minimo: string;
  unidade: string;
}

const initialEstoque: StockItem[] = [
  { id: "s1", produto: "NaOH 50%", atual: "12.4", minimo: "8", unidade: "t" },
  { id: "s2", produto: "HCl 33%", atual: "3.2", minimo: "5", unidade: "t" },
  { id: "s3", produto: "H2SO4", atual: "7.8", minimo: "6", unidade: "t" },
  { id: "s4", produto: "H2O2 35%", atual: "1.1", minimo: "2", unidade: "t" },
];

const chartTooltipStyle = {
  contentStyle: { background: "hsl(217, 60%, 14%)", border: "1px solid hsl(217, 30%, 22%)", borderRadius: "8px", fontSize: "12px", color: "hsl(210, 40%, 96%)" },
};

const SmartProcurement = () => {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [estoque, setEstoque] = useState<StockItem[]>(initialEstoque);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ produto: "", atual: "", minimo: "", unidade: "t" });

  const handleApprove = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, approved: true } : a));
    toast.success("Sugestão de compra aprovada!");
  };

  const handleSaveStock = () => {
    if (!form.produto || !form.atual) return;
    if (editingId) {
      setEstoque(estoque.map(e => e.id === editingId ? { ...e, ...form } : e));
    } else {
      setEstoque([...estoque, { id: `s-${Date.now()}`, ...form }]);
    }
    resetForm();
    toast.success(editingId ? "Estoque atualizado!" : "Item adicionado ao estoque!");
  };

  const handleEditStock = (item: StockItem) => {
    setForm({ produto: item.produto, atual: item.atual, minimo: item.minimo, unidade: item.unidade });
    setEditingId(item.id);
    setDialogOpen(true);
  };

  const handleDeleteStock = (id: string) => {
    setEstoque(estoque.filter(e => e.id !== id));
    toast.info("Item removido do estoque.");
  };

  const resetForm = () => {
    setForm({ produto: "", atual: "", minimo: "", unidade: "t" });
    setEditingId(null);
    setDialogOpen(false);
  };

  const getCobertura = (item: StockItem) => {
    const atual = parseFloat(item.atual);
    const days = Math.round(atual * 1.5 * 7); // mock calc
    return `${days} dias`;
  };

  const getStatus = (item: StockItem) => {
    const atual = parseFloat(item.atual);
    const min = parseFloat(item.minimo);
    if (atual <= min * 0.5) return "critical";
    if (atual <= min) return "low";
    return "ok";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Smart Procurement</h1>
        <p className="text-sm text-muted-foreground mt-1">Compras inteligentes baseadas em dados de mercado</p>
      </div>

      <GlassCard title="Alertas de Compra" subtitle="Baseado em cotações globais e câmbio">
        <div className="mt-4 space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${a.approved ? "border-success/30 bg-success/5" : "border-primary/20 bg-primary/5"}`}>
              <Bell className={`h-5 w-5 shrink-0 ${a.approved ? "text-success" : "text-primary"}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{a.product}</p>
                <p className="text-xs text-muted-foreground">{a.message}</p>
              </div>
              {a.saving !== "-" && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-primary font-mono">{a.saving}</p>
                  <p className="text-[10px] text-muted-foreground">economia potencial</p>
                </div>
              )}
              {!a.approved ? (
                <button onClick={() => handleApprove(a.id)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1 shrink-0">
                  <Check className="h-3.5 w-3.5" /> Aprovar
                </button>
              ) : (
                <span className="text-xs text-success font-medium shrink-0">✓ Aprovado</span>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard title="Cotações de Commodities" subtitle="Últimos 7 dias (R$/t)">
          <div className="h-[260px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commodityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 30%, 22%)" />
                <XAxis dataKey="day" stroke="hsl(215, 20%, 55%)" fontSize={11} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={11} />
                <Tooltip {...chartTooltipStyle} />
                <Line type="monotone" dataKey="NaOH" stroke="hsl(145, 63%, 49%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="HCl" stroke="hsl(199, 89%, 48%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="H2SO4" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard title="Gestão de Estoque" subtitle="CRUD — Insira e gerencie matérias-primas" action={
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Novo
              </button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-border">
              <DialogHeader><DialogTitle className="text-foreground">{editingId ? "Editar Item" : "Novo Item de Estoque"}</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Produto</label>
                  <input value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Qtd. Atual</label>
                    <input type="number" step="0.1" value={form.atual} onChange={(e) => setForm({ ...form, atual: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mínimo</label>
                    <input type="number" step="0.1" value={form.minimo} onChange={(e) => setForm({ ...form, minimo: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unidade</label>
                    <select value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="t">Toneladas</option>
                      <option value="kg">Kilogramas</option>
                      <option value="L">Litros</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleSaveStock} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">{editingId ? "Salvar" : "Adicionar"}</button>
              </div>
            </DialogContent>
          </Dialog>
        }>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">Produto</th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">Atual</th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">Mínimo</th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">Cobertura</th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-3 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {estoque.map((e) => {
                  const status = getStatus(e);
                  return (
                    <tr key={e.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 font-medium text-foreground">{e.produto}</td>
                      <td className="py-3 text-right font-mono">{e.atual} {e.unidade}</td>
                      <td className="py-3 text-right font-mono text-muted-foreground">{e.minimo} {e.unidade}</td>
                      <td className={`py-3 text-right font-mono ${status === "critical" ? "text-destructive" : status === "low" ? "text-warning" : "text-success"}`}>{getCobertura(e)}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEditStock(e)} className="p-1.5 rounded hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteStock(e.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default SmartProcurement;
