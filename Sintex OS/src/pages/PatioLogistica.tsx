import React, { useState, useMemo, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { 
  Truck, 
  Calendar, 
  Clock, 
  ArrowRight, 
  ArrowDown, 
  Plus, 
  Share2, 
  Trash2, 
  Settings, 
  Edit2, 
  Eye, 
  PhoneCall, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  History, 
  Printer, 
  AlertTriangle,
  Scale,
  ShieldAlert,
  Flame,
  AlertCircle,
  Activity,
  FileText,
  Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, addMinutes, differenceInMinutes } from "date-fns";

// ==========================================
// INTERFACES E TIPAGENS
// ==========================================
interface Agendamento {
  id: string;
  data: string;
  hora: string;
  doca: number | null;
  transportadora: string;
  tipo: string;
  produto?: string;
  motorista: string;
  cpf: string;
  placa: string;
  telefone: string;
  status: "agendado" | "atrasado" | "aguardando" | "carregando" | "descarregando" | "concluido";
  
  // NOVOS CAMPOS: BALANÇA E TORRE DE CONTROLE
  pesoNota?: number; // Peso declarado na NF (Toneladas)
  pesoBalanca?: number; // Peso real aferido (Toneladas)
  horaCheckIn?: string; // Hora exata da entrada no pátio para cálculo de SLA
  periculosidade?: "Nenhuma" | "Baixa" | "Média" | "Alta" | "Crítica"; // Nível de risco químico
  observacaoDivergencia?: string; // NOVO: Justificativa em caso de diferença de peso
}

interface ConfiguracaoDocas {
  total: number;
  carga: number;
  descarga: number;
  intervalo: number; // Intervalo em minutos
  metaSlaEspera: number; // NOVO: SLA máximo no pátio antes de ser considerado GARGALO
}

interface AuditLog {
  id: string;
  action: "CRIADO" | "REMOVIDO" | "ATUALIZADO" | "CONCLUIDO" | "CHECK-IN" | "PESAGEM" | "ALERTA_SLA";
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

// ==========================================
// FUNÇÕES DE MÁSCARA E VALIDAÇÃO
// ==========================================
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

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const PatioLogistica = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Estado de Relógio em Tempo Real para Cálculo de SLA de Gargalos
  const [horaAtual, setHoraAtual] = useState(format(new Date(), 'HH:mm'));

  useEffect(() => {
    // Atualiza o relógio a cada 30 segundos para manter a Torre de Controle "viva"
    const interval = setInterval(() => {
      setHoraAtual(format(new Date(), 'HH:mm'));
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const [configDocas, setConfigDocas] = useState<ConfiguracaoDocas>({ 
    total: 20, 
    carga: 10, 
    descarga: 10, 
    intervalo: 60,
    metaSlaEspera: 45 // 45 minutos é a meta padrão para alertar gargalo
  });
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // MOCK DATA INICIAL EXPANDIDO COM OS NOVOS PARÂMETROS
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([
    { id: "a1", data: today, hora: "07:00", horaCheckIn: "06:45", doca: 1, transportadora: "TransLog BR", tipo: "Carga", produto: "Ácido Sulfúrico", motorista: "José Silva", cpf: "111.222.333-44", placa: "ABC-1D23", telefone: "(11) 99999-0001", status: "carregando", pesoNota: 30, periculosidade: "Crítica" },
    { id: "a2", data: today, hora: "07:30", horaCheckIn: "06:00", doca: 3, transportadora: "QuimTrans", tipo: "Descarga", produto: "NaOH 50%", motorista: "Pedro Santos", cpf: "555.666.777-88", placa: "XYZ-4E56", telefone: "(11) 99999-0002", status: "aguardando", pesoNota: 45, periculosidade: "Alta" }, // Intencionalmente em SLA Violado (Gargalo)
    { id: "a3", data: today, hora: "08:00", doca: null, transportadora: "ChemFreight", tipo: "Carga", motorista: "João Souza", cpf: "999.888.777-66", placa: "DEF-7G89", telefone: "(11) 99999-0003", status: "agendado", pesoNota: 28, periculosidade: "Baixa" },
    { id: "a4", data: today, hora: "08:30", horaCheckIn: "08:15", doca: 2, transportadora: "LogQuímica", tipo: "Descarga", produto: "Soda Cáustica", motorista: "Carlos Lima", cpf: "444.333.222-11", placa: "GHI-0J12", telefone: "(11) 99999-0004", status: "descarregando", pesoNota: 32, periculosidade: "Média" },
    { id: "a5", data: today, hora: "09:00", doca: null, transportadora: "ExpressChem", tipo: "Carga", produto: "Peróxido H2O2", motorista: "André Costa", cpf: "123.456.789-00", placa: "JKL-3M45", telefone: "(11) 99999-0005", status: "atrasado", pesoNota: 15, periculosidade: "Média" },
    { id: "a6", data: today, hora: "06:00", horaCheckIn: "05:50", doca: null, transportadora: "LogMaster", tipo: "Carga", produto: "Etanol", motorista: "Paulo Silva", cpf: "123.123.123-11", placa: "MMM-9999", telefone: "(11) 98888-7777", status: "concluido", pesoNota: 40, pesoBalanca: 39.5, periculosidade: "Alta", observacaoDivergencia: "Balança descalibrada, desconto de tara ajustado na NF." },
  ]);

  // Estados dos Formulários
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ 
    data: today, 
    hora: "", 
    doca: "1", 
    transportadora: "", 
    tipo: "Carga", 
    produto: "", 
    motorista: "", 
    cpf: "", 
    placa: "", 
    telefone: "",
    pesoNota: "",
    periculosidade: "Nenhuma"
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Agendamento | null>(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);

  const [remarcarModalOpen, setRemarcarModalOpen] = useState(false);
  const [remarcarForm, setRemarcarForm] = useState<Agendamento | null>(null);

  // Estados dos Novos Módulos Operacionais (Balança / Saída)
  const [saidaModalOpen, setSaidaModalOpen] = useState(false);
  const [saidaForm, setSaidaForm] = useState<{id: string, placa: string, pesoNota: number, pesoBalanca: string, observacao: string} | null>(null);

  const [pesagemAvulsaOpen, setPesagemAvulsaOpen] = useState(false);
  const [pesagemForm, setPesagemForm] = useState<{id: string, placa: string, pesoBalanca: string} | null>(null);

  // Usuário Simulado para os Logs
  const currentUser = "Admin Syntex";

  // Estado dos Logs
  const [logs, setLogs] = useState<AuditLog[]>([
    { id: "l1", action: "CRIADO", timestamp: format(new Date(), "dd/MM/yyyy HH:mm:ss"), user: "Sistema", details: "Carga inicial de dados do pátio com regras de Torre de Controle ativas." }
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

  // ==========================================
  // MOTOR DE RELATÓRIOS PDF/PRINT
  // ==========================================
  const generatePrintDocument = (title: string, headers: string[], rows: (string | number)[][]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Permita pop-ups no seu navegador para gerar o relatório.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - Syntex OS</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #111; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #222; padding-bottom: 10px; margin-bottom: 20px; align-items: flex-end; }
            .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; color: #000; }
            .header p { margin: 0; font-size: 12px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f4f4f5; font-weight: bold; text-transform: uppercase; font-size: 10px; color: #333; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .footer { font-size: 10px; color: #888; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${title}</h1>
              <p style="margin-top: 5px; font-weight: bold;">SYNTEX OS - TORRE DE CONTROLE LOGÍSTICA</p>
            </div>
            <p>Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>
          </div>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
          <div class="footer">Documento gerado eletronicamente por Syntex OS - Hub de Automação Industrial 4.0</div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  // ==========================================
  // LÓGICAS DA TORRE DE CONTROLE (KPIs e SLAs)
  // ==========================================

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

  // Verifica se o SLA de pátio foi rompido (Gargalo Financeiro)
  const checkSlaViolado = (horaCheckIn?: string) => {
    if (!horaCheckIn) return false;
    const minsIn = timeToMinutes(horaCheckIn);
    const minsAtual = timeToMinutes(horaAtual);
    
    // Simplificação para o mesmo dia. Se for negativo, virou o dia (cenário avançado).
    const diff = minsAtual - minsIn;
    if (diff < 0) return false; 
    
    return diff > configDocas.metaSlaEspera;
  };

  // Componente Visual de Periculosidade
  const renderPericulosidadeBadge = (nivel?: string) => {
    if (!nivel || nivel === "Nenhuma") return null;
    
    let colorClass = "";
    switch (nivel) {
      case "Baixa": colorClass = "bg-blue-500/10 text-blue-500 border-blue-500/20"; break;
      case "Média": colorClass = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"; break;
      case "Alta": colorClass = "bg-orange-500/10 text-orange-500 border-orange-500/20"; break;
      case "Crítica": colorClass = "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse font-extrabold"; break;
      default: return null;
    }

    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border ${colorClass}`}>
        <Flame className="h-2.5 w-2.5" />
        RISCO {nivel}
      </span>
    );
  };

  // Cálculo de Divergência de Peso (NF vs Balança)
  const renderDivergencia = (pesoNF?: number, pesoBal?: number) => {
    if (!pesoNF || !pesoBal) return null;
    const diff = pesoBal - pesoNF;
    
    if (diff === 0) {
      return <span className="text-emerald-500 font-medium text-xs">Exato (0t)</span>;
    } else if (diff < 0) {
      return <span className="text-destructive font-bold text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {diff.toFixed(2)}t (Perda)</span>;
    } else {
      return <span className="text-blue-500 font-bold text-xs flex items-center gap-1"><Plus className="h-3 w-3" /> +{diff.toFixed(2)}t (Excesso)</span>;
    }
  };

  // ==========================================
  // HANDLERS E AÇÕES
  // ==========================================
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
      status: "agendado",
      pesoNota: form.pesoNota ? parseFloat(form.pesoNota) : undefined,
      periculosidade: form.periculosidade as Agendamento["periculosidade"]
    };

    setAgendamentos([...agendamentos, novoAgendamento]);
    addLog("CRIADO", `Agendamento placa ${form.placa} criado para ${format(new Date(form.data), 'dd/MM')} às ${form.hora}. Volume previsto: ${form.pesoNota || 0}t.`);
    
    // Reset Form
    setForm({ 
      data: today, hora: "", doca: "1", transportadora: "", tipo: "Carga", produto: "", motorista: "", cpf: "", placa: "", telefone: "",
      pesoNota: "", periculosidade: "Nenhuma" 
    });
    setDialogOpen(false);
    toast.success("Agendamento criado com sucesso!");
  };

  const handleUpdateStatus = (id: string, newStatus: Agendamento["status"]) => {
    // CORREÇÃO: "Apurar Falta/Atraso" apenas muda o status, NÃO ABRE MODAL AUTOMATICAMENTE.
    if (newStatus === "atrasado") {
       setAgendamentos(agendamentos.map(a => {
         if (a.id === id) {
           addLog("ATUALIZADO", `Status do agendamento placa ${a.placa} alterado para Atrasado/Falta.`);
           return { ...a, status: newStatus };
         }
         return a;
       }));
       toast.warning("Veículo marcado como atrasado/falta. Realize o contato com o motorista para reprogramação.");
       return; 
    }

    // Fluxo de Check-in (Entrada de NF)
    if (newStatus === "aguardando") {
       setAgendamentos(agendamentos.map(a => {
         if (a.id === id) {
           addLog("CHECK-IN", `Check-in realizado para ${a.placa}. SLA Iniciado.`);
           return { ...a, status: newStatus, horaCheckIn: horaAtual };
         }
         return a;
       }));
       toast.success("Veículo admitido no pátio. SLA de espera iniciado.");
       return;
    }

    // Fluxo de Check-out (Requer Balança)
    if (newStatus === "concluido") {
      const agendamento = agendamentos.find(a => a.id === id);
      if (agendamento) {
         setSaidaForm({ 
           id: agendamento.id, 
           placa: agendamento.placa, 
           pesoNota: agendamento.pesoNota || 0,
           pesoBalanca: agendamento.pesoBalanca ? String(agendamento.pesoBalanca) : "", 
           observacao: agendamento.observacaoDivergencia || "" 
         });
         setSaidaModalOpen(true);
      }
      return;
    }

    // Demais status (Carregando / Descarregando)
    setAgendamentos(agendamentos.map(a => {
      if (a.id === id) {
        return { ...a, status: newStatus };
      }
      return a;
    }));
  };

  // Submissão do Modal de Saída & Pesagem Final
  const handleConfirmarSaida = () => {
    if (!saidaForm || !saidaForm.pesoBalanca) {
      toast.error("O peso aferido na balança é obrigatório para concluir o processo.");
      return;
    }

    const pesoBal = parseFloat(saidaForm.pesoBalanca);
    const diff = pesoBal - saidaForm.pesoNota;

    setAgendamentos(agendamentos.map(a => {
      if (a.id === saidaForm.id) {
        addLog("CONCLUIDO", `Operação placa ${a.placa} concluída. NF: ${saidaForm.pesoNota}t | Balança: ${pesoBal}t | Div: ${diff.toFixed(2)}t.`);
        if (Math.abs(diff) > 0) {
           addLog("ATUALIZADO", `ALERTA DE TORRE: Divergência de ${diff.toFixed(2)}t detectada no check-out da placa ${a.placa}. Observação: ${saidaForm.observacao}`);
        }
        return { 
          ...a, 
          status: "concluido", 
          doca: null, 
          pesoBalanca: pesoBal,
          observacaoDivergencia: saidaForm.observacao // Salva a justificativa da divergência
        };
      }
      return a;
    }));

    toast.success(`Caminhão ${saidaForm.placa} finalizado e volume consolidado na Torre.`);
    setSaidaModalOpen(false);
    setSaidaForm(null);
  };

  // Submissão de Pesagem Avulsa (Sem dar saída)
  const handleConfirmarPesagemAvulsa = () => {
    if (!pesagemForm || !pesagemForm.pesoBalanca) {
       toast.error("Insira o peso aferido.");
       return;
    }
    const pesoBal = parseFloat(pesagemForm.pesoBalanca);
    
    setAgendamentos(agendamentos.map(a => {
       if (a.id === pesagemForm.id) {
         addLog("PESAGEM", `Pesagem avulsa da placa ${a.placa} registrada: ${pesoBal}t.`);
         return { ...a, pesoBalanca: pesoBal };
       }
       return a;
    }));

    toast.success("Peso registrado na balança com sucesso.");
    setPesagemAvulsaOpen(false);
    setPesagemForm(null);
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
          pesoNota: typeof remarcarForm.pesoNota === "string" ? parseFloat(remarcarForm.pesoNota) : remarcarForm.pesoNota,
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

    setAgendamentos(agendamentos.map(a => {
      if (a.id === editForm.id) {
        return {
           ...editForm,
           pesoNota: typeof editForm.pesoNota === "string" ? parseFloat(editForm.pesoNota) : editForm.pesoNota
        }
      }
      return a;
    }));

    addLog("ATUALIZADO", `Agendamento placa ${editForm.placa} foi editado pelo backoffice.`);
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
    if (configDocas.intervalo <= 0 || configDocas.metaSlaEspera <= 0) {
      toast.error("Os valores de tempo devem ser maiores que zero.");
      return;
    }
    setConfigDialogOpen(false);
    addLog("ATUALIZADO", `Configurações de Pátio e Torre de Controle (SLA: ${configDocas.metaSlaEspera}m) alteradas.`);
    toast.success("Configuração de docas e SLAs atualizada!");
  };

  const handleShare = async (a: Agendamento) => {
    const text = `🚛 Syntex OS — Confirmação de Agendamento\n\n📅 Data: ${format(new Date(a.data), 'dd/MM/yyyy')}\n⏰ Horário: ${a.hora}\n📍 Doca: ${a.doca || 'A definir'}\n🏢 Transportadora: ${a.transportadora}\n📦 Tipo: ${a.tipo}\n🚚 Placa: ${a.placa}\n⚖️ Volume Previsto: ${a.pesoNota || 0}t\n\n⚠️ Atenção a regras de segurança do produto. Por favor, compareça com antecedência.`;
    
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

  // Funções de Exportação PDF/Impressão Diferenciadas
  const exportFila = () => {
    const headers = ["Data/Hora", "Doca", "Placa", "Transportadora", "Operação", "Produto/Risco", "Volume (NF)", "Status"];
    const rows = filteredAgendados.map(a => [
      `${format(new Date(a.data), 'dd/MM/yyyy')} às ${a.hora}`,
      a.doca ? `Doca ${a.doca}` : "A definir",
      a.placa,
      a.transportadora,
      a.tipo,
      `${a.produto || '-'} (${a.periculosidade || 'Nenhuma'})`,
      a.pesoNota ? `${a.pesoNota}t` : '-',
      statusMap[a.status].label
    ]);
    generatePrintDocument("Relatório Logístico: Fila de Previsão Diária", headers, rows);
  };

  const exportYield = () => {
    const headers = ["Data Saída", "Placa", "Transportadora", "Operação", "Volume Esperado (NF)", "Volume Aferido (Balança)", "Divergência", "Observações"];
    const rows = filteredConcluidos.map(a => {
       const diff = (a.pesoBalanca || 0) - (a.pesoNota || 0);
       return [
          format(new Date(), 'dd/MM/yyyy'), // Simplificado, assumindo saída no dia
          a.placa,
          a.transportadora,
          a.tipo,
          a.pesoNota ? `${a.pesoNota}t` : '-',
          a.pesoBalanca ? `${a.pesoBalanca}t` : '-',
          diff !== 0 ? `${diff > 0 ? '+' : ''}${diff.toFixed(2)}t` : 'Exato',
          a.observacaoDivergencia || '-'
       ];
    });
    generatePrintDocument("Relatório Torre de Controle: Yield e Consolidação de Balança", headers, rows);
  };

  const exportLogs = () => {
    const headers = ["Data / Hora", "Ação", "Detalhes da Operação", "Usuário Responsável"];
    const rows = logs.map(l => [
       l.timestamp,
       l.action,
       l.details,
       l.user
    ]);
    generatePrintDocument("Auditoria de Sistema: Logs do Pátio", headers, rows);
  };

  const handleImprimirTicket = (a: Agendamento) => {
    const headers = ["Campo Operacional", "Informação Registrada"];
    const diff = (a.pesoBalanca || 0) - (a.pesoNota || 0);
    const rows = [
       ["Placa do Veículo", a.placa],
       ["Empresa / Transportadora", a.transportadora],
       ["Motorista", `${a.motorista} (CPF: ${a.cpf})`],
       ["Produto e Periculosidade", `${a.produto || "Não especificado"} | Risco: ${a.periculosidade}`],
       ["Data e Hora do Agendamento", `${format(new Date(a.data), 'dd/MM/yyyy')} às ${a.hora}`],
       ["Horário Check-in no Pátio", a.horaCheckIn || "Não registrado"],
       ["Peso NF (Declarado)", a.pesoNota ? `${a.pesoNota} t` : "Não registrado"],
       ["Peso Balança (Aferido na Planta)", a.pesoBalanca ? `${a.pesoBalanca} t` : "Aguardando Pesagem"],
       ["Análise de Divergência", diff !== 0 ? `${diff > 0 ? '+' : ''}${diff.toFixed(2)} t` : 'Exato (0t)'],
       ["Observações de Saída", a.observacaoDivergencia || "Nenhuma observação registrada"]
    ];
    generatePrintDocument(`Ticket de Pesagem e Movimentação: ${a.placa}`, headers, rows);
    toast.success(`Gerando ticket de balança/operação para ${a.placa}...`);
  };

  // ==========================================
  // COMPUTAÇÃO DE DADOS PARA A TORRE DE CONTROLE
  // ==========================================

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

  // KPI 1: Volume Total Progressivo (Evita perder dinheiro entendendo o Yield diário)
  const volumeTotalProcessado = useMemo(() => {
    return concluidos.reduce((acc, current) => {
       const pesoValido = current.pesoBalanca || current.pesoNota || 0;
       return acc + pesoValido;
    }, 0);
  }, [concluidos]);

  // KPI 2: Gargalos em Tempo Real
  const contagemGargalos = useMemo(() => {
    return filaAtiva.filter(a => a.status === 'aguardando' && checkSlaViolado(a.horaCheckIn)).length;
  }, [filaAtiva, horaAtual]);

  // ==========================================
  // RENDERIZAÇÃO DA INTERFACE
  // ==========================================
  return (
    <div className="space-y-6">
      
      {/* HEADER E CONFIGURAÇÕES */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-secondary/10 p-4 rounded-xl border border-border/40 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Gestão de Pátio & Logística
            {contagemGargalos > 0 && (
              <Badge variant="destructive" className="animate-pulse flex items-center gap-1 text-[10px]">
                <AlertTriangle className="h-3 w-3"/> GARGALO ATIVO
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Integração Torre de Controle • Relógio Operacional: <span className="font-mono font-bold text-primary">{horaAtual}</span></p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* BOTÃO LOGS */}
          <button 
            onClick={() => setLogsModalOpen(true)} 
            className="rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors flex items-center gap-2 border border-border shadow-sm"
          >
            <History className="h-4 w-4" /> Histórico / Auditoria
          </button>

          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogTrigger asChild>
              <button className="rounded-lg bg-primary/10 text-primary border border-primary/20 px-4 py-2 text-xs font-semibold hover:bg-primary/20 transition-colors flex items-center gap-2 shadow-sm">
                <Settings className="h-4 w-4" /> Configurar Pátio & SLAs
              </button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-border max-w-sm">
              <DialogHeader><DialogTitle className="text-foreground flex items-center gap-2"><Settings className="h-5 w-5"/> Configuração de Pátio</DialogTitle></DialogHeader>
              <form onSubmit={handleSaveConfigDocas} className="space-y-5 mt-4">
                <div className="grid grid-cols-3 gap-4 p-3 bg-secondary/20 rounded-lg border border-border/50">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Docas</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={configDocas.total} 
                      onChange={(e) => setConfigDocas({...configDocas, total: parseInt(e.target.value) || 0})} 
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Carga</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={configDocas.carga} 
                      onChange={(e) => setConfigDocas({...configDocas, carga: parseInt(e.target.value) || 0})} 
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Descarga</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={configDocas.descarga} 
                      onChange={(e) => setConfigDocas({...configDocas, descarga: parseInt(e.target.value) || 0})} 
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary"/> Intervalo de Agendamento</label>
                    <p className="text-[10px] text-muted-foreground mb-1">Prevenção de conflito de docas (em minutos).</p>
                    <input 
                      type="number" 
                      min="1" 
                      value={configDocas.intervalo} 
                      onChange={(e) => setConfigDocas({...configDocas, intervalo: parseInt(e.target.value) || 0})} 
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>

                  <div className="pt-2 border-t border-border/40">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1 text-destructive"><AlertCircle className="h-3.5 w-3.5"/> Meta SLA de Espera (Gargalo)</label>
                    <p className="text-[10px] text-muted-foreground mb-1">Tempo máximo no pátio antes de soar alerta de ineficiência.</p>
                    <input 
                      type="number" 
                      min="1" 
                      value={configDocas.metaSlaEspera} 
                      onChange={(e) => setConfigDocas({...configDocas, metaSlaEspera: parseInt(e.target.value) || 0})} 
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-destructive" 
                    />
                  </div>
                </div>
                
                <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-md">
                  Salvar Parâmetros da Torre
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* MODALS DA OPERAÇÃO DE BALANÇA E SAÍDA */}
      
      {/* 1. Modal Saída e Check-out */}
      <Dialog open={saidaModalOpen} onOpenChange={setSaidaModalOpen}>
         <DialogContent className="glass-panel border-border max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                 <Truck className="h-5 w-5 text-emerald-500"/>
                 Check-out & Consolidação
              </DialogTitle>
            </DialogHeader>
            {saidaForm && (
              <div className="mt-4 space-y-4">
                 <div className="p-3 bg-secondary/20 rounded-lg border border-border/50 text-center">
                    <p className="text-xs text-muted-foreground">Placa Operacional</p>
                    <p className="text-xl font-mono font-bold text-foreground">{saidaForm.placa}</p>
                 </div>

                 <div className="flex justify-between items-center px-2">
                    <div>
                       <p className="text-[10px] uppercase text-muted-foreground">Peso da NF</p>
                       <p className="text-sm font-bold">{saidaForm.pesoNota} t</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="text-right">
                       <p className="text-[10px] uppercase text-primary font-bold">Peso da Balança *</p>
                       <div className="flex items-center justify-end gap-1">
                          <input 
                             type="number" 
                             step="0.01"
                             value={saidaForm.pesoBalanca}
                             onChange={(e) => setSaidaForm({...saidaForm, pesoBalanca: e.target.value})}
                             className="w-20 rounded bg-background border border-primary/50 px-2 py-1 text-sm font-bold outline-none text-right"
                             placeholder="0.00"
                          />
                          <span className="text-sm text-muted-foreground">t</span>
                       </div>
                    </div>
                 </div>

                 <div className="bg-background/50 p-3 rounded border border-border/30">
                    <label className="text-[10px] text-muted-foreground uppercase">Observações de Divergência</label>
                    <textarea 
                       value={saidaForm.observacao}
                       onChange={(e) => setSaidaForm({...saidaForm, observacao: e.target.value})}
                       className="w-full mt-1 bg-transparent border border-border rounded text-sm p-2 outline-none resize-none h-16"
                       placeholder="Motivo em caso de diferença de peso (Opcional)..."
                    />
                 </div>

                 <button onClick={handleConfirmarSaida} className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                    Confirmar Saída e Alimentar Torre
                 </button>
              </div>
            )}
         </DialogContent>
      </Dialog>

      {/* 2. Modal Pesagem Avulsa (Balança de Entrada/Saída sem Check-out) */}
      <Dialog open={pesagemAvulsaOpen} onOpenChange={setPesagemAvulsaOpen}>
         <DialogContent className="glass-panel border-border max-w-sm">
            <DialogHeader>
               <DialogTitle className="text-foreground flex items-center gap-2">
                 <Scale className="h-5 w-5 text-blue-500"/>
                 Módulo Balança Integrada
               </DialogTitle>
            </DialogHeader>
            {pesagemForm && (
               <div className="mt-4 space-y-4">
                  <p className="text-xs text-muted-foreground text-center">Aferição de peso real para a placa <strong className="text-foreground">{pesagemForm.placa}</strong>.</p>
                  
                  <div>
                    <label className="text-xs font-medium text-foreground">Peso Lido na Balança (Toneladas)</label>
                    <input 
                       type="number" 
                       step="0.01"
                       value={pesagemForm.pesoBalanca}
                       onChange={(e) => setPesagemForm({...pesagemForm, pesoBalanca: e.target.value})}
                       className="w-full mt-1 rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3 text-lg font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Ex: 42.50"
                    />
                  </div>

                  <button onClick={handleConfirmarPesagemAvulsa} className="w-full rounded-lg bg-blue-500 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-colors">
                     Registrar Pesagem
                  </button>
               </div>
            )}
         </DialogContent>
      </Dialog>


      {/* MODAL AUDIT LOGS */}
      <Dialog open={logsModalOpen} onOpenChange={setLogsModalOpen}>
        <DialogContent className="glass-panel border-border max-w-3xl">
          <DialogHeader className="flex flex-row justify-between items-center pr-6">
            <DialogTitle className="text-foreground flex items-center gap-2">
               <ShieldAlert className="h-5 w-5 text-primary"/>
               Auditoria de Torre e Operação
            </DialogTitle>
            <button onClick={exportLogs} className="p-1.5 rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors flex items-center gap-1.5 text-xs font-bold" title="Imprimir Relatório de Auditoria (Logs)">
               <Printer className="h-4 w-4" /> Exportar PDF
            </button>
          </DialogHeader>
          <div className="mt-4 h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {logs.map(log => (
              <div key={log.id} className="flex gap-3 text-sm p-4 rounded-xl border border-border/40 bg-secondary/20 shadow-sm">
                <div className={`w-1.5 h-full rounded-full shrink-0 ${log.action === 'REMOVIDO' ? 'bg-destructive' : log.action === 'CRIADO' ? 'bg-primary' : log.action === 'CONCLUIDO' ? 'bg-emerald-500' : log.action === 'CHECK-IN' ? 'bg-blue-500' : log.action === 'PESAGEM' ? 'bg-purple-500' : 'bg-orange-500'}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                     <Badge variant="outline" className="text-[10px] font-bold tracking-wider">{log.action}</Badge>
                     <span className="text-[10px] text-muted-foreground/80 font-mono">{log.timestamp}</span>
                  </div>
                  <p className="text-muted-foreground mt-1 leading-relaxed text-xs">{log.details}</p>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/30 text-[10px] text-muted-foreground/80 font-mono">
                    <span className="flex items-center gap-1"><UserIcon/> Usuário: {log.user}</span>
                    <span>ID: {log.id}</span>
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
             <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                <AlertTriangle className="h-7 w-7 text-destructive" />
             </div>
             <DialogTitle className="text-foreground text-center text-xl">Confirmar Remoção</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center mt-2 leading-relaxed">
             Tem certeza que deseja remover este registro permanentemente? Esta ação de exclusão de dados logísticos será rastreada nos logs de auditoria.
          </p>
          <div className="flex gap-3 mt-8">
             <button onClick={() => setDeleteModalOpen(false)} className="flex-1 rounded-lg bg-secondary py-2.5 text-sm font-semibold hover:bg-secondary/80 transition-colors">
               Cancelar
             </button>
             <button onClick={confirmDelete} className="flex-1 rounded-lg bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-lg shadow-destructive/20">
               Sim, remover
             </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL VER DETALHES COMPLETOS (TORRE VIEW) */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="glass-panel border-border max-w-2xl">
          <DialogHeader className="flex flex-row justify-between items-center pr-6">
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary"/> Detalhes Consolidados do Veículo
            </DialogTitle>
            <button onClick={() => {if(selectedAgendamento) handleImprimirTicket(selectedAgendamento)}} className="p-1.5 rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors flex items-center gap-2 text-xs font-semibold" title="Imprimir Ticket da Balança">
               <FileText className="h-4 w-4" /> Imprimir Ticket
            </button>
          </DialogHeader>
          {selectedAgendamento && (
            <div className="space-y-6 mt-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              
              {/* Header Card */}
              <div className="flex items-center justify-between bg-secondary/20 p-4 rounded-xl border border-border/50">
                 <div>
                    <p className="text-2xl font-mono font-bold text-foreground">{selectedAgendamento.placa}</p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedAgendamento.transportadora} • {selectedAgendamento.tipo}</p>
                 </div>
                 <div className="text-right">
                    <Badge variant={statusMap[selectedAgendamento.status].variant} className={`text-xs px-3 py-1 ${statusMap[selectedAgendamento.status].colorClass || ""}`}>
                      {statusMap[selectedAgendamento.status].label}
                    </Badge>
                    <div className="mt-2">
                       {renderPericulosidadeBadge(selectedAgendamento.periculosidade)}
                    </div>
                 </div>
              </div>

              {/* Grid Principal */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background/50 p-3 rounded-lg border border-border/30">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3"/> Data e Hora Base</p>
                  <p className="text-sm font-medium text-foreground mt-1">{format(new Date(selectedAgendamento.data), 'dd/MM/yyyy')} às {selectedAgendamento.hora}</p>
                </div>
                <div className="bg-background/50 p-3 rounded-lg border border-border/30">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/> Check-In Pátio</p>
                  <p className="text-sm font-medium text-foreground mt-1">{selectedAgendamento.horaCheckIn || "Não registrado"}</p>
                </div>
                <div className="bg-background/50 p-3 rounded-lg border border-border/30">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3"/> Doca de Operação</p>
                  <p className="text-sm font-medium text-foreground mt-1">{selectedAgendamento.doca ? `Doca ${selectedAgendamento.doca}` : "A definir"}</p>
                </div>
                <div className="bg-background/50 p-3 rounded-lg border border-border/30">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3"/> Produto Químico</p>
                  <p className="text-sm font-medium text-foreground mt-1">{selectedAgendamento.produto || "N/I"}</p>
                </div>
              </div>
              
              {/* Seção Balança & Volume */}
              <div className="border border-primary/20 bg-primary/5 p-4 rounded-xl">
                 <p className="text-xs font-bold text-primary flex items-center gap-2 mb-3"><Scale className="h-4 w-4"/> Auditoria de Peso (Balança vs NF)</p>
                 <div className="grid grid-cols-3 gap-4">
                    <div>
                       <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Volume NF (Previsto)</p>
                       <p className="text-lg font-mono font-bold">{selectedAgendamento.pesoNota ? `${selectedAgendamento.pesoNota} t` : "N/I"}</p>
                    </div>
                    <div>
                       <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Volume Balança (Real)</p>
                       <p className="text-lg font-mono font-bold">{selectedAgendamento.pesoBalanca ? `${selectedAgendamento.pesoBalanca} t` : "Aguardando"}</p>
                    </div>
                    <div>
                       <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Divergência / Perda</p>
                       <p className="mt-1">
                          {renderDivergencia(selectedAgendamento.pesoNota, selectedAgendamento.pesoBalanca) || <span className="text-xs text-muted-foreground">--</span>}
                       </p>
                    </div>
                 </div>
                 
                 {/* Exibição da Observação de Divergência */}
                 {selectedAgendamento.observacaoDivergencia && (
                    <div className="mt-4 p-3 bg-secondary/30 rounded border border-border/50">
                       <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Justificativa de Divergência / Observação de Saída
                       </p>
                       <p className="text-sm text-foreground italic">"{selectedAgendamento.observacaoDivergencia}"</p>
                    </div>
                 )}
              </div>

              {/* Seção Motorista */}
              <div className="border border-border/30 p-4 rounded-xl bg-background/30">
                <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-2"><UserIcon/> Dados do Motorista</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                     <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome Completo</p>
                     <p className="text-sm font-medium text-foreground mt-1">{selectedAgendamento.motorista || "Não informado"}</p>
                   </div>
                   <div>
                     <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CPF Registrado</p>
                     <p className="text-sm font-medium text-foreground mt-1">{selectedAgendamento.cpf || "Não informado"}</p>
                   </div>
                   <div>
                     <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contato / WhatsApp</p>
                     <div className="flex items-center gap-2 mt-1">
                       <p className="text-sm font-medium text-foreground">{selectedAgendamento.telefone || "Não informado"}</p>
                       {selectedAgendamento.telefone && (
                         <button onClick={() => handleDirectWhatsAppContact(selectedAgendamento.telefone)} className="p-1 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors">
                           <PhoneCall className="h-3 w-3" />
                         </button>
                       )}
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
        <DialogContent className="glass-panel border-border max-w-2xl">
          <DialogHeader><DialogTitle className="text-foreground flex items-center gap-2"><Edit2 className="h-5 w-5 text-primary"/> Editar Registro & Configurações</DialogTitle></DialogHeader>
          {editForm && (
            <div className="space-y-5 mt-4 h-[65vh] overflow-y-auto pr-3 custom-scrollbar">
              
              {/* Bloco 1: Logística Base */}
              <div className="bg-secondary/10 p-4 rounded-xl border border-border/40 space-y-4">
                 <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Dados de Logística Base</p>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data do Agendamento *</label>
                     <input 
                       type="date" 
                       value={editForm.data} 
                       onChange={(e) => setEditForm({ ...editForm, data: e.target.value })} 
                       className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                     />
                   </div>
                   <div>
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Horário Previsto *</label>
                     <input 
                       type="time" 
                       value={editForm.hora} 
                       onChange={(e) => setEditForm({ ...editForm, hora: e.target.value })} 
                       className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Empresa / Transportadora *</label>
                     <input 
                       value={editForm.transportadora} 
                       onChange={(e) => setEditForm({ ...editForm, transportadora: e.target.value })} 
                       className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                     />
                   </div>
                   <div>
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Placa do Cavalo *</label>
                     <input 
                       value={editForm.placa} 
                       onChange={(e) => setEditForm({ ...editForm, placa: maskPlaca(e.target.value) })} 
                       maxLength={8} 
                       className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary uppercase transition-all" 
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Natureza da Operação</label>
                     <select 
                       value={editForm.tipo} 
                       onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })} 
                       className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                     >
                       <option>Carga</option>
                       <option>Descarga</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Doca Preferencial</label>
                     <select 
                       value={editForm.doca || ""} 
                       onChange={(e) => setEditForm({ ...editForm, doca: e.target.value ? parseInt(e.target.value) : null })} 
                       className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                     >
                       <option value="">Decidir em Tempo Real</option>
                       {Array.from({ length: configDocas.total }, (_, i) => <option key={i + 1} value={i + 1}>Doca Numérica {i + 1}</option>)}
                     </select>
                   </div>
                 </div>
              </div>

              {/* Bloco 2: Produto e Integração Torre */}
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-4">
                 <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Torre de Controle & Riscos</p>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="md:col-span-1">
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Volume Declarado (NF)</label>
                     <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="number"
                          step="0.01"
                          value={editForm.pesoNota || ""} 
                          onChange={(e) => setEditForm({ ...editForm, pesoNota: e.target.value as any })} 
                          placeholder="Ex: 35.5" 
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all text-right font-mono" 
                        />
                        <span className="text-sm font-bold text-muted-foreground">T</span>
                     </div>
                   </div>
                   <div className="md:col-span-2">
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome Comercial do Produto</label>
                     <input 
                       value={editForm.produto || ""} 
                       onChange={(e) => setEditForm({ ...editForm, produto: e.target.value })} 
                       placeholder="Ex: Ácido Sulfúrico 98%" 
                       className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                     />
                   </div>
                 </div>
                 
                 <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                       <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />
                       Classificação de Risco (Periculosidade)
                    </label>
                    <select 
                       value={editForm.periculosidade || "Nenhuma"} 
                       onChange={(e) => setEditForm({ ...editForm, periculosidade: e.target.value as any })} 
                       className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    >
                       <option value="Nenhuma">Carga Seca / Sem Risco Declarado</option>
                       <option value="Baixa">Risco Baixo (Atenção Padrão)</option>
                       <option value="Média">Risco Médio (EPI Específico)</option>
                       <option value="Alta">Risco Alto (Isolamento de Pátio)</option>
                       <option value="Crítica">Risco Crítico (Prioridade de Manobra)</option>
                    </select>
                 </div>
              </div>

              {/* Bloco 3: Motorista */}
              <div className="bg-secondary/10 p-4 rounded-xl border border-border/40 space-y-4">
                 <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Segurança & Identificação</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome Completo do Motorista</label>
                     <input 
                       value={editForm.motorista} 
                       onChange={(e) => setEditForm({ ...editForm, motorista: e.target.value })} 
                       className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                     />
                   </div>
                    <div>
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CPF Registrado</label>
                     <input 
                       value={editForm.cpf} 
                       onChange={(e) => setEditForm({ ...editForm, cpf: maskCPF(e.target.value) })} 
                       placeholder="000.000.000-00" 
                       className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                     />
                   </div>
                 </div>
                 <div>
                   <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Número Celular (WhatsApp)</label>
                   <input 
                     value={editForm.telefone} 
                     onChange={(e) => setEditForm({ ...editForm, telefone: maskPhone(e.target.value) })} 
                     placeholder="(11) 99999-0000" 
                     className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                   />
                 </div>
              </div>
              
              <button 
                onClick={handleEditSubmit} 
                className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Salvar Alterações Permanentemente
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL REMARCAR ATRASADO / ATUALIZAR DADOS (NOVO: ESPELHO DO CRIAR) */}
      <Dialog open={remarcarModalOpen} onOpenChange={setRemarcarModalOpen}>
        <DialogContent className="glass-panel border-border max-w-2xl">
          <DialogHeader><DialogTitle className="text-foreground flex items-center gap-2"><Clock className="h-5 w-5 text-destructive"/> Tratar Atraso & Remarcar Slot</DialogTitle></DialogHeader>
          {remarcarForm && (
            <div className="space-y-5 mt-4 h-[65vh] overflow-y-auto pr-3 custom-scrollbar">
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                 <p className="text-xs text-destructive font-medium leading-relaxed">
                   Este veículo não compareceu na janela original. Atualize as informações abaixo para que ele retorne à fila da Torre de Controle.
                 </p>
              </div>

              {/* Bloco 1: Logística Base */}
              <div className="bg-secondary/10 p-4 rounded-xl border border-border/40 space-y-4">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Escopo da Operação</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nova Data *</label>
                    <input 
                      type="date" 
                      value={remarcarForm.data} 
                      onChange={(e) => setRemarcarForm({ ...remarcarForm, data: e.target.value })} 
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Novo Horário *</label>
                    <input 
                      type="time" 
                      value={remarcarForm.hora} 
                      onChange={(e) => setRemarcarForm({ ...remarcarForm, hora: e.target.value })} 
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transportadora *</label>
                    <input 
                      value={remarcarForm.transportadora} 
                      onChange={(e) => setRemarcarForm({ ...remarcarForm, transportadora: e.target.value })} 
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Placa Identificadora *</label>
                    <input 
                      value={remarcarForm.placa} 
                      onChange={(e) => setRemarcarForm({ ...remarcarForm, placa: maskPlaca(e.target.value) })} 
                      maxLength={8} 
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary uppercase transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo Operação</label>
                    <select 
                      value={remarcarForm.tipo} 
                      onChange={(e) => setRemarcarForm({ ...remarcarForm, tipo: e.target.value })} 
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    >
                      <option>Carga</option>
                      <option>Descarga</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Doca Remanejada</label>
                    <select 
                      value={remarcarForm.doca || ""} 
                      onChange={(e) => setRemarcarForm({ ...remarcarForm, doca: e.target.value ? parseInt(e.target.value) : null })} 
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    >
                      <option value="">A definir na chegada real</option>
                      {Array.from({ length: configDocas.total }, (_, i) => <option key={i + 1} value={i + 1}>Slot Doca {i + 1}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bloco 2: Produto e Integração Torre */}
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-4">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Características Físicas da Carga</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Volume (NF)</label>
                     <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="number"
                          step="0.01"
                          value={remarcarForm.pesoNota || ""} 
                          onChange={(e) => setRemarcarForm({ ...remarcarForm, pesoNota: e.target.value as any })} 
                          placeholder="0.00" 
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary transition-all font-mono" 
                        />
                        <span className="text-sm font-bold text-muted-foreground">T</span>
                     </div>
                  </div>
                  <div className="md:col-span-2">
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Identificação do Produto</label>
                     <input 
                        value={remarcarForm.produto || ""} 
                        onChange={(e) => setRemarcarForm({ ...remarcarForm, produto: e.target.value })} 
                        placeholder="Ex: Minério, Ácido, Carga Seca" 
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                     />
                  </div>
                </div>
                <div>
                   <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3 text-orange-500" /> Nível de Periculosidade
                   </label>
                   <select 
                      value={remarcarForm.periculosidade || "Nenhuma"} 
                      onChange={(e) => setRemarcarForm({ ...remarcarForm, periculosidade: e.target.value as any })} 
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                   >
                      <option value="Nenhuma">Nenhum (Padrão/Comum)</option>
                      <option value="Baixa">Risco Baixo (Observação Básica)</option>
                      <option value="Média">Risco Médio (Manuseio Controlado)</option>
                      <option value="Alta">Risco Alto (Afastamento Restrito)</option>
                      <option value="Crítica">Risco Crítico (Protocolo Máximo / Isolamento)</option>
                   </select>
                </div>
              </div>

              {/* Bloco 3: Motorista */}
              <div className="bg-secondary/10 p-4 rounded-xl border border-border/40 space-y-4">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Credenciais de Acesso</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Motorista Titular</label>
                    <input 
                      value={remarcarForm.motorista} 
                      onChange={(e) => setRemarcarForm({ ...remarcarForm, motorista: e.target.value })} 
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                    />
                  </div>
                   <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CPF Titular</label>
                    <input 
                      value={remarcarForm.cpf} 
                      onChange={(e) => setRemarcarForm({ ...remarcarForm, cpf: maskCPF(e.target.value) })} 
                      placeholder="000.000.000-00" 
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                    />
                  </div>
                </div>
                <div>
                   <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Telefone (WhatsApp)</label>
                   <input 
                     value={remarcarForm.telefone} 
                     onChange={(e) => setRemarcarForm({ ...remarcarForm, telefone: maskPhone(e.target.value) })} 
                     placeholder="(00) 00000-0000" 
                     className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                   />
                </div>
              </div>

              <button 
                onClick={handleRemarcarSubmit} 
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg"
              >
                Confirmar Reagendamento & Remover Falta
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================== */}
      {/* KPIS DE TORRE DE CONTROLE & GARGALOS */}
      {/* ========================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Novos KPIs Financeiros / Torre */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-4 animate-fade-in relative overflow-hidden bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 text-primary font-bold mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Volume Carga/Descarga Hoje</span>
          </div>
          <p className="text-3xl font-bold font-mono text-foreground mt-2">{volumeTotalProcessado.toFixed(2)} <span className="text-sm font-sans text-muted-foreground font-normal">Toneladas</span></p>
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
             <Scale className="w-24 h-24" />
          </div>
        </div>

        <div className={`glass-panel rounded-xl p-4 animate-fade-in relative overflow-hidden ${contagemGargalos > 0 ? 'bg-destructive/10 border-destructive/30' : ''}`}>
          <div className={`flex items-center gap-2 mb-1 ${contagemGargalos > 0 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Gargalos Pátio</span>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground mt-2">{contagemGargalos} <span className="text-xs font-sans text-muted-foreground font-normal">Veículos (&gt;{configDocas.metaSlaEspera}m)</span></p>
        </div>

        {/* KPIs Tradicionais */}
        {[
          { label: "Aguardando", value: String(agendamentos.filter(a => a.status === "aguardando").length), icon: Clock },
          { label: "Operando Doca", value: String(agendamentos.filter(a => a.status === "carregando" || a.status === "descarregando").length), icon: ArrowRight },
          { label: "Finalizados", value: String(concluidos.length), icon: CheckCircle2 },
        ].map((s) => (
          <div key={s.label} className="glass-panel rounded-xl p-4 animate-fade-in flex flex-col justify-between">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <s.icon className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider truncate">{s.label}</span>
            </div>
            <p className="text-2xl font-bold font-mono text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ÁREA PRINCIPAL: LISTAS OPERACIONAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* LISTA AGENDADOS */}
        <GlassCard 
          title="Fila de Previsão Diária" 
          subtitle="Agendamentos futuros e atrasos pendentes" 
          action={
            <div className="flex items-center gap-2">
               <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Filtrar por placa ou motorista..." 
                    value={searchAgendados} 
                    onChange={(e) => setSearchAgendados(e.target.value)} 
                    className="w-40 lg:w-48 rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                  />
               </div>
               <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                 <DialogTrigger asChild>
                   <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1 shadow-md shadow-primary/20">
                     <Plus className="h-3.5 w-3.5" /> Adicionar Slot
                   </button>
                 </DialogTrigger>
                 <DialogContent className="glass-panel border-border max-w-2xl">
                   <DialogHeader><DialogTitle className="text-foreground flex items-center gap-2"><Calendar className="h-5 w-5 text-primary"/> Novo Agendamento de Pátio</DialogTitle></DialogHeader>
                    <div className="space-y-5 mt-4 h-[65vh] overflow-y-auto pr-3 custom-scrollbar">
                      
                      {/* Bloco Logística Novo */}
                      <div className="bg-secondary/10 p-4 rounded-xl border border-border/40 space-y-4">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Escopo da Operação</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data Desejada *</label>
                             <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
                          </div>
                          <div>
                             <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Horário Previsto *</label>
                             <input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome Transportadora *</label>
                             <input value={form.transportadora} onChange={(e) => setForm({ ...form, transportadora: e.target.value })} placeholder="Ex: Logística SA" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
                          </div>
                          <div>
                             <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Placa Veículo *</label>
                             <input value={form.placa} onChange={(e) => setForm({ ...form, placa: maskPlaca(e.target.value) })} maxLength={8} placeholder="ABC-1234" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary uppercase transition-all" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Modalidade</label>
                              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"><option>Carga</option><option>Descarga</option></select>
                           </div>
                          <div>
                             <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pré-reserva Doca</label>
                             <select value={form.doca} onChange={(e) => setForm({ ...form, doca: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"><option value="">Alocação Dinâmica</option>{Array.from({ length: configDocas.total }, (_, i) => <option key={i + 1} value={i + 1}>Doca Numérica {i + 1}</option>)}</select>
                          </div>
                        </div>
                      </div>

                      {/* Bloco Volume Novo */}
                      <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-4">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Características Físicas da Carga</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-1">
                             <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Peso NF Estimado</label>
                             <div className="flex items-center gap-2 mt-1">
                                <input type="number" step="0.01" value={form.pesoNota} onChange={(e) => setForm({ ...form, pesoNota: e.target.value })} placeholder="0.00" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary transition-all font-mono" />
                                <span className="text-sm font-bold text-muted-foreground">T</span>
                             </div>
                          </div>
                          <div className="md:col-span-2">
                             <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Identificação do Produto</label>
                             <input value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })} placeholder="Ex: Minério, Ácido, Carga Seca" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
                          </div>
                        </div>
                        <div>
                           <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              <ShieldAlert className="h-3 w-3 text-orange-500" /> Nível de Periculosidade e Risco Operacional
                           </label>
                           <select value={form.periculosidade} onChange={(e) => setForm({ ...form, periculosidade: e.target.value as any })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all">
                              <option value="Nenhuma">Nenhum (Padrão/Comum)</option>
                              <option value="Baixa">Risco Baixo (Observação Básica)</option>
                              <option value="Média">Risco Médio (Manuseio Controlado)</option>
                              <option value="Alta">Risco Alto (Afastamento Restrito)</option>
                              <option value="Crítica">Risco Crítico (Protocolo Máximo / Isolamento)</option>
                           </select>
                        </div>
                      </div>

                      {/* Bloco Motorista Novo */}
                      <div className="bg-secondary/10 p-4 rounded-xl border border-border/40 space-y-4">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Credenciais de Acesso</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Motorista</label><input value={form.motorista} onChange={(e) => setForm({ ...form, motorista: e.target.value })} placeholder="Nome do Condutor" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" /></div>
                          <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Documento (CPF)</label><input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })} placeholder="000.000.000-00" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" /></div>
                        </div>
                        <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Telefone Ativo (WhatsApp)</label><input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all" /></div>
                      </div>

                      <button onClick={handleCreate} className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg">Confirmar Novo Agendamento Sistêmico</button>
                    </div>
                 </DialogContent>
               </Dialog>
               <button onClick={exportFila} className="p-1.5 rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border shadow-sm" title="Exportar Relatório de Fila Diária"><Download className="h-4 w-4" /></button>
            </div>
          }
        >
          <div className="mt-4 space-y-2 h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredAgendados.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 opacity-50">
                 <Calendar className="h-8 w-8 mb-2" />
                 <p className="text-sm text-muted-foreground text-center">Nenhum agendamento futuro no funil hoje.</p>
              </div>
            )}
            
            {filteredAgendados.map((a) => (
              <div key={a.id} className="flex items-start gap-4 py-3 px-3 border border-border/30 bg-secondary/5 hover:bg-secondary/20 rounded-xl transition-colors shadow-sm">
                
                <div className="w-16 shrink-0 text-center border-r border-border/30 pr-3">
                  <span className="block text-sm font-mono text-primary font-extrabold">{a.hora}</span>
                  <span className="block text-[10px] text-muted-foreground font-medium mt-1 uppercase">{format(new Date(a.data), 'dd/MMM')}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-foreground truncate">{a.placa}</p>
                    <Badge variant={statusMap[a.status].variant} className={`text-[9px] px-1.5 py-0 h-4 uppercase tracking-wider font-bold ${statusMap[a.status].colorClass || ""}`}>
                       {statusMap[a.status].label}
                    </Badge>
                    {renderPericulosidadeBadge(a.periculosidade)}
                  </div>
                  
                  <p className="text-xs text-muted-foreground truncate">
                     {a.transportadora} • <span className="font-semibold">{a.tipo}</span> 
                     {a.pesoNota ? ` • ${a.pesoNota}t` : ""} 
                     {a.produto ? ` (${a.produto})` : ""}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-1">
                    {(a.motorista || a.cpf) ? (
                       <p className="text-[10px] text-muted-foreground/80 truncate flex items-center gap-1"><UserIcon className="h-3 w-3"/> {a.motorista || 'Nome Indisponível'} {a.cpf ? `[${a.cpf}]` : ''}</p>
                    ) : (
                       <p className="text-[10px] text-muted-foreground/50 italic flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5"/> Condutor Não Designado</p>
                    )}
                  </div>

                  {a.status === "atrasado" && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-border/20">
                      {a.telefone && (
                        <button onClick={() => handleDirectWhatsAppContact(a.telefone)} className="flex items-center gap-1.5 text-[10px] text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2 py-1.5 rounded-md font-bold">
                          <PhoneCall className="h-3 w-3" /> Falar com Condutor
                        </button>
                      )}
                      <button onClick={() => { setRemarcarForm({ ...a }); setRemarcarModalOpen(true); }} className="flex items-center gap-1.5 text-[10px] text-destructive hover:text-destructive/80 transition-colors bg-destructive/10 border border-destructive/20 px-2 py-1.5 rounded-md font-bold">
                        <Clock className="h-3 w-3" /> Reprogramar Atraso
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0 items-end justify-between h-full">
                   <div className="flex items-center gap-1 bg-background p-1 rounded-md border border-border shadow-inner">
                    <select 
                       value={a.status} 
                       onChange={(e) => handleUpdateStatus(a.id, e.target.value as Agendamento["status"])} 
                       className="text-[10px] font-bold uppercase tracking-wider bg-transparent text-foreground outline-none cursor-pointer px-1"
                    >
                      <option value="agendado">Status: Agendado</option>
                      <option value="aguardando" className="text-blue-500 font-bold">Dar Check-In Pátio</option>
                      <option value="atrasado" className="text-destructive font-bold">Apurar Falta/Atraso</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-auto">
                     <button onClick={() => openDetailsModal(a)} className="p-1.5 rounded-md bg-secondary/50 hover:bg-primary/20 hover:text-primary text-muted-foreground transition-all" title="Analisar Detalhes"><Eye className="h-3.5 w-3.5" /></button>
                    <button onClick={() => openEditModal(a)} className="p-1.5 rounded-md bg-secondary/50 hover:bg-primary/20 hover:text-primary text-muted-foreground transition-all" title="Editar Parametros"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleShare(a)} className="p-1.5 rounded-md bg-secondary/50 hover:bg-emerald-500/20 hover:text-emerald-500 text-muted-foreground transition-all" title="Gerar Token/Share"><Share2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => requestDelete(a.id)} className="p-1.5 rounded-md bg-secondary/50 hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-all" title="Excluir Definitivo"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* FILA PÁTIO EM TEMPO REAL COM LEITURA DE SLA E BALANÇA */}
        <GlassCard 
          title="Pátio & Manobra (Live)" 
          subtitle="Veículos internalizados na planta (Painel SLA)"
        >
          <div className="mt-4 space-y-3 h-[450px] overflow-y-auto pr-2 custom-scrollbar">
             {filaAtiva.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 opacity-50">
                  <Truck className="h-8 w-8 mb-2" />
                  <p className="text-sm text-muted-foreground text-center">Nenhum veículo aguardando no pátio.</p>
               </div>
             )}
             
            {filaAtiva.map((a) => {
               const isSLA = checkSlaViolado(a.horaCheckIn) && a.status === 'aguardando';
               
               return (
                <div key={a.id} className={`flex flex-col gap-3 py-3 px-3 border rounded-xl transition-all shadow-sm ${isSLA ? 'bg-destructive/5 border-destructive/30' : 'bg-secondary/5 border-border/30 hover:bg-secondary/20'}`}>
                  
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className={`text-sm font-mono font-bold ${isSLA ? 'text-destructive' : 'text-foreground'}`}>{a.placa}</p>
                        <Badge variant={statusMap[a.status].variant} className={`text-[9px] px-1.5 py-0 h-4 font-bold uppercase ${statusMap[a.status].colorClass || ""}`}>
                           {statusMap[a.status].label}
                        </Badge>
                        {renderPericulosidadeBadge(a.periculosidade)}
                      </div>
                      
                      <p className="text-xs text-muted-foreground leading-relaxed">
                         {a.transportadora} • <span className="font-semibold">{a.tipo}</span>
                         <br/>
                         {a.produto && <span className="text-[10px] text-primary font-bold mt-0.5 inline-block">{a.produto}</span>}
                      </p>

                      {/* Gestão de SLA */}
                      <div className="mt-2 pt-2 border-t border-border/20 flex flex-wrap items-center gap-3">
                         <div className="text-[10px] text-muted-foreground/80 font-mono flex items-center gap-1">
                           <Clock className="h-3 w-3" /> Check-in Pátio: <strong className="text-foreground">{a.horaCheckIn || "N/A"}</strong>
                         </div>
                         {isSLA && (
                            <div className="flex items-center gap-1 text-destructive text-[10px] font-bold animate-pulse bg-destructive/10 px-2 py-0.5 rounded">
                              <AlertCircle className="h-3 w-3" /> GARGALO (&gt; {configDocas.metaSlaEspera}m)
                            </div>
                         )}
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0 min-w-[100px]">
                       <div className="flex flex-col items-end gap-1 mb-2">
                         <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Atribuição Doca</span>
                         <select 
                            value={a.doca || ""} 
                            onChange={(e) => {
                               const val = e.target.value; 
                               const newDoca = val ? parseInt(val) : null;
                               if (newDoca && !isSlotAvailable(a.data, a.hora, newDoca, a.id)) { 
                                  toast.error(`A Doca ${newDoca} está alocada para outro veículo neste momento.`); 
                                  return; 
                               }
                               setAgendamentos(prev => prev.map(item => item.id === a.id ? { ...item, doca: newDoca } : item));
                            }} 
                            className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 rounded px-2 py-1 outline-none w-24 text-center cursor-pointer hover:bg-primary/20 transition-colors"
                         >
                            <option value="">Avisar Painel</option>
                            {Array.from({ length: configDocas.total }, (_, i) => <option key={i + 1} value={i + 1}>Doca {i + 1}</option>)}
                         </select>
                       </div>

                       {/* Peso Leitura Rapida */}
                       {a.pesoNota && !a.pesoBalanca && (
                          <p className="text-[10px] text-muted-foreground mt-2">Previsto NF: <strong>{a.pesoNota}t</strong></p>
                       )}
                       {a.pesoBalanca && (
                          <p className="text-[10px] text-emerald-500 mt-2 flex items-center justify-end gap-1">
                             <Scale className="h-3 w-3"/> Aferido: <strong>{a.pesoBalanca}t</strong>
                          </p>
                       )}
                    </div>
                  </div>
                  
                  {/* Painel de Controle de Manobra */}
                  <div className="flex gap-2 mt-2 bg-background p-1.5 rounded-lg border border-border shadow-inner">
                    <button 
                       onClick={() => handleUpdateStatus(a.id, "aguardando")} 
                       className={`flex-1 text-[10px] py-1.5 rounded transition-colors font-bold uppercase tracking-wider ${a.status === 'aguardando' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'}`}
                    >
                       Aguardando
                    </button>
                    
                    <button 
                       onClick={() => handleUpdateStatus(a.id, a.tipo === "Carga" ? "carregando" : "descarregando")} 
                       className={`flex-1 text-[10px] py-1.5 rounded transition-colors font-bold uppercase tracking-wider ${['carregando', 'descarregando'].includes(a.status) ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30' : 'text-muted-foreground hover:bg-secondary/50'}`}
                    >
                       Em Operação
                    </button>

                    <button 
                       onClick={() => {
                          setPesagemForm({ id: a.id, placa: a.placa, pesoBalanca: a.pesoBalanca ? String(a.pesoBalanca) : "" });
                          setPesagemAvulsaOpen(true);
                       }} 
                       className="flex-none px-2 text-[10px] py-1.5 rounded transition-colors font-bold text-blue-500 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20"
                       title="Aferir Peso na Balança sem dar saída"
                    >
                       <Scale className="h-4 w-4" />
                    </button>

                    <button 
                       onClick={() => handleUpdateStatus(a.id, "concluido")} 
                       className="flex-1 text-[10px] py-1.5 rounded transition-all font-bold uppercase tracking-wider text-emerald-500 hover:bg-emerald-500 hover:text-white shadow-sm border border-emerald-500/30"
                    >
                       Concluir & Liberar
                    </button>
                  </div>
                </div>
               );
            })}
          </div>
        </GlassCard>

        {/* NOVA ÁREA: CONCLUÍDOS / TORRE DE CONTROLE (YIELD) */}
        <GlassCard 
          title="Histórico Operacional (Yield de Balança)"
          subtitle="Consolidação de Veículos Despachados Hoje" 
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-4">
              {concluidosExpanded && (
                 <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Buscar auditoria..." 
                      value={searchConcluidos} 
                      onChange={(e) => setSearchConcluidos(e.target.value)} 
                      className="w-48 rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm" 
                    />
                 </div>
              )}
              <button onClick={exportYield} className="p-1.5 rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border shadow-sm" title="Exportar Relatório Final de Yield"><Download className="h-4 w-4" /></button>
              <button 
                 onClick={() => setConcluidosExpanded(!concluidosExpanded)} 
                 className="flex items-center gap-2 hover:bg-secondary/50 p-1.5 rounded-md transition-colors text-sm font-medium text-foreground"
              >
                {concluidosExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </div>
          }
        >
          {concluidosExpanded && (
            <div className="mt-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar animate-fade-in">
              {filteredConcluidos.length === 0 && (
                 <p className="text-sm text-muted-foreground text-center py-8">O funil de saídas e métricas de balança está vazio no momento.</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredConcluidos.map((a) => (
                  <div key={a.id} className="flex flex-col py-4 px-4 border border-border/40 bg-background/40 hover:bg-secondary/10 rounded-xl shadow-sm transition-all relative">
                    
                    {/* Botão Exportar Ticket Rápido no Card */}
                    <button 
                      onClick={() => handleImprimirTicket(a)} 
                      className="absolute top-3 right-3 text-muted-foreground hover:text-primary transition-colors bg-background border border-border p-1 rounded-md shadow-sm"
                      title="Imprimir Ticket"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-center justify-between mb-2 pr-8">
                       <p className="text-base font-mono font-bold text-foreground flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500"/>
                          {a.placa}
                       </p>
                       <Badge variant={statusMap[a.status].variant} className={`text-[9px] px-1.5 py-0 h-4 font-bold uppercase ${statusMap[a.status].colorClass || ""}`}>
                          {statusMap[a.status].label}
                       </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground leading-relaxed">{a.transportadora} • <strong className="text-foreground">{a.tipo}</strong></p>
                    
                    {/* Sumário de Volume Final */}
                    <div className="mt-3 bg-secondary/20 p-2 rounded border border-border/50 grid grid-cols-2 gap-2">
                       <div>
                          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Esperado (NF)</p>
                          <p className="text-xs font-mono font-bold">{a.pesoNota ? `${a.pesoNota}t` : "N/I"}</p>
                       </div>
                       <div className="text-right border-l border-border/50 pl-2">
                          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Consolidado</p>
                          <p className="text-xs font-mono font-bold text-emerald-500">{a.pesoBalanca ? `${a.pesoBalanca}t` : "N/I"}</p>
                       </div>
                       <div className="col-span-2 pt-1 mt-1 border-t border-border/50 text-right">
                          {renderDivergencia(a.pesoNota, a.pesoBalanca)}
                       </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
                       <button onClick={() => openDetailsModal(a)} className="text-[10px] text-primary hover:bg-primary/10 px-2 py-1 rounded font-bold transition-colors flex items-center gap-1">
                          <Eye className="h-3 w-3"/> Analisar Histórico
                       </button>
                       <button onClick={() => requestDelete(a.id)} className="text-[10px] text-destructive hover:bg-destructive/10 px-2 py-1 rounded font-bold transition-colors flex items-center gap-1">
                          <Trash2 className="h-3 w-3"/> Descartar Dado
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

// Ícone auxiliar genérico
function UserIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className || "lucide lucide-user w-4 h-4"}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default PatioLogistica;