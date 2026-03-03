import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { ScanLine, Upload, FileText, CheckCircle2, XCircle, Eye, Save, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  type: string;
  status: "validated" | "review" | "error";
  confidence: string;
  date: string;
  extractedFields?: Record<string, string>;
}

const initialDocuments: Document[] = [
  { id: "d1", name: "NF-2026-001847.pdf", type: "Nota Fiscal", status: "validated", confidence: "98.2%", date: "02/03/2026", extractedFields: { "CNPJ Emitente": "12.345.678/0001-99", "Valor Total": "R$ 45.280,00", "NCM": "2815.11.00", "CFOP": "5.101" } },
  { id: "d2", name: "FISPQ-NaOH-v4.pdf", type: "FISPQ", status: "review", confidence: "87.5%", date: "01/03/2026", extractedFields: { "Produto": "Hidróxido de Sódio", "CAS": "1310-73-2", "Concentração": "50%", "pH": "14", "Ponto de Fusão": "318°C" } },
  { id: "d3", name: "Laudo-Lote-4521.pdf", type: "Laudo Técnico", status: "validated", confidence: "95.8%", date: "01/03/2026", extractedFields: { "Lote": "PR-4521", "Resultado": "Aprovado", "Pureza": "99.2%", "Data Análise": "01/03/2026" } },
  { id: "d4", name: "NF-2026-001846.pdf", type: "Nota Fiscal", status: "error", confidence: "62.1%", date: "28/02/2026", extractedFields: { "CNPJ Emitente": "???.???.???/????-??", "Valor Total": "R$ ???", "NCM": "----", "CFOP": "----" } },
];

const Backoffice = () => {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});

  const handleSelectDoc = (doc: Document) => {
    setSelectedDoc(doc);
    setEditedFields(doc.extractedFields || {});
  };

  const handleFieldChange = (key: string, value: string) => {
    setEditedFields({ ...editedFields, [key]: value });
  };

  const handleSave = () => {
    if (!selectedDoc) return;
    setDocuments(documents.map(d => d.id === selectedDoc.id ? { ...d, extractedFields: editedFields, status: "validated" } : d));
    toast.success(`Documento "${selectedDoc.name}" validado e salvo!`);
    setSelectedDoc({ ...selectedDoc, extractedFields: editedFields, status: "validated" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Automação de Backoffice</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão Computacional e OCR para documentos</p>
      </div>

      <div className="glass-panel rounded-xl border-2 border-dashed border-primary/30 p-12 text-center hover:border-primary/50 transition-colors cursor-pointer animate-fade-in">
        <Upload className="h-10 w-10 text-primary mx-auto mb-4" />
        <p className="text-sm font-medium text-foreground">Arraste laudos, FISPQs ou Notas Fiscais aqui</p>
        <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar arquivos</p>
        <p className="text-xs text-muted-foreground mt-3 font-mono">PDF, JPG, PNG — máx 25MB</p>
      </div>

      <GlassCard title="Documentos Processados" subtitle="Clique para validar e editar campos extraídos">
        <div className="mt-4 space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} onClick={() => handleSelectDoc(doc)} className={`flex items-center gap-4 py-3 border-b border-border/20 last:border-0 hover:bg-secondary/20 rounded px-2 transition-colors cursor-pointer ${selectedDoc?.id === doc.id ? "bg-primary/5 border-primary/20" : ""}`}>
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.type} • {doc.date}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-mono text-muted-foreground">Confiança: {doc.confidence}</span>
              </div>
              <div className="shrink-0">
                {doc.status === "validated" && <CheckCircle2 className="h-4 w-4 text-success" />}
                {doc.status === "review" && <Eye className="h-4 w-4 text-warning" />}
                {doc.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard title="Visualizador Lado a Lado" subtitle={selectedDoc ? `Editando: ${selectedDoc.name}` : "Selecione um documento acima"}>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[280px]">
          <div className="rounded-lg border border-border/40 bg-secondary/20 flex items-center justify-center p-4">
            {selectedDoc ? (
              <div className="text-center w-full">
                <FileText className="h-12 w-12 text-primary/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">{selectedDoc.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedDoc.type}</p>
                <div className="mt-4 rounded-lg border border-border/30 bg-secondary/30 p-4 text-left">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Preview do documento</p>
                  <div className="h-32 bg-secondary/40 rounded flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Visualização PDF/Imagem</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">PDF / Imagem Original</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border/40 bg-secondary/20 p-4">
            {selectedDoc && editedFields ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dados Extraídos (IA) — Editável</p>
                  <button onClick={handleSave} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1">
                    <Save className="h-3.5 w-3.5" /> Salvar / Enviar ao ERP
                  </button>
                </div>
                <div className="space-y-3">
                  {Object.entries(editedFields).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{key}</label>
                      <input
                        value={value}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        className="mt-0.5 w-full rounded-md border border-border bg-secondary/30 px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <ScanLine className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Dados Extraídos (IA)</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Backoffice;
