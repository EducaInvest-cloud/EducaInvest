import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Volume2,
  Lightbulb,
  Percent,
  TrendingUp,
  Landmark,
  BarChart3,
  ShieldCheck,
  Zap,
  Brain,
  Coins,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Termo } from "@/lib/termosData";

interface TermCardProps {
  term: Termo;
  hideLevel?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const getTermIcon = (t: Termo) => {
  if (!t || !t.nome) return Coins;
  const nome = t.nome.toLowerCase();
  if (nome.includes("reserva")) return ShieldCheck;
  if (nome.includes("liquidez")) return Zap;
  if (nome.includes("juros")) return TrendingUp;
  if (nome.includes("tesouro")) return Landmark;
  if (nome.includes("bolsa") || nome.includes("ações")) return BarChart3;

  switch (t.categoria) {
    case 'taxas': return Percent;
    case 'indicadores': return TrendingUp;
    case 'renda_fixa': return Landmark;
    case 'renda_variavel': return BarChart3;
    default: return Coins;
  }
};

export function TermCard({ term, hideLevel, isExpanded: controlledIsExpanded, onToggle }: TermCardProps) {
  const [localIsExpanded, setLocalIsExpanded] = useState(false);
  if (!term) return null;

  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : localIsExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setLocalIsExpanded(!localIsExpanded);
    }
  };

  const Icon = getTermIcon(term);

  const borderColor =
    term.nivelId === 'fundamentos' ? 'hover:border-emerald-500/40 hover:shadow-emerald-500/10' :
      term.nivelId === 'pratica' ? 'hover:border-amber-500/40 hover:shadow-amber-500/10' :
        'hover:border-rose-500/40 hover:shadow-rose-500/10';

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer",
        "bg-gradient-to-b from-slate-800/50 to-slate-900/80",
        "border border-white/5",
        borderColor,
        "hover:shadow-xl hover:-translate-y-1",
        isExpanded ? "ring-1 ring-primary/30 bg-slate-900/90 shadow-lg" : ""
      )}
      onClick={handleToggle}
    >
      <div className="flex items-start gap-4 p-5 relative z-10">
        <div className="shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-2.5 text-primary ring-1 ring-primary/20 group-hover:ring-primary/50 transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]">
          <Icon className="h-5 w-5" />
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-base font-bold leading-tight text-white group-hover:text-primary transition-colors">
              {term.nome}
            </h3>


          </div>

          {term.sigla && (
            <p className="text-xs font-bold text-primary/80 tracking-wider uppercase">{term.sigla}</p>
          )}

          <p className="text-sm text-muted-foreground line-clamp-2 font-medium leading-relaxed group-hover:text-slate-300 transition-colors">
            {term.explicacaoSimplificada}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-slate-950/30"
          >
            <div className="p-5 space-y-4 text-sm relative z-10">
              <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
                  <Lightbulb className="w-3.5 h-3.5" /> Explicação Técnica
                </h4>
                <p className="text-slate-300 leading-relaxed">{term.explicacaoCompleta}</p>
              </div>

              {term.exemplo && (
                <div className="rounded-xl bg-emerald-500/5 p-4 border border-emerald-500/10">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                    <Target className="w-3.5 h-3.5" /> Exemplo Prático
                  </span>
                  <p className="text-slate-300 italic">"{term.exemplo}"</p>
                </div>
              )}

              {term.dicaComoComecar && (
                <div className="rounded-xl bg-amber-500/5 p-4 border border-amber-500/10">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                    <Zap className="w-3.5 h-3.5" /> Dica de Ouro
                  </span>
                  <p className="text-slate-300">{term.dicaComoComecar}</p>
                </div>
              )}

              {term.audioUrl && (
                <div className="flex justify-end pt-2">
                  <Button variant="secondary" size="sm" className="h-8 text-xs gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/5">
                    <Volume2 className="w-3 h-3" /> Ouvir explicação
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "mt-auto flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-all border-t relative z-10",
          isExpanded
            ? "bg-primary/10 text-primary border-primary/20"
            : "bg-slate-950/30 text-muted-foreground border-white/5 group-hover:text-white group-hover:bg-slate-900/80"
        )}
      >
        <span>{isExpanded ? "Recolher detalhes" : "Ver mais detalhes"}</span>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </div>
    </div>
  );
}
