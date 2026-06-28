import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase, TrendingUp, Zap, Coins, Building, HelpCircle } from "lucide-react";
import { gameService, EmpireItem } from "@/services/gameService";
import { formatNumber, formatED, formatCompactNumber } from "@/lib/utils";
import { GameHelp } from "./GameHelp";

import { useToast } from "@/components/ui/use-toast";

interface Props {
    onBack: () => void;
    user?: any;
}

export const EmpireBuilder = ({ onBack, user }: Props) => {
    const { toast } = useToast();

    const [balance, setBalance] = useState(0);
    const [clickValue, setClickValue] = useState(1);
    const [passiveIncome, setPassiveIncome] = useState(0);
    const [items, setItems] = useState<EmpireItem[]>([]);
    const [ownedItems, setOwnedItems] = useState<Record<number, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const xpProgressRef = useRef(0);

    // Keep saveStateRef updated with the latest balance and owned items for safe background autosaving
    const saveStateRef = useRef({ balance, ownedItems });
    useEffect(() => {
        saveStateRef.current = { balance, ownedItems };
    }, [balance, ownedItems]);

    // Floating texts
    const [clicks, setClicks] = useState<{ id: number; x: number; y: number; val: number }[]>([]);
    const clickIdRef = useRef(0);

    useEffect(() => {
        loadGame();
        // Load save from localstorage
        const saved = localStorage.getItem('empireSave');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const loadedBalance = Number(parsed.balance);
                setBalance(isNaN(loadedBalance) ? 0 : loadedBalance);
                setOwnedItems(parsed.ownedItems || {});
            } catch (e) {
                console.error("Failed to load save", e);
            }
        }
    }, []);

    useEffect(() => {
        if (items.length > 0) {
            // Recalculate rates
            let newClickVal = 1;
            let newPassive = 0;

            items.forEach(item => {
                const count = ownedItems[item.id] || 0;
                if (count > 0) {
                    if (item.type === 'active') {
                        newClickVal += item.base_income * count;
                    } else {
                        newPassive += item.base_income * count;
                    }
                }
            });

            setClickValue(newClickVal);
            setPassiveIncome(newPassive);
        }
    }, [ownedItems, items]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (passiveIncome > 0) {
                setBalance(b => b + passiveIncome);
                checkXp(passiveIncome);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [passiveIncome, clickValue]);

    useEffect(() => {
        // Auto-save every 5s - stable interval
        const timer = setInterval(() => {
            const { balance: currentBalance, ownedItems: currentItems } = saveStateRef.current;
            localStorage.setItem('empireSave', JSON.stringify({
                balance: currentBalance,
                ownedItems: currentItems
            }));
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const loadGame = async () => {
        try {
            const data = await gameService.getEmpireItems();

            setItems(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const checkXp = (amount: number) => {
        xpProgressRef.current += amount;

        // Threshold adjusts dynamically to current income level
        // Formula: (Passive/sec + Active/click) * 10
        // Means getting ~1 XP every 10 seconds of full production
        const currentRate = Math.max(10, passiveIncome + clickValue);
        const threshold = currentRate * 10;

        if (xpProgressRef.current >= threshold) {
            const xpToAward = Math.floor(xpProgressRef.current / threshold);
            if (xpToAward > 0) {
                xpProgressRef.current %= threshold;
                if (user) {
                    gameService.addUserXP(user.id, xpToAward);
                }
            }
        }
    };

    const handleWork = (e: React.MouseEvent<HTMLButtonElement>) => {

        // Add balance
        setBalance(b => b + clickValue);
        checkXp(clickValue);

        // Add floating text
        const rect = e.currentTarget.getBoundingClientRect();
        // Random position around center
        const x = e.clientX - rect.left + (Math.random() * 40 - 20);
        const y = e.clientY - rect.top + (Math.random() * 40 - 20);

        const id = clickIdRef.current++;
        setClicks(prev => [...prev, { id, x, y, val: clickValue }]);

        // Cleanup floating text after 1s
        setTimeout(() => {
            setClicks(prev => prev.filter(c => c.id !== id));
        }, 800);
    };

    const getCost = (item: EmpireItem, count: number) => {
        return Math.floor(item.base_cost * Math.pow(1.12, count));
    };

    const buyItem = (item: EmpireItem) => {
        const count = ownedItems[item.id] || 0;
        const cost = getCost(item, count);

        if (balance >= cost) {

            setBalance(b => b - cost);
            setOwnedItems(prev => ({
                ...prev,
                [item.id]: (prev[item.id] || 0) + 1
            }));
        } else {

            toast({
                title: "Saldo insuficiente",
                description: `Você precisa de ED$ ${formatNumber(cost)}`,
                variant: "destructive"
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col h-full min-h-[500px] items-center justify-center text-white">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
                <p>Construindo império...</p>
            </div>
        );
    }

    const passiveItems = items.filter(i => i.type === 'passive');
    const activeItems = items.filter(i => i.type === 'active');

    return (
        <div className="flex flex-col h-full min-h-[600px] max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={onBack} size="sm" className="gap-2 text-white hover:text-primary hover:bg-white/10" aria-label="Sair do jogo">
                        <ArrowLeft className="w-4 h-4" /> Sair
                    </Button>
                    <GameHelp>
                        <p>
                            Comece gerando <span className="text-amber-400 font-bold">Renda Ativa</span> clicando no botão "Trabalhar".
                            Use seu saldo na loja lateral para comprar investimentos que geram <span className="text-emerald-400 font-bold">Renda Passiva</span> automática.
                            O objetivo é construir seu império e ver o poder dos juros compostos!
                        </p>
                    </GameHelp>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-8 h-full">
                {/* Left Column: Passive Income */}
                <ShopColumn
                    title="Renda Passiva"
                    icon={<TrendingUp className="w-4 h-4" />}
                    items={passiveItems}
                    ownedItems={ownedItems}
                    balance={balance}
                    onBuy={buyItem}
                    getCost={getCost}
                    isPassive={true}
                />

                {/* Center Column: Main Game */}
                <div className="flex flex-col gap-6 order-first lg:order-none">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 border border-white/10 p-4 rounded-xl flex flex-col items-center">
                            <span className="text-muted-foreground text-sm uppercase font-bold mb-1">Passiva</span>
                            <div className="flex items-center gap-2 text-emerald-400">
                                <TrendingUp className="w-5 h-5" />
                                <span className="text-xl md:text-2xl font-bold tabular-nums">+{formatNumber(passiveIncome)}/s</span>
                            </div>
                        </div>
                        <div className="bg-slate-800/50 border border-white/10 p-4 rounded-xl flex flex-col items-center">
                            <span className="text-muted-foreground text-sm uppercase font-bold mb-1">Ativa</span>
                            <div className="flex items-center gap-2 text-amber-400">
                                <Zap className="w-5 h-5" />
                                <span className="text-xl md:text-2xl font-bold tabular-nums">+{formatNumber(clickValue)}/click</span>
                            </div>
                        </div>
                    </div>

                    {/* Clicker Area */}
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] relative">
                        <div className="text-5xl md:text-6xl font-bold text-white mb-12 tabular-nums tracking-tight">
                            ED$ {formatCompactNumber(balance)}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleWork}
                            className="w-56 h-56 rounded-full bg-gradient-to-b from-primary to-primary/60 shadow-[0_0_60px_rgba(var(--primary-rgb),0.3)] border-4 border-white/10 flex flex-col items-center justify-center gap-3 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Briefcase className="w-20 h-20 text-white" />
                            <span className="font-bold text-white text-xl uppercase tracking-wider">Trabalhar</span>
                        </motion.button>

                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <AnimatePresence>
                                {clicks.map(click => (
                                    <motion.div
                                        key={click.id}
                                        initial={{ opacity: 1, y: 0, x: 0 }}
                                        animate={{ opacity: 0, y: -120 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute font-bold text-emerald-400 text-2xl drop-shadow-md"
                                        style={{
                                            left: '50%',
                                            top: '50%',
                                            marginLeft: click.x,
                                            marginTop: click.y
                                        }}
                                    >
                                        +ED${click.val}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Right Column: Active Income */}
                <ShopColumn
                    title="Renda Ativa"
                    icon={<Zap className="w-4 h-4" />}
                    items={activeItems}
                    ownedItems={ownedItems}
                    balance={balance}
                    onBuy={buyItem}
                    getCost={getCost}
                    isPassive={false}
                />
            </div>
        </div>
    );
};

// Helper Component for Shop Columns
// Moved outside to prevent re-creation on every render
const ShopColumn = ({ title, icon, items, ownedItems, balance, onBuy, getCost, isPassive }: any) => {
    return (
        <div className="relative bg-slate-900/50 border border-white/10 overflow-y-auto max-h-[600px] rounded-xl flex flex-col overscroll-contain
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-white/10
            [&::-webkit-scrollbar-thumb]:rounded-full
            hover:[&::-webkit-scrollbar-thumb]:bg-white/20">

            <div className="p-4 border-b border-white/10 sticky top-0 bg-slate-950 z-50 flex items-center justify-between shadow-lg">
                <h3 className="font-bold text-white flex items-center gap-2 uppercase tracking-wide text-sm">
                    {icon} {title}
                </h3>
                {isPassive && (
                    <span className="text-[10px] text-emerald-400 font-mono animate-pulse">RENDENDO...</span>
                )}
            </div>

            <div className="p-3 space-y-3 flex-1">
                {items.map((item: EmpireItem) => {
                    const count = ownedItems[item.id] || 0;
                    const cost = getCost(item, count);
                    const canAfford = balance >= cost;

                    const accentClass = isPassive ? 'border-emerald-500/20 hover:border-emerald-500/50' : 'border-amber-500/20 hover:border-amber-500/50';
                    const glowClass = isPassive ? 'group-hover:bg-emerald-500/5' : 'group-hover:bg-amber-500/5';
                    const textAccent = isPassive ? 'text-emerald-400' : 'text-amber-400';

                    return (
                        <button
                            key={item.id}
                            onClick={() => onBuy(item)}
                            disabled={!canAfford}
                            aria-label={`Comprar ${item.name} por ${formatNumber(cost)} moedas`}
                            className={`
                                w-full text-left p-4 rounded-xl border transition-all relative group overflow-hidden
                                ${canAfford
                                    ? `bg-slate-800/40 ${accentClass} ${glowClass}`
                                    : 'bg-slate-950/50 border-white/5 opacity-50 cursor-not-allowed'
                                }
                            `}
                        >
                            <div className={`absolute -right-5 -top-5 w-16 h-16 blur-2xl opacity-10 transition-opacity group-hover:opacity-30 ${isPassive ? 'bg-emerald-500' : 'bg-amber-500'}`} />

                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <span className="font-bold text-white text-sm group-hover:text-primary transition-colors pr-2">{item.name}</span>
                                <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/70 whitespace-nowrap">
                                    Nível {count}
                                </span>
                            </div>

                            <p className="text-xs text-muted-foreground mb-3 leading-relaxed relative z-10">
                                {item.description}
                            </p>

                            <div className="flex items-center justify-between relative z-10 pt-2 border-t border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold">Custo</span>
                                    <div className={`flex items-center gap-1 text-sm font-bold tabular-nums ${canAfford ? 'text-white' : 'text-red-400'}`}>
                                        <Coins className="w-3 h-3 text-amber-400" />
                                        {formatNumber(cost)}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold">Bônus</span>
                                    <div className={`flex items-center gap-1 text-sm font-bold tabular-nums ${textAccent}`}>
                                        {isPassive ? <TrendingUp className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                                        +{formatNumber(item.base_income)}
                                    </div>
                                </div>
                            </div>

                            <div className={`mt-2 py-1 px-2 rounded-md text-[10px] font-medium text-center relative z-10 transition-colors ${count > 0 ? (isPassive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300') : 'text-muted-foreground/50'}`}>
                                {count > 0
                                    ? `Próximo: +${formatNumber(item.base_income * (count + 1))} total`
                                    : 'Compre para desbloquear'
                                }
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
