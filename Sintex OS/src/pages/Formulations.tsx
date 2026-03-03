import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { FlaskConical, Send, Bot, User, Beaker, Star, StarOff, Save } from "lucide-react";
import { toast } from "sonner";

interface Suggestion {
  compound: string;
  cogs: string;
  efficacy: string;
  savings: string;
  favorited: boolean;
}

interface ChatMessage {
  role: "user" | "ai";
  message: string;
}

const initialSuggestions: Suggestion[] = [
  { compound: "Formulação A (Padrão)", cogs: "R$ 12.40/kg", efficacy: "92%", savings: "-", favorited: false },
  { compound: "Formulação B (Alternativa)", cogs: "R$ 9.80/kg", efficacy: "89%", savings: "↓ 21%", favorited: false },
  { compound: "Formulação C (Econômica)", cogs: "R$ 7.20/kg", efficacy: "84%", savings: "↓ 42%", favorited: false },
];

const Formulations = () => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: "user", message: "Buscar alternativas para formulação de detergente industrial base NaOH com custo menor." },
    { role: "ai", message: "Encontrei 3 formulações alternativas. A Formulação B substitui 30% do NaOH por KOH, reduzindo COGS em 21% com perda mínima de eficácia. Recomendo testes de bancada para validação." },
  ]);
  const [savedRecipes, setSavedRecipes] = useState<string[]>([]);

  const handleSend = () => {
    if (!input.trim()) return;
    setChatHistory([...chatHistory, { role: "user", message: input }]);
    setTimeout(() => {
      setChatHistory((prev) => [...prev, {
        role: "ai",
        message: `Analisando "${input}"... Encontrei 2 compostos alternativos com potencial de redução de 15-30% no COGS. Gero um comparativo detalhado? Considere avaliar substitutos para o surfactante aniônico principal.`,
      }]);
    }, 800);
    setInput("");
  };

  const handleFavorite = (index: number) => {
    setSuggestions(suggestions.map((s, i) => i === index ? { ...s, favorited: !s.favorited } : s));
    toast.success(suggestions[index].favorited ? "Removido dos favoritos." : "Adicionado aos favoritos!");
  };

  const handleSaveRecipe = (compound: string) => {
    if (savedRecipes.includes(compound)) return;
    setSavedRecipes([...savedRecipes, compound]);
    toast.success(`Receita "${compound}" salva na base da empresa!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">IA Generativa para Formulações</h1>
        <p className="text-sm text-muted-foreground mt-1">Motor de Machine Learning para compostos alternativos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard title="Assistente de Formulações" className="flex flex-col">
          <div className="mt-4 flex-1 space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "ai" && (
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`rounded-lg px-4 py-3 max-w-[85%] text-sm ${msg.role === "user" ? "bg-primary/10 text-foreground border border-primary/20" : "bg-secondary/40 text-foreground"}`}>
                  {msg.message}
                </div>
                {msg.role === "user" && (
                  <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Descreva a formulação desejada..."
              className="flex-1 rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={handleSend} className="rounded-lg bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 transition-colors">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </GlassCard>

        <GlassCard title="Compostos Sugeridos" subtitle="Comparativo de custo e eficácia">
          <div className="mt-4 space-y-3">
            {suggestions.map((s, i) => (
              <div key={i} className="rounded-lg border border-border/40 p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{s.compound}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleFavorite(i)} className="p-1 rounded hover:bg-secondary/40 transition-colors">
                      {s.favorited ? <Star className="h-4 w-4 text-warning fill-warning" /> : <Star className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <button onClick={() => handleSaveRecipe(s.compound)} className={`p-1 rounded hover:bg-secondary/40 transition-colors ${savedRecipes.includes(s.compound) ? "text-success" : "text-muted-foreground"}`}>
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">COGS</p>
                    <p className="font-mono font-medium text-foreground mt-0.5">{s.cogs}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Eficácia</p>
                    <p className="font-mono font-medium text-foreground mt-0.5">{s.efficacy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Economia</p>
                    <p className={`font-mono font-medium mt-0.5 ${s.savings !== "-" ? "text-success" : "text-muted-foreground"}`}>{s.savings}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {savedRecipes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/20">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Receitas Salvas</p>
              <div className="flex flex-wrap gap-2">
                {savedRecipes.map((r) => (
                  <span key={r} className="text-xs rounded-lg bg-success/10 text-success border border-success/20 px-2.5 py-1">{r}</span>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default Formulations;
