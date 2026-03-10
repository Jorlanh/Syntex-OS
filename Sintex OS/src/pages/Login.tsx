import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogIn, AlertCircle } from "lucide-react"; // Hexagon removido

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Preencha todos os campos.");
      return;
    }
    const success = login(email, password);
    if (success) {
      navigate("/");
    } else {
      setError("Credenciais inválidas.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Subtle glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          {/* Imagem da logo substituindo o ícone Hexagon */}
          <img 
            src="/SyntexOSL.png" 
            alt="Logo Syntex OS" 
            className="w-32 h-auto mb-4 object-contain" 
          />
          
          {/* Se a sua logo já possuir o texto, você pode remover ou ocultar as duas linhas abaixo */}
          <h1 className="text-xl font-bold tracking-wide text-foreground">SYNTEX OS</h1>
          <p className="text-xs text-muted-foreground tracking-widest mt-1">HUB DE AUTOMAÇÃO INDUSTRIAL</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="mt-1.5 w-full rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            Entrar
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 glass-panel rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Credenciais Demo</p>
          <div className="space-y-1.5 text-xs text-muted-foreground font-mono">
            <p>super@syntex.io / admin123 <span className="text-primary">(Super Admin)</span></p>
            <p>admin@quimicabr.com / admin123 <span className="text-primary">(Admin)</span></p>
            <p>user@quimicabr.com / user123 <span className="text-primary">(Usuário)</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;