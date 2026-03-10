import React, { useState, useMemo } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Truck, Calendar, Clock, ArrowRight, ArrowDown, Plus, Share2, Trash2, Settings, Edit2, Eye, PhoneCall, CheckCircle2, ChevronDown, ChevronUp, Search, History, Printer, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, addMinutes } from "date-fns";

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  doca: number | null;
  transportadora: string;
  tipo: string;
  produto?: string; // Novo campo opcional
  motorista: string;
  cpf: string;
  placa: string;
  telefone: string;
  status: "agendado" | "atrasado" | "aguardando" | "carregando" | "descarregando" | "concluido";
}

interface ConfiguracaoDocas {
  total: number;
  carga: number;
  descarga: number;
  intervalo: number; // Intervalo em minutos
}

// NOVO: Interface de Log
interface AuditLog {
  id: string;
  action: "CRIADO" | "REMOVIDO" | "ATUALIZADO" | "CONCLUIDO";
  timestamp: string;
  user: string;
  details: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; colorClass?: string }> = {
  agendado: { label: "Agendado", variant: "outline" },
  aguardando: { label: "Aguardando", variant: "secondary" },
  carregando: { label: "Carregando", variant: "default" },
  descarregando: { label: "Descarregando", variant: "default" },
  atrasado: { label: "Atrasado", variant: "destructive" },
  concluido: { label: "Concluído", variant: "default", colorClass: "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent" },
};

// --- Funções de Máscara e Validação ---
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const maskPhone = (value: string) => {
  let v = value.replace(/\D/g, "");
  if (v.length <= 10) {
    v = v.replace(/(\d{2})(\d)/, "($1) $2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    v = v.replace(/(\d{2})(\d)/, "($1) $2");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
  }
  return v.slice(0, 15);
};

const maskPlaca = (value: string) => {
  let v = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (v.length > 3) {
    v = v.replace(/^([A-Z]{3})([A-Z0-9]*)/, "$1-$2");
  }
  return v.slice(0, 8);
};

const timeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':');
  return parseInt(h) * 60 + parseInt(m);
};
// --------------------------

const PatioLogistica = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const [configDocas, setConfigDocas] = useState<ConfiguracaoDocas>({ total: 20, carga: 10, descarga: 10, intervalo: 60 });
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([
    { id: "a1", data: today, hora: "07:00", doca: 1, transportadora: "TransLog BR", tipo: "Carga", produto: "Ácido Sulfúrico", motorista: "José Silva", cpf: "111.222.333-44", placa: "ABC-1D23", telefone: "(11) 99999-0001", status: "carregando" },
    { id: "a2", data: today, hora: "07:30", doca: 3, transportadora: "QuimTrans", tipo: "Descarga", produto: "NaOH 50%", motorista: "Pedro Santos", cpf: "555.666.777-88", placa: "XYZ-4E56", telefone: "(11) 99999-0002", status: "aguardando" },
    { id: "a3", data: today, hora: "08:00", doca: null, transportadora: "ChemFreight", tipo: "Carga", motorista: "João Souza", cpf: "999.888.777-66", placa: "DEF-7G89", telefone: "(11) 99999-0003", status: "agendado" },
    { id: "a4", data: today, hora: "08:30", doca: 2, transportadora: "LogQuímica", tipo: "Descarga", produto: "Soda Cáustica", motorista: "Carlos Lima", cpf: "444.333.222-11", placa: "GHI-0J12", telefone: "(11) 99999-0004", status: "descarregando" },
    { id: "a5", data: today, hora: "09:00", doca: null, transportadora: "ExpressChem", tipo: "Carga", produto: "Peróxido H2O2", motorista: "André Costa", cpf: "123.456.789-00", placa: "JKL-3M45", telefone: "(11) 99999-0005", status: "atrasado" },
    { id: "a6", data: today, hora: "06:00", doca: null, transportadora: "LogMaster", tipo: "Carga", produto: "Etanol", motorista: "Paulo Silva", cpf: "123.123.123-11", placa: "MMM-9999", telefone: "(11) 98888-7777", status: "concluido" },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ data: today, hora: "", doca: "1", transportadora: "", tipo: "Carga", produto: "", motorista: "", cpf: "", placa: "", telefone: "" });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Agendamento | null>(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);

  const [remarcarModalOpen, setRemarcarModalOpen] = useState(false);
  const [remarcarForm, setRemarcarForm] = useState<Agendamento | null>(null);

  // Usuário Simulado para os Logs
  const currentUser = "Admin Syntex";

  // Estado dos Logs
  const [logs, setLogs] = useState<AuditLog[]>([
    { id: "l1", action: "CRIADO", timestamp: format(new Date(), "dd/MM/yyyy HH:mm:ss"), user: "Sistema", details: "Carga inicial de dados do pátio." }
  ]);
  const [logsModalOpen, setLogsModalOpen] = useState(false);

  // Estados para Modal de Confirmação de Exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [agendamentoToDelete, setAgendamentoToDelete] = useState<string | null>(null);

  // Estados para Pesquisa e UI
  const [searchAgendados, setSearchAgendados] = useState("");
  const [searchConcluidos, setSearchConcluidos] = useState("");
  const [concluidosExpanded, setConcluidosExpanded] = useState(true);

  const addLog = (action: AuditLog["action"], details: string) => {
    setLogs(prev => [{ id: `log-${Date.now()}`, action, timestamp: format(new Date(), "dd/MM/yyyy HH:mm:ss"), user: currentUser, details }, ...prev]);
  };

  // Motor de Validação de Disponibilidade
  const isSlotAvailable = (dataCheck: string, horaCheck: string, docaCheck: number | null, excludeId?: string) => {
    if (!docaCheck) return true; 
    const checkMins = timeToMinutes(horaCheck);
    
    for (const a of agendamentos) {
      if (a.id === excludeId) continue;
      if (a.data === dataCheck && a.doca === docaCheck && a.status !== "concluido") {
        const existingMins = timeToMinutes(a.hora);
        if (Math.abs(checkMins - existingMins) < configDocas.intervalo) {
          return false;
        }
      }
    }
    return true;
  };

  const handleCreate = () => {
    if (!form.data || !form.hora || !form.transportadora || !form.placa) {
      toast.error("Preencha os campos obrigatórios (Data, Hora, Transportadora, Placa).");
      return;
    }

    const placaRegex = /^[A-Z]{3}-[0-9][A-Z0-9][0-9]{2}$/;
    if (!placaRegex.test(form.placa)) {
      toast.error("Placa inválida. O formato deve ser ABC-1234 ou ABC-1D23.");
      return;
    }

    const docaSelecionada = form.doca ? parseInt(form.doca) : null;
    
    if (docaSelecionada && !isSlotAvailable(form.data, form.hora, docaSelecionada)) {
      toast.error(`A Doca ${docaSelecionada} está indisponível neste horário. O intervalo mínimo é de ${configDocas.intervalo} minutos.`);
      return;
    }
    
    const novoAgendamento: Agendamento = {
      id: `a-${Date.now()}`,
      data: form.data,
      hora: form.hora,
      doca: docaSelecionada,
      transportadora: form.transportadora,
      tipo: form.tipo,
      produto: form.produto,
      motorista: form.motorista,
      cpf: form.cpf,
      placa: form.placa,
      telefone: form.telefone,
      status: "agendado"
    };

    setAgendamentos([...agendamentos, novoAgendamento]);
    addLog("CRIADO", `Agendamento placa ${form.placa} criado para ${format(new Date(form.data), 'dd/MM')} às ${form.hora}`);
    setForm({ data: today, hora: "", doca: "1", transportadora: "", tipo: "Carga", produto: "", motorista: "", cpf: "", placa: "", telefone: "" });
    setDialogOpen(false);
    toast.success("Agendamento criado com sucesso!");
  };

  const handleUpdateStatus = (id: string, newStatus: Agendamento["status"]) => {
    if (newStatus === "atrasado") {
      const agendamento = agendamentos.find(a => a.id === id);
      if (agendamento) {
        setRemarcarForm({ ...agendamento }); 
        setRemarcarModalOpen(true);
      }
      return; 
    }

    setAgendamentos(agendamentos.map(a => {
      if (a.id === id) {
        let updatedA = { ...a, status: newStatus };
        if (newStatus === "concluido") {
           updatedA.doca = null;
           toast.success(`Caminhão ${a.placa} concluído e liberado do pátio.`);
           addLog("CONCLUIDO", `Operação do caminhão placa ${a.placa} foi concluída.`);
        }
        return updatedA;
      }
      return a;
    }));
  };

  const handleRemarcarSubmit = () => {
    if (!remarcarForm) return;

    if (!remarcarForm.data || !remarcarForm.hora || !remarcarForm.transportadora || !remarcarForm.placa) {
      toast.error("Preencha os campos obrigatórios (Data, Hora, Transportadora, Placa).");
      return;
    }

    if (remarcarForm.doca && !isSlotAvailable(remarcarForm.data, remarcarForm.hora, remarcarForm.doca, remarcarForm.id)) {
      toast.error(`A Doca ${remarcarForm.doca} está indisponível neste horário. O intervalo mínimo é de ${configDocas.intervalo} min.`);
      return;
    }

    setAgendamentos(agendamentos.map(a => {
      if (a.id === remarcarForm.id) {
        return { 
          ...remarcarForm, 
          status: "agendado", 
        };
      }
      return a;
    }));

    addLog("ATUALIZADO", `Agendamento placa ${remarcarForm.placa} foi remarcado/tratado por atraso.`);
    setRemarcarModalOpen(false);
    toast.success("Agendamento atualizado e remarcado com sucesso.");
  };

  const openEditModal = (agendamento: Agendamento) => {
    setEditForm({ ...agendamento });
    setEditModalOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editForm) return;

    if (!editForm.data || !editForm.hora || !editForm.transportadora || !editForm.placa) {
      toast.error("Preencha os campos obrigatórios (Data, Hora, Transportadora, Placa).");
      return;
    }

    if (editForm.doca && !isSlotAvailable(editForm.data, editForm.hora, editForm.doca, editForm.id)) {
      toast.error(`A Doca ${editForm.doca} está indisponível neste horário. O intervalo mínimo é de ${configDocas.intervalo} min.`);
      return;
    }

    setAgendamentos(agendamentos.map(a => a.id === editForm.id ? editForm : a));
    addLog("ATUALIZADO", `Agendamento placa ${editForm.placa} foi editado.`);
    setEditModalOpen(false);
    toast.success("Agendamento atualizado com sucesso.");
  };

  const openDetailsModal = (agendamento: Agendamento) => {
    setSelectedAgendamento(agendamento);
    setDetailsModalOpen(true);
  };

  const handleSaveConfigDocas = (e: React.FormEvent) => {
    e.preventDefault();
    if (configDocas.carga + configDocas.descarga > configDocas.total) {
      toast.error("A soma de docas de carga e descarga não pode ser maior que o total.");
      return;
    }
    if (configDocas.intervalo <= 0) {
      toast.error("O intervalo deve ser maior que zero.");
      return;
    }
    setConfigDialogOpen(false);
    toast.success("Configuração de docas e tempo atualizada!");
  };

  const handleShare = async (a: Agendamento) => {
    const text = `🚛 Syntex OS — Confirmação de Agendamento\n\n📅 Data: ${format(new Date(a.data), 'dd/MM/yyyy')}\n⏰ Horário: ${a.hora}\n📍 Doca: ${a.doca || 'A definir'}\n🏢 Transportadora: ${a.transportadora}\n📦 Tipo: ${a.tipo}\n🚚 Placa: ${a.placa}\n\nPor favor, compareça com antecedência.`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Confirmação de Agendamento',
          text: text,
        });
        toast.success("Agendamento compartilhado!");
      } catch (error) {
        console.error("Erro ao compartilhar", error);
      }
    } else {
      const phone = a.telefone.replace(/\D/g, ""); 
      const url = phone 
        ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      
      window.open(url, "_blank");
      toast.info("Redirecionado para o WhatsApp.");
    }
  };

  const handleDirectWhatsAppContact = (telefone: string) => {
    const phone = telefone.replace(/\D/g, "");
    if (!phone) {
      toast.error("Telefone não cadastrado.");
      return;
    }
    window.open(`https://wa.me/55${phone}`, "_blank");
  };

  const requestDelete = (id: string) => {
    setAgendamentoToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!agendamentoToDelete) return;
    const target = agendamentos.find(a => a.id === agendamentoToDelete);
    if(target) {
       addLog("REMOVIDO", `Agendamento placa ${target.placa} foi removido do sistema.`);
    }
    setAgendamentos(agendamentos.filter((a) => a.id !== agendamentoToDelete));
    setDeleteModalOpen(false);
    setAgendamentoToDelete(null);
    toast.info("Registro removido com sucesso.");
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredAgendados = useMemo(() => {
    return agendamentos.filter(a => ["agendado", "atrasado"].includes(a.status) && 
      (a.placa.toLowerCase().includes(searchAgendados.toLowerCase()) || a.transportadora.toLowerCase().includes(searchAgendados.toLowerCase()) || (a.motorista && a.motorista.toLowerCase().includes(searchAgendados.toLowerCase())))
    );
  }, [agendamentos, searchAgendados]);

  const filteredConcluidos = useMemo(() => {
    return agendamentos.filter(a => a.status === "concluido" && 
      (a.placa.toLowerCase().includes(searchConcluidos.toLowerCase()) || a.transportadora.toLowerCase().includes(searchConcluidos.toLowerCase()) || (a.motorista && a.motorista.toLowerCase().includes(searchConcluidos.toLowerCase())))
    );
  }, [agendamentos, searchConcluidos]);

  const filaAtiva = agendamentos.filter(a => ["aguardando", "carregando", "descarregando"].includes(a.status));
  const concluidos = agendamentos.filter(a => a.status === "concluido");

  return (
    <div className="space-y-6">
      
      {/* HEADER E CONFIGURAÇÕES */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Pátio & Logística</h1>
          <p className="text-sm text-muted-foreground mt-1">Agendamento de docas e controle de fluxo</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* BOTÃO LOGS */}
          <button onClick={() => setLogsModalOpen(true)} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors flex items-center gap-2 border border-border">
            <History className="h-4 w-4" /> Logs
          </button>

          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogTrigger asChild>
              <button className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors flex items-center gap-2 border border-border">
                <Settings className="h-4 w-4" /> Configurar Pátio
              </button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-border max-w-sm">
              <DialogHeader><DialogTitle className="text-foreground">Configuração de Docas & Tempo</DialogTitle></DialogHeader>
              <form onSubmit={handleSaveConfigDocas} className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total</label>
                    <input type="number" min="1" value={configDocas.total} onChange={(e) => setConfigDocas({...configDocas, total: parseInt(e.target.value) || 0})} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Carga</label>
                    <input type="number" min="0" value={configDocas.carga} onChange={(e) => setConfigDocas({...configDocas, carga: parseInt(e.target.value) || 0})} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Descarga</label>
                    <input type="number" min="0" value={configDocas.descarga} onChange={(e) => setConfigDocas({...configDocas, descarga: parseInt(e.target.value) || 0})} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Intervalo de Agendamento (Minutos)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <input 
                      type="number" 
                      min="1" 
                      value={configDocas.intervalo} 
                      onChange={(e) => setConfigDocas({...configDocas, intervalo: parseInt(e.target.value) || 0})} 
                      className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                      placeholder="Ex: 60"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">O sistema bloqueará conflitos na mesma doca com base neste tempo.</p>
                </div>
                <p className="text-xs text-muted-foreground border-t border-border/40 pt-2 mt-2">Ociosas / Mistas: {configDocas.total - (configDocas.carga + configDocas.descarga)}</p>
                <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Salvar Configurações</button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* MODAL AUDIT LOGS */}
      <Dialog open={logsModalOpen} onOpenChange={setLogsModalOpen}>
        <DialogContent className="glass-panel border-border max-w-2xl">
          <DialogHeader className="flex flex-row justify-between items-center pr-6">
            <DialogTitle className="text-foreground">Auditoria de Pátio (Logs)</DialogTitle>
            <button onClick={handlePrint} className="p-1.5 rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors" title="Imprimir / Exportar PDF">
               <Printer className="h-4 w-4" />
            </button>
          </DialogHeader>
          <div className="mt-4 h-[50vh] overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex gap-3 text-sm p-3 rounded-lg border border-border/40 bg-secondary/10">
                <div className={`w-2 h-full rounded-full shrink-0 ${log.action === 'REMOVIDO' ? 'bg-destructive' : log.action === 'CRIADO' ? 'bg-primary' : log.action === 'CONCLUIDO' ? 'bg-success' : 'bg-info'}`} />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{log.action}</p>
                  <p className="text-muted-foreground mt-0.5">{log.details}</p>
                  <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground/80 font-mono">
                    <span>{log.user}</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL CONFIRMAÇÃO EXCLUSÃO */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="glass-panel border-border max-w-sm">
          <DialogHeader>
             <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
             </div>
             <DialogTitle className="text-foreground text-center">Confirmar Remoção</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center mt-2">
             Tem certeza que deseja remover este registro permanentemente? Esta ação será registrada nos logs de auditoria.
          </p>
          <div className="flex gap-3 mt-6">
             <button onClick={() => setDeleteModalOpen(false)} className="flex-1 rounded-lg bg-secondary py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">Cancelar</button>
             <button onClick={confirmDelete} className="flex-1 rounded-lg bg-destructive py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors">Sim, remover</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL VER DETALHES (READ ONLY) */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="glass-panel border-border max-w-md">
          <DialogHeader><DialogTitle className="text-foreground">Detalhes do Agendamento</DialogTitle></DialogHeader>
          {selectedAgendamento && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p>
                  <Badge variant={statusMap[selectedAgendamento.status].variant} className={`mt-1 text-[10px] ${statusMap[selectedAgendamento.status].colorClass || ""}`}>{statusMap[selectedAgendamento.status].label}</Badge>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Data e Hora</p>
                  <p className="text-sm font-medium text-foreground">{format(new Date(selectedAgendamento.data), 'dd/MM/yyyy')} às {selectedAgendamento.hora}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Transportadora</p>
                  <p className="text-sm font-medium text-foreground">{selectedAgendamento.transportadora}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Placa / Tipo</p>
                  <p className="text-sm font-medium text-foreground">{selectedAgendamento.placa} • {selectedAgendamento.tipo}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Produto</p>
                  <p className="text-sm font-medium text-foreground">{selectedAgendamento.produto || "Não especificado"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Doca</p>
                  <p className="text-sm font-medium text-foreground">{selectedAgendamento.doca ? `Doca ${selectedAgendamento.doca}` : "A definir"}</p>
                </div>
                
                <div className="col-span-2 border-t border-border/30 pt-4 mt-2">
                  <p className="text-xs font-bold text-primary mb-2">Dados do Motorista</p>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome</p>
                      <p className="text-sm font-medium text-foreground">{selectedAgendamento.motorista || "Não informado"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CPF</p>
                      <p className="text-sm font-medium text-foreground">{selectedAgendamento.cpf || "Não informado"}</p>
                    </div>
                     <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Telefone</p>
                      <p className="text-sm font-medium text-foreground">{selectedAgendamento.telefone || "Não informado"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR AGENDAMENTO COMPLETO */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="glass-panel border-border max-w-lg">
          <DialogHeader><DialogTitle className="text-foreground">Editar Agendamento</DialogTitle></DialogHeader>
          {editForm && (
            <div className="space-y-4 mt-2 h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data *</label>
                  <input type="date" value={editForm.data} onChange={(e) => setEditForm({ ...editForm, data: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Horário *</label>
                  <input type="time" value={editForm.hora} onChange={(e) => setEditForm({ ...editForm, hora: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transportadora *</label>
                  <input value={editForm.transportadora} onChange={(e) => setEditForm({ ...editForm, transportadora: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Placa *</label>
                  <input value={editForm.placa} onChange={(e) => setEditForm({ ...editForm, placa: maskPlaca(e.target.value) })} maxLength={8} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary uppercase" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</label>
                  <select value={editForm.tipo} onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>Carga</option>
                    <option>Descarga</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Doca Prevista</label>
                  <select value={editForm.doca || ""} onChange={(e) => setEditForm({ ...editForm, doca: e.target.value ? parseInt(e.target.value) : null })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">A definir na chegada</option>
                    {Array.from({ length: configDocas.total }, (_, i) => <option key={i + 1} value={i + 1}>Doca {i + 1}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Produto (Opcional)</label>
                <input value={editForm.produto || ""} onChange={(e) => setEditForm({ ...editForm, produto: e.target.value })} placeholder="Ex: Ácido Sulfúrico" className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Motorista</label>
                  <input value={editForm.motorista} onChange={(e) => setEditForm({ ...editForm, motorista: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                 <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CPF</label>
                  <input value={editForm.cpf} onChange={(e) => setEditForm({ ...editForm, cpf: maskCPF(e.target.value) })} placeholder="000.000.000-00" className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Telefone (WhatsApp)</label>
                <input value={editForm.telefone} onChange={(e) => setEditForm({ ...editForm, telefone: maskPhone(e.target.value) })} placeholder="(11) 99999-0000" className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              
              <button onClick={handleEditSubmit} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Salvar Alterações</button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL REMARCAR ATRASADO / ATUALIZAR DADOS */}
      <Dialog open={remarcarModalOpen} onOpenChange={setRemarcarModalOpen}>
        <DialogContent className="glass-panel border-border max-w-lg">
          <DialogHeader><DialogTitle className="text-foreground">Tratar Atraso & Remarcar</DialogTitle></DialogHeader>
          {remarcarForm && (
            <div className="space-y-4 mt-2 h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-xs text-muted-foreground mb-2">O agendamento receberá um novo horário e retornará à agenda. Atualize qualquer outro dado necessário.</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nova Data *</label>
                  <input type="date" value={remarcarForm.data} onChange={(e) => setRemarcarForm({ ...remarcarForm, data: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Novo Horário *</label>
                  <input type="time" value={remarcarForm.hora} onChange={(e) => setRemarcarForm({ ...remarcarForm, hora: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transportadora *</label>
                  <input value={remarcarForm.transportadora} onChange={(e) => setRemarcarForm({ ...remarcarForm, transportadora: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Placa *</label>
                  <input value={remarcarForm.placa} onChange={(e) => setRemarcarForm({ ...remarcarForm, placa: maskPlaca(e.target.value) })} maxLength={8} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary uppercase" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</label>
                  <select value={remarcarForm.tipo} onChange={(e) => setRemarcarForm({ ...remarcarForm, tipo: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>Carga</option>
                    <option>Descarga</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Doca</label>
                  <select value={remarcarForm.doca || ""} onChange={(e) => setRemarcarForm({ ...remarcarForm, doca: e.target.value ? parseInt(e.target.value) : null })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">A definir na chegada</option>
                    {Array.from({ length: configDocas.total }, (_, i) => <option key={i + 1} value={i + 1}>Doca {i + 1}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Produto (Opcional)</label>
                <input value={remarcarForm.produto || ""} onChange={(e) => setRemarcarForm({ ...remarcarForm, produto: e.target.value })} placeholder="Ex: Ácido Sulfúrico" className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Motorista</label>
                  <input value={remarcarForm.motorista} onChange={(e) => setRemarcarForm({ ...remarcarForm, motorista: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                 <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CPF</label>
                  <input value={remarcarForm.cpf} onChange={(e) => setRemarcarForm({ ...remarcarForm, cpf: maskCPF(e.target.value) })} placeholder="000.000.000-00" className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Telefone (WhatsApp)</label>
                <input value={remarcarForm.telefone} onChange={(e) => setRemarcarForm({ ...remarcarForm, telefone: maskPhone(e.target.value) })} placeholder="(11) 99999-0000" className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <button onClick={handleRemarcarSubmit} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors mt-2">
                Confirmar e Remover Atraso
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* KPIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Aguardando", value: String(agendamentos.filter(a => a.status === "aguardando").length), icon: Clock },
          { label: "Carregando", value: String(agendamentos.filter(a => a.status === "carregando").length), icon: ArrowRight },
          { label: "Descarregando", value: String(agendamentos.filter(a => a.status === "descarregando").length), icon: ArrowDown },
          { label: "Concluídos", value: String(concluidos.length), icon: CheckCircle2 },
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

      {/* ÁREA PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* LISTA AGENDADOS */}
        <GlassCard 
          title="Lista de Agendamentos" 
          subtitle="Futuros e remarcados" 
          action={
            <div className="flex items-center gap-2">
               <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input type="text" placeholder="Buscar..." value={searchAgendados} onChange={(e) => setSearchAgendados(e.target.value)} className="w-32 lg:w-40 rounded-lg border border-border bg-secondary/30 pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
               </div>
               <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                 <DialogTrigger asChild>
                   <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1">
                     <Plus className="h-3.5 w-3.5" /> Novo
                   </button>
                 </DialogTrigger>
                 <DialogContent className="glass-panel border-border max-w-lg">
                   <DialogHeader><DialogTitle className="text-foreground">Novo Agendamento</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-2 h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data *</label><input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none" /></div>
                        <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Horário *</label><input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transportadora *</label><input value={form.transportadora} onChange={(e) => setForm({ ...form, transportadora: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none" /></div>
                        <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Placa *</label><input value={form.placa} onChange={(e) => setForm({ ...form, placa: maskPlaca(e.target.value) })} maxLength={8} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none uppercase" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</label><select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none"><option>Carga</option><option>Descarga</option></select></div>
                        <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Doca Prevista</label><select value={form.doca} onChange={(e) => setForm({ ...form, doca: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none"><option value="">A definir</option>{Array.from({ length: configDocas.total }, (_, i) => <option key={i + 1} value={i + 1}>Doca {i + 1}</option>)}</select></div>
                      </div>
                      <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Produto (Opcional)</label><input value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Motorista</label><input value={form.motorista} onChange={(e) => setForm({ ...form, motorista: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none" /></div>
                         <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CPF</label><input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none" /></div>
                      </div>
                      <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Telefone</label><input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} className="mt-1 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none" /></div>
                      <button onClick={handleCreate} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Criar Agendamento</button>
                    </div>
                 </DialogContent>
               </Dialog>
               <button onClick={handlePrint} className="p-1.5 rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors" title="Imprimir Lista"><Printer className="h-4 w-4" /></button>
            </div>
          }
        >
          <div className="mt-4 space-y-2 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredAgendados.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum agendamento encontrado.</p>}
            {filteredAgendados.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-3 border-b border-border/20 last:border-0 hover:bg-secondary/20 rounded px-2 transition-colors">
                <div className="w-16 shrink-0">
                  <span className="block text-xs font-mono text-primary font-bold">{a.hora}</span>
                  <span className="block text-[10px] text-muted-foreground">{format(new Date(a.data), 'dd/MM')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-foreground truncate">{a.placa}</p>
                    <Badge variant={statusMap[a.status].variant} className={`text-[9px] px-1 py-0 h-4 ${statusMap[a.status].colorClass || ""}`}>{statusMap[a.status].label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{a.transportadora} • {a.tipo} {a.produto ? `(${a.produto})` : ""}</p>
                  
                  <div className="flex items-center gap-2 mt-0.5">
                    {(a.motorista || a.cpf) ? (
                       <p className="text-[10px] text-muted-foreground/80 truncate">Mot: {a.motorista || 'N/I'} {a.cpf ? `(${a.cpf})` : ''}</p>
                    ) : (
                       <p className="text-[10px] text-muted-foreground/50 italic">Sem motorista vinculado</p>
                    )}
                  </div>

                  {a.status === "atrasado" && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {a.telefone && (
                        <button onClick={() => handleDirectWhatsAppContact(a.telefone)} className="flex items-center gap-1.5 text-[10px] text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2 py-1 rounded w-fit font-medium">
                          <PhoneCall className="h-3 w-3" /> Contatar Motorista
                        </button>
                      )}
                      <button onClick={() => { setRemarcarForm({ ...a }); setRemarcarModalOpen(true); }} className="flex items-center gap-1.5 text-[10px] text-destructive hover:text-destructive/80 transition-colors bg-destructive/10 border border-destructive/20 px-2 py-1 rounded w-fit font-medium">
                        <Clock className="h-3 w-3" /> Remarcar Horário
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0 items-end">
                   <div className="flex items-center gap-1">
                    <select value={a.status} onChange={(e) => handleUpdateStatus(a.id, e.target.value as Agendamento["status"])} className="text-[10px] bg-secondary border border-border rounded px-1 py-1 text-foreground outline-none cursor-pointer">
                      <option value="agendado">Agendado</option>
                      <option value="aguardando">Chegou (Pátio)</option>
                      <option value="atrasado">Marcar Atraso</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                     <button onClick={() => openDetailsModal(a)} className="p-1 rounded hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors" title="Ver Detalhes"><Eye className="h-3.5 w-3.5" /></button>
                    <button onClick={() => openEditModal(a)} className="p-1 rounded hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors" title="Editar"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleShare(a)} className="p-1 rounded hover:bg-primary/20 text-primary transition-colors" title="Compartilhar"><Share2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => requestDelete(a.id)} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* FILA PÁTIO */}
        <GlassCard title="Fila & Operação no Pátio" subtitle="Veículos presentes na planta">
          <div className="mt-4 space-y-2 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
             {filaAtiva.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Pátio vazio no momento.</p>}
            {filaAtiva.map((a) => (
              <div key={a.id} className="flex flex-col gap-2 py-3 border-b border-border/20 last:border-0 hover:bg-secondary/20 rounded px-2 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-mono font-bold text-foreground">{a.placa}</p>
                      <Badge variant={statusMap[a.status].variant} className={`text-[9px] px-1 py-0 h-4 ${statusMap[a.status].colorClass || ""}`}>{statusMap[a.status].label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.transportadora} • {a.tipo}</p>
                    {a.produto && <p className="text-[10px] text-primary font-medium">{a.produto}</p>}
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5">Agendado: {format(new Date(a.data), 'dd/MM')} às {a.hora}</p>
                  </div>
                  <div className="text-right">
                     <div className="flex items-center gap-1 mb-1 justify-end">
                      <span className="text-xs text-muted-foreground">Doca:</span>
                      <select value={a.doca || ""} onChange={(e) => {
                          const val = e.target.value; const newDoca = val ? parseInt(val) : null;
                          if (newDoca && !isSlotAvailable(a.data, a.hora, newDoca, a.id)) { toast.error(`Doca ${newDoca} indisponível.`); return; }
                          setAgendamentos(prev => prev.map(item => item.id === a.id ? { ...item, doca: newDoca } : item));
                        }} className="text-xs font-mono font-bold text-primary bg-secondary/50 border border-border rounded px-1 py-0.5 outline-none w-16 text-center cursor-pointer">
                         <option value="">--</option>
                         {Array.from({ length: configDocas.total }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                      </select>
                     </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-1 bg-background/50 p-1.5 rounded-lg border border-border/50">
                  <button onClick={() => handleUpdateStatus(a.id, "aguardando")} className={`flex-1 text-[10px] py-1 rounded transition-colors font-medium ${a.status === 'aguardando' ? 'bg-secondary text-foreground border border-border' : 'text-muted-foreground hover:bg-secondary/50'}`}>Aguardando</button>
                  <button onClick={() => handleUpdateStatus(a.id, a.tipo === "Carga" ? "carregando" : "descarregando")} className={`flex-1 text-[10px] py-1 rounded transition-colors font-medium ${['carregando', 'descarregando'].includes(a.status) ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-secondary/50'}`}>Operando</button>
                  <button onClick={() => handleUpdateStatus(a.id, "concluido")} className="flex-1 text-[10px] py-1 rounded transition-colors font-medium text-success hover:bg-success/20 hover:border hover:border-success/30">Dar Saída</button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* NOVA ÁREA: CONCLUÍDOS */}
        <GlassCard 
          title="Histórico de Concluídos"
          subtitle="Veículos liberados do pátio no dia" 
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-4">
              {concluidosExpanded && (
                 <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input type="text" placeholder="Buscar concluído..." value={searchConcluidos} onChange={(e) => setSearchConcluidos(e.target.value)} className="w-40 rounded-lg border border-border bg-secondary/30 pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
                 </div>
              )}
              <button onClick={() => setConcluidosExpanded(!concluidosExpanded)} className="flex items-center gap-2 hover:text-primary transition-colors text-sm font-medium text-foreground">
                {concluidosExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          }
        >
          {concluidosExpanded && (
            <div className="mt-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar animate-fade-in">
              {filteredConcluidos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum veículo concluído encontrado.</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredConcluidos.map((a) => (
                  <div key={a.id} className="flex flex-col gap-1 py-3 px-3 border border-border/30 bg-secondary/10 rounded-lg">
                    <div className="flex items-center justify-between">
                       <p className="text-sm font-mono font-bold text-foreground">{a.placa}</p>
                       <Badge variant={statusMap[a.status].variant} className={`text-[9px] px-1 py-0 h-4 ${statusMap[a.status].colorClass || ""}`}>{statusMap[a.status].label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.transportadora} • {a.tipo}</p>
                    <p className="text-[10px] text-muted-foreground/80 mt-1">Horário Base: {format(new Date(a.data), 'dd/MM')} às {a.hora}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                       <button onClick={() => openDetailsModal(a)} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                          <Eye className="h-3 w-3"/> Ver Detalhes
                       </button>
                       <button onClick={() => requestDelete(a.id)} className="text-[10px] text-destructive hover:underline flex items-center gap-1">
                          Remover
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

      </div>
    </div>
  );
};

export default PatioLogistica;