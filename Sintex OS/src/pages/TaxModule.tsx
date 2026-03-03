import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { FileSearch, CheckCircle2, AlertTriangle, XCircle, DollarSign, Download, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const audits = [
  { entity: "ANVISA", status: "compliant", description: "Licença sanitária ativa", expiry: "12/2026" },
  { entity: "IBAMA", status: "warning", description: "Renovação em 45 dias", expiry: "04/2026" },
  { entity: "Receita Federal", status: "attention", description: "3 NCMs com classificação divergente", expiry: "-" },
  { entity: "Corpo de Bombeiros", status: "compliant", description: "AVCB vigente", expiry: "08/2027" },
];

interface TaxCredit {
  id: string;
  tipo: string;
  valor: string;
  status: string;
  detalhes: string;
  ncm?: string;
  periodoRef?: string;
}

const initialCredits: TaxCredit[] = [
  { id: "c1", tipo: "IPI — NCM reclassificação", valor: "R$ 284.500", status: "identificado", detalhes: "NCM 2815.11.00 classificada incorretamente como 2815.12.00. Diferença de alíquota de 5% para 0%. Período: Jan-Dez 2025.", ncm: "2815.11.00 → 2815.12.00", periodoRef: "Jan-Dez 2025" },
  { id: "c2", tipo: "ICMS-ST — créditos extemporâneos", valor: "R$ 127.800", status: "em_processo", detalhes: "Substituição tributária recolhida a maior em operações interestaduais SP→MG. Base de cálculo divergente conforme Convênio ICMS 142/2018.", ncm: "Múltiplos NCMs", periodoRef: "Mar-Set 2025" },
  { id: "c3", tipo: "PIS/COFINS — insumos", valor: "R$ 92.300", status: "recuperado", detalhes: "Créditos sobre insumos de produção (NaOH, HCl) não aproveitados conforme Lei 10.637/2002 e 10.833/2003.", ncm: "2815.11.00, 2806.10.00", periodoRef: "Jan-Jun 2025" },
];

const TaxModule = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleExport = (credit: TaxCredit) => {
    toast.success(`Relatório fiscal "${credit.tipo}" exportado com sucesso!`);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mineração Tributária & Regulatória</h1>
        <p className="text-sm text-muted-foreground mt-1">Auditoria contínua e recuperação de créditos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-5 animate-fade-in glow-primary-subtle">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Recuperável</p>
          <p className="text-2xl font-bold text-primary font-mono mt-1">R$ 504.600</p>
        </div>
        <div className="glass-panel rounded-xl p-5 animate-fade-in">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Em Processo</p>
          <p className="text-2xl font-bold text-warning font-mono mt-1">R$ 127.800</p>
        </div>
        <div className="glass-panel rounded-xl p-5 animate-fade-in">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Já Recuperado</p>
          <p className="text-2xl font-bold text-foreground font-mono mt-1">R$ 92.300</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard title="Conformidade Regulatória" subtitle="Status de órgãos fiscalizadores">
          <div className="mt-4 space-y-3">
            {audits.map((a) => (
              <div key={a.entity} className="flex items-center gap-3 py-3 border-b border-border/20 last:border-0">
                {a.status === "compliant" && <CheckCircle2 className="h-5 w-5 text-success shrink-0" />}
                {a.status === "warning" && <AlertTriangle className="h-5 w-5 text-warning shrink-0" />}
                {a.status === "attention" && <XCircle className="h-5 w-5 text-destructive shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{a.entity}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
                {a.expiry !== "-" && <span className="text-xs font-mono text-muted-foreground">{a.expiry}</span>}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Créditos Tributários" subtitle="Clique para ver detalhes e exportar">
          <div className="mt-4 space-y-3">
            {initialCredits.map((c) => (
              <div key={c.id} className="rounded-lg border border-border/40 overflow-hidden">
                <button onClick={() => toggleExpand(c.id)} className="w-full p-4 text-left hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{c.tipo}</p>
                    {expandedId === c.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold font-mono text-primary">{c.valor}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-medium ${c.status === "recuperado" ? "text-success" : c.status === "em_processo" ? "text-warning" : "text-info"}`}>
                      {c.status.replace("_", " ")}
                    </span>
                  </div>
                </button>
                {expandedId === c.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-border/20 animate-fade-in">
                    <p className="text-xs text-muted-foreground mt-3">{c.detalhes}</p>
                    {c.ncm && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">NCM:</span>
                        <span className="text-xs font-mono text-foreground">{c.ncm}</span>
                      </div>
                    )}
                    {c.periodoRef && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Período:</span>
                        <span className="text-xs font-mono text-foreground">{c.periodoRef}</span>
                      </div>
                    )}
                    <button onClick={() => handleExport(c)} className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5" /> Exportar Relatório Fiscal
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default TaxModule;
