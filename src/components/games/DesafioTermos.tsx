import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, RefreshCw, CheckCircle2, XCircle, Zap, Sparkles } from "lucide-react"; // Zap for Combo
import { gameService } from "@/services/gameService";
import { formatNumber, cn } from "@/lib/utils";
import { GameHelp } from "./GameHelp";


interface Props {
    onBack: () => void;
    user?: any;
}


interface TermContent {
    term: string;
    definition: string;
}

interface GameItem {
    id: string; // "term-1" or "def-1"
    originalId: number;
    text: string;
    type: 'term' | 'def';
}

// Cores mais vibrantes e modernas para os matches
const MATCH_STYLES = [
    { bg: "bg-emerald-500/20", border: "border-emerald-500/50", text: "text-emerald-300", glow: "shadow-[0_0_30px_rgba(16,185,129,0.3)]" },
    { bg: "bg-blue-500/20", border: "border-blue-500/50", text: "text-blue-300", glow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]" },
    { bg: "bg-purple-500/20", border: "border-purple-500/50", text: "text-purple-300", glow: "shadow-[0_0_30px_rgba(168,85,247,0.3)]" },
    { bg: "bg-amber-500/20", border: "border-amber-500/50", text: "text-amber-300", glow: "shadow-[0_0_30px_rgba(245,158,11,0.3)]" },
    { bg: "bg-pink-500/20", border: "border-pink-500/50", text: "text-pink-300", glow: "shadow-[0_0_30px_rgba(236,72,153,0.3)]" },
];

export const DesafioTermos = ({ onBack, user }: Props) => {

    const [items, setItems] = useState<{ terms: GameItem[], defs: GameItem[] }>({ terms: [], defs: [] });
    const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
    const [selectedDef, setSelectedDef] = useState<string | null>(null);
    const [matchedIds, setMatchedIds] = useState<number[]>([]);
    const [matchedColors, setMatchedColors] = useState<Record<number, number>>({});
    const [mismatchPairs, setMismatchPairs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(60);
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [xpSaved, setXpSaved] = useState(false);
    const [combo, setCombo] = useState(0); // Combo multiplier
    const [maxCombo, setMaxCombo] = useState(0);

    const scoreRef = useRef(0);
    const xpSavedRef = useRef(false);

    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    useEffect(() => {
        xpSavedRef.current = xpSaved;
    }, [xpSaved]);

    useEffect(() => {
        loadGame();
    }, []);

    useEffect(() => {
        let timer: any;
        if (isPlaying && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsPlaying(false);
        }
        return () => clearInterval(timer);
    }, [isPlaying, timeLeft]);

    const isGameOver = timeLeft === 0 || (items.terms.length > 0 && matchedIds.length === items.terms.length);

    useEffect(() => {
        if (!isPlaying && isGameOver && score > 0 && !xpSaved) {
            if (user) {
                gameService.addUserXP(user.id, score);
            }

            setXpSaved(true);
        }
    }, [isPlaying, isGameOver, score, xpSaved]);

    useEffect(() => {
        if (selectedTerm && selectedDef) {
            const termId = parseInt(selectedTerm.split('-')[1]);
            const defId = parseInt(selectedDef.split('-')[1]);

            if (termId === defId) {
                // MATCH!
                const colorIndex = matchedIds.length % MATCH_STYLES.length;
                setMatchedColors(prev => ({ ...prev, [termId]: colorIndex }));
                setMatchedIds(prev => [...prev, termId]);

                // Score Calculation: Base 15 + Time Bonus + Combo Bonus
                const basePoints = 15;
                const timeBonus = Math.floor(timeLeft / 3);
                const comboBonus = combo * 5;

                setScore(s => s + basePoints + timeBonus + comboBonus);
                setCombo(c => {
                    const newCombo = c + 1;
                    if (newCombo > maxCombo) setMaxCombo(newCombo);
                    return newCombo;
                });

                setSelectedTerm(null);
                setSelectedDef(null);

                const stats = JSON.parse(localStorage.getItem('termoStats') || '{"totalMatched":0,"bestTimeLeft":0}');
                stats.totalMatched += 1;
                localStorage.setItem('termoStats', JSON.stringify(stats));

                if (matchedIds.length + 1 === items.terms.length) {
                    setIsPlaying(false); // Victory
                    if (timeLeft > stats.bestTimeLeft) {
                        stats.bestTimeLeft = timeLeft;
                        localStorage.setItem('termoStats', JSON.stringify(stats));
                    }
                }
            } else {
                // MISMATCH
                if (navigator.vibrate) navigator.vibrate(200);

                setMismatchPairs([selectedTerm, selectedDef]);
                setCombo(0); // Reset combo
                setScore(s => Math.max(0, s - 5)); // Penalty for wrong guess

                const t = setTimeout(() => {
                    setMismatchPairs([]);
                    setSelectedTerm(null);
                    setSelectedDef(null);
                }, 600);
                return () => clearTimeout(t);
            }
        }
    }, [selectedTerm, selectedDef, matchedIds.length, items.terms.length, timeLeft]);

    const loadGame = async () => {
        setIsLoading(true);
        try {
            const data = await gameService.getTermPairs();
            // Select 6 pairs for better grid layout (2x3 or 3x2)
            const selected = data.sort(() => Math.random() - 0.5).slice(0, 6);

            const terms: GameItem[] = selected.map(q => ({
                id: `term-${q.id}`,
                originalId: q.id,
                text: (q.content as TermContent).term,
                type: 'term' as const
            })).sort(() => Math.random() - 0.5);

            const defs: GameItem[] = selected.map(q => ({
                id: `def-${q.id}`,
                originalId: q.id,
                text: (q.content as TermContent).definition,
                type: 'def' as const
            })).sort(() => Math.random() - 0.5);

            setItems({ terms, defs });
            setMatchedIds([]);
            setMatchedColors({});
            setScore(0);
            setTimeLeft(60);
            setCombo(0);
            setIsPlaying(true);
            setSelectedTerm(null);
            setSelectedDef(null);
            setXpSaved(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col h-full min-h-[500px] items-center justify-center text-white">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4" />
                <p className="animate-pulse">Sorteando desafios...</p>
            </div>
        );
    }

    if (isGameOver && !isPlaying) {
        const isWin = matchedIds.length === items.terms.length;
        return (
            <div className="flex flex-col h-full min-h-[500px] items-center justify-center text-center p-6 text-white animate-in zoom-in duration-300">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl ${isWin ? 'bg-emerald-500/20 text-emerald-400 border-4 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-4 border-red-500/30'}`}>
                    {isWin ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                </div>

                <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    {isWin ? "Mestre dos Termos!" : "Tempo Esgotado!"}
                </h2>

                {isWin && maxCombo > 1 && (
                    <div className="mb-6 flex items-center gap-2 justify-center text-amber-400 font-bold bg-amber-400/10 px-4 py-1 rounded-full border border-amber-400/20">
                        <Zap className="w-4 h-4 fill-current" />
                        Maior Combo: x{maxCombo}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-xs">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <p className="text-xs text-muted-foreground uppercase font-bold">XP Ganho</p>
                        <p className="text-2xl font-black text-primary">+{formatNumber(score)}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <p className="text-xs text-muted-foreground uppercase font-bold">Acertos</p>
                        <p className="text-2xl font-black text-white">{matchedIds.length}/{items.terms.length}</p>
                    </div>
                </div>

                <div className="flex gap-4 w-full max-w-sm">
                    <Button onClick={loadGame} className="flex-1 gap-2 h-12 text-lg shadow-lg shadow-primary/20" size="lg">
                        <RefreshCw className="w-5 h-5" /> Jogar Novamente
                    </Button>
                    <Button onClick={onBack} variant="outline" size="lg" className="flex-1 h-12 border-white/20 hover:bg-white/10">
                        Sair
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-[600px] max-w-5xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={onBack} size="icon" className="text-white/70 hover:text-white hover:bg-white/10 rounded-full w-10 h-10">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="font-display font-bold text-xl text-white">Desafio dos Termos</h2>
                        <p className="text-xs text-muted-foreground hidden md:block">Conecte os conceitos corretamente</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Combo Indicator */}
                    <AnimatePresence>
                        {combo > 1 && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="hidden md:flex flex-col items-center mr-4"
                            >
                                <span className="text-amber-400 text-2xl font-black italic flex items-center gap-1 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                    <Zap className="w-5 h-5 fill-current animate-pulse" /> x{combo}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-widest">Combo</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Timer */}
                    <div className={`relative flex items-center justify-center w-14 h-14 rounded-2xl border-2 transition-all shadow-lg ${timeLeft < 10
                            ? 'border-red-500 bg-red-500/20 text-red-500 shadow-red-500/20 animate-pulse'
                            : 'border-white/10 bg-slate-800 text-white shadow-black/20'
                        }`}>
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-bold font-mono leading-none">{timeLeft}</span>
                            <span className="text-[8px] uppercase font-bold opacity-60">Seg</span>
                        </div>
                        {/* Progress Ring could go here */}
                    </div>

                    {/* Score */}
                    <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl flex flex-col items-end min-w-[100px]">
                        <span className="text-[10px] uppercase font-bold text-primary/60">XP Total</span>
                        <span className="text-2xl font-black text-primary leading-none tabular-nums">{score}</span>
                    </div>
                </div>
            </div>

            {/* Game Board - Responsive Grid */}
            <div className="flex-1 grid grid-cols-2 gap-4 md:gap-8 lg:gap-12 relative">

                {/* Column Headers */}
                <div className="col-span-1 flex items-center justify-center mb-2 md:mb-0">
                    <div className="bg-slate-800/80 backdrop-blur px-4 py-1 rounded-full border border-white/5 text-xs font-bold uppercase tracking-widest text-slate-400 shadow-sm">
                        Termos
                    </div>
                </div>
                <div className="col-span-1 flex items-center justify-center mb-2 md:mb-0">
                    <div className="bg-slate-800/80 backdrop-blur px-4 py-1 rounded-full border border-white/5 text-xs font-bold uppercase tracking-widest text-slate-400 shadow-sm">
                        Definições
                    </div>
                </div>

                {/* Terms Column */}
                <div className="flex flex-col gap-3 md:gap-4">
                    {items.terms.map(term => {
                        const isMatched = matchedIds.includes(term.originalId);
                        const isSelected = selectedTerm === term.id;
                        const isMismatch = mismatchPairs.includes(term.id);
                        const colorIndex = matchedColors[term.originalId];
                        const matchStyle = isMatched && colorIndex !== undefined ? MATCH_STYLES[colorIndex] : null;

                        return (
                            <motion.button
                                key={term.id}
                                layoutId={term.id}
                                className={cn(
                                    "w-full p-4 md:p-6 rounded-2xl text-sm md:text-lg font-bold text-center transition-all relative border min-h-[80px] md:min-h-[100px] flex items-center justify-center backdrop-blur-md overflow-hidden group",
                                    isMatched && matchStyle
                                        ? `${matchStyle.bg} ${matchStyle.border} ${matchStyle.text} ${matchStyle.glow} opacity-50 grayscale-[0.5] scale-[0.98]`
                                        : isMismatch
                                            ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] shake" // Add shake class globally or animate in motion
                                            : isSelected
                                                ? "bg-primary text-white border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] scale-[1.02] z-10"
                                                : "bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/80 hover:border-white/20 hover:shadow-lg hover:-translate-y-0.5"
                                )}
                                onClick={() => !isMatched && isPlaying && setSelectedTerm(term.id)}
                                disabled={isMatched || !isPlaying}
                                animate={isMismatch ? { x: [-5, 5, -5, 5, 0] } : {}}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <span className="relative z-10">{term.text}</span>
                            </motion.button>
                        )
                    })}
                </div>

                {/* Definitions Column */}
                <div className="flex flex-col gap-3 md:gap-4">
                    {items.defs.map(def => {
                        const isMatched = matchedIds.includes(def.originalId);
                        const isSelected = selectedDef === def.id;
                        const isMismatch = mismatchPairs.includes(def.id);
                        const colorIndex = matchedColors[def.originalId];
                        const matchStyle = isMatched && colorIndex !== undefined ? MATCH_STYLES[colorIndex] : null;

                        return (
                            <motion.button
                                key={def.id}
                                layoutId={def.id}
                                className={cn(
                                    "w-full p-4 md:p-6 rounded-2xl text-xs md:text-base font-medium text-left transition-all relative border min-h-[80px] md:min-h-[100px] flex items-center backdrop-blur-md overflow-hidden group",
                                    isMatched && matchStyle
                                        ? `${matchStyle.bg} ${matchStyle.border} ${matchStyle.text} ${matchStyle.glow} opacity-50 grayscale-[0.5] scale-[0.98]`
                                        : isMismatch
                                            ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                                            : isSelected
                                                ? "bg-primary/20 border-primary text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] scale-[1.02] z-10"
                                                : "bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-700/80 hover:border-white/20 hover:shadow-lg hover:-translate-y-0.5"
                                )}
                                onClick={() => !isMatched && isPlaying && setSelectedDef(def.id)}
                                disabled={isMatched || !isPlaying}
                                animate={isMismatch ? { x: [-5, 5, -5, 5, 0] } : {}}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <span className="relative z-10">{def.text}</span>
                                {isMatched && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <CheckCircle2 className="w-5 h-5 opacity-50" />
                                    </div>
                                )}
                            </motion.button>
                        )
                    })}
                </div>
            </div>

            {/* Combo/Hint area or footer */}
            <div className="mt-4 text-center">
                <p className="text-xs text-white/30 italic">
                    Dica: Acertos consecutivos (Combo) multiplicam seus pontos!
                </p>
            </div>
        </div>
    );
};

