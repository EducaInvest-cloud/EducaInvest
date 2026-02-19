import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, ThumbsUp, ThumbsDown, AlertTriangle, TrendingUp, HelpCircle } from "lucide-react";
import { gameService, GameQuestion } from "@/services/gameService";
import { formatNumber } from "@/lib/utils";
import { GameHelp } from "./GameHelp";
import { useToast } from "@/hooks/use-toast";


interface Props {
    onBack: () => void;
    user?: any;
}

interface QuestionContent {
    text: string;
    type: 'good' | 'bad';
    explanation: string;
    icon?: string;
    leftLabel?: string;
    rightLabel?: string;
}

export const OConsultor = ({ onBack, user }: Props) => {
    const { toast } = useToast();


    const [questions, setQuestions] = useState<GameQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [currentXP, setCurrentXP] = useState(0); // New State: Tracks exact XP
    const [showFeedback, setShowFeedback] = useState(false);
    const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [direction, setDirection] = useState<'left' | 'right' | null>(null);
    const [xpSaved, setXpSaved] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);

    const scoreRef = useRef(0);
    const xpRef = useRef(0); // Ref for XP
    const xpSavedRef = useRef(false);

    // Sync refs with state
    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    useEffect(() => {
        xpRef.current = currentXP;
    }, [currentXP]);

    useEffect(() => {
        xpSavedRef.current = xpSaved;
    }, [xpSaved]);

    useEffect(() => {
        loadQuestions();
    }, []);

    useEffect(() => {
        if (currentIndex >= questions.length && questions.length > 0 && !xpSaved) {
            handleSaveXP();
        }
    }, [currentIndex, questions.length, xpSaved]);

    const handleSaveXP = () => {
        if (xpSaved || currentXP === 0) return;

        // Save Server (REAL)
        if (user) {
            gameService.addUserXP(user.id, currentXP);
        }

        setXpSaved(true);

        // Update Permanent Stats
        const stats = JSON.parse(localStorage.getItem('consultorStats') || '{"totalAnalyzed":0,"bestStreak":0}');
        stats.totalAnalyzed += score;
        localStorage.setItem('consultorStats', JSON.stringify(stats));
    };

    const handleExit = () => {
        handleSaveXP();
        onBack();
    };

    // Save on unmount removed
    useEffect(() => {
        return () => {
            // Handled by handleSaveXP
        };
    }, []);

    const loadQuestions = async () => {
        try {
            const data = await gameService.getConsultorQuestions();
            // Shuffle questions
            const shuffled = data.sort(() => Math.random() - 0.5);
            setQuestions(shuffled);
        } catch (error) {
            console.error("Failed to load questions", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwipe = (swipeDir: 'left' | 'right') => {
        if (showFeedback) return;


        setDirection(swipeDir);
        const currentQuestion = questions[currentIndex];
        const content = currentQuestion.content as QuestionContent;

        const isCorrect =
            (swipeDir === 'left' && content.type === 'bad') ||
            (swipeDir === 'right' && content.type === 'good');

        setLastAnswerCorrect(isCorrect);
        if (isCorrect) {
            setScore(s => s + 1);

            // XP Calculation Logic
            // Base: 20 XP
            // Streak Bonus: +10 XP if streak > 0
            setCurrentStreak(s => {
                const newStreak = s + 1;
                const bonus = s > 0 ? 10 : 0;
                setCurrentXP(prev => prev + 20 + bonus);

                // Update best streak immediately if higher
                const stats = JSON.parse(localStorage.getItem('consultorStats') || '{"totalAnalyzed":0,"bestStreak":0}');
                if (newStreak > stats.bestStreak) {
                    stats.bestStreak = newStreak;
                    localStorage.setItem('consultorStats', JSON.stringify(stats));
                }
                return newStreak;
            });
        } else {
            setCurrentStreak(0);
            // Vibrate if mobile
            if (navigator.vibrate) navigator.vibrate(200);
        }

        // Small delay to ensure exit animation sees the updated direction
        setTimeout(() => {
            setShowFeedback(true);
        }, 10);
    };

    const nextQuestion = () => {
        setShowFeedback(false);
        setDirection(null);
        setCurrentIndex(prev => prev + 1);
    };

    const resetGame = () => {
        setCurrentIndex(0);
        setScore(0);
        setCurrentXP(0);
        setShowFeedback(false);
        setDirection(null);
        setXpSaved(false);
        loadQuestions();
    };

    if (isLoading) {
        return (
            <div className="flex flex-col h-full min-h-[500px] items-center justify-center text-white">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
                <p>Carregando cenários...</p>
            </div>
        );
    }

    const isGameOver = currentIndex >= questions.length;

    if (isGameOver) {
        return (
            <div className="flex flex-col h-full min-h-[500px] items-center justify-center text-center p-6 text-white">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                    <Check className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Treino Concluído!</h2>
                <p className="text-xl mb-6 text-muted-foreground">
                    Você analisou todos os cenários e garantiu:
                </p>
                <div className="text-5xl font-bold text-primary mb-2 tabular-nums">
                    +{formatNumber(currentXP)} XP
                </div>
                <p className="mb-8 text-white/60 text-sm">
                    Acertos: <span className="font-bold text-emerald-400">{formatNumber(score)}</span> de {formatNumber(questions.length)}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                    <Button onClick={resetGame} size="lg" className="flex-1">
                        Tentar Novamente
                    </Button>
                    <Button onClick={onBack} variant="outline" size="lg" className="flex-1">
                        Voltar
                    </Button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const content = currentQuestion.content as QuestionContent;
    const progress = ((currentIndex) / questions.length) * 100;

    // Default labels
    const leftLabel = content?.leftLabel || "Recusar";
    const rightLabel = content?.rightLabel || "Aceitar";

    return (
        <div className="flex flex-col h-full min-h-[500px] max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={handleExit} size="sm" className="gap-2 text-white/70 hover:text-white hover:bg-white/10" aria-label="Sair do jogo">
                    <ArrowLeft className="w-4 h-4" /> Sair
                </Button>
                <GameHelp>
                    <p>
                        Analise o cenário e decida: é uma boa oportunidade financeira ou um golpe?
                        Arraste para a <span className="text-emerald-400 font-bold">DIREITA</span> se for bom,
                        ou para a <span className="text-red-400 font-bold">ESQUERDA</span> se for ruim/golpe.
                    </p>
                </GameHelp>
            </div>

            {/* Card Area */}
            <div className="flex-1 relative flex flex-col items-center justify-center perspective-1000">
                <AnimatePresence mode="wait">
                    {!showFeedback ? (
                        <motion.div
                            key="question-card"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{
                                scale: 1.1,
                                opacity: 0,
                                rotate: direction === 'left' ? -20 : 20,
                                x: direction === 'left' ? -300 : 300,
                                backgroundColor: direction === 'left' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                borderColor: direction === 'left' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.5)',
                                transition: { duration: 0.4, ease: "easeIn" }
                            }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={(_, info) => {
                                if (info.offset.x > 100) {
                                    handleSwipe('right');
                                } else if (info.offset.x < -100) {
                                    handleSwipe('left');
                                }
                            }}
                            whileDrag={{ cursor: "grabbing" }}
                            className="w-full bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center text-center min-h-[350px] justify-center relative overflow-hidden cursor-grab active:cursor-grabbing touch-none"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                            <div className="mb-6 w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-white/5">
                                {content.icon || (content.type === 'good' ? "💰" : "⚠️")}
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-6 leading-tight">
                                {content.text}
                            </h3>

                            <div className="flex gap-4 items-center text-[10px] uppercase font-bold tracking-widest text-white/30">
                                <span className="flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> {leftLabel}</span>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="flex items-center gap-1">{rightLabel} <ArrowLeft className="w-3 h-3 rotate-180" /></span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="feedback-card"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`w-full border-2 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center min-h-[350px] justify-center relative overflow-hidden ${lastAnswerCorrect
                                ? "bg-emerald-950/40 border-emerald-500/50"
                                : "bg-red-950/40 border-red-500/50"
                                }`}
                        >
                            <div className={`absolute inset-0 opacity-10 ${lastAnswerCorrect ? 'bg-emerald-500' : 'bg-red-500'}`} />

                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 12 }}
                                className={`mb-6 w-20 h-20 rounded-full flex items-center justify-center relative z-10 ${lastAnswerCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}
                            >
                                {lastAnswerCorrect ? (
                                    <Check className="w-10 h-10" />
                                ) : (
                                    <X className="w-10 h-10" />
                                )}
                            </motion.div>

                            <h3 className={`text-2xl font-bold mb-3 relative z-10 ${lastAnswerCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                {lastAnswerCorrect ? "Decisão Correta!" : "Ops, Cuidado!"}
                            </h3>

                            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 mb-6 relative z-10 border border-white/5">
                                <p className="text-sm text-white/90 leading-relaxed italic">
                                    "{content.explanation}"
                                </p>
                            </div>

                            <Button onClick={nextQuestion} className="w-full relative z-10 shadow-lg" size="lg">
                                Continuar Treino
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="mt-8 grid grid-cols-2 gap-4">
                <Button
                    variant="ghost"
                    size="lg"
                    className="bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white h-20 rounded-2xl text-lg flex-col gap-1 transition-all"
                    onClick={() => handleSwipe('left')}
                    disabled={showFeedback}
                >
                    <ThumbsDown className="w-6 h-6" />
                    <span className="text-[10px] uppercase font-black">{leftLabel}</span>
                </Button>
                <Button
                    variant="ghost"
                    size="lg"
                    className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white h-20 rounded-2xl text-lg flex-col gap-1 transition-all"
                    onClick={() => handleSwipe('right')}
                    disabled={showFeedback}
                >
                    <ThumbsUp className="w-6 h-6" />
                    <span className="text-[10px] uppercase font-black">{rightLabel}</span>
                </Button>
            </div>
        </div>
    );
};
