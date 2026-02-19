import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Calendar, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Simulacao {
    id: string;
    tipo_ativo: string;
    valor_inicial: number;
    prazo_meses: number;
    resultado_estimado: number;
    criado_em: string;
}

export function RecentSimulations({ userId }: { userId: string }) {
    const [simulations, setSimulations] = useState<Simulacao[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchSimulations() {
            if (!userId) return;

            const { data, error } = await supabase
                .from('simulacoes')
                .select('*')
                .eq('usuario_id', userId)
                .order('criado_em', { ascending: false })
                .limit(3);

            if (!error && data) {
                setSimulations(data as any);
            }
            setLoading(false);
        }

        fetchSimulations();
    }, [userId]);

    if (loading) return null; // Or a skeleton loader

    // Se não tiver simulações, não mostra nada (ou poderia mostrar um CTA)
    if (simulations.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-3 bg-slate-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-blue-500/10 p-3 rounded-full">
                        <Activity className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">Simule seu Futuro</h3>
                        <p className="text-muted-foreground text-sm">Descubra quanto seu dinheiro pode render com juros compostos.</p>
                    </div>
                </div>
                <Button
                    onClick={() => navigate('/simular')}
                    variant="outline"
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 w-full md:w-auto"
                >
                    Criar Simulação
                </Button>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
            <div className="md:col-span-3 flex items-center justify-between mb-2 px-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    Simulações Recentes
                </h3>
                <Button
                    variant="link"
                    className="text-blue-400 text-xs p-0 h-auto hover:text-blue-300"
                    onClick={() => navigate('/simular')}
                >
                    Nova Simulação <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
            </div>

            {simulations.map((sim, index) => (
                <motion.div
                    key={sim.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-white/10 hover:bg-slate-800/50 transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                                {sim.tipo_ativo.replace('_', ' ')}
                            </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(sim.criado_em).toLocaleDateString()}
                        </span>
                    </div>

                    <div className="space-y-1 mb-4">
                        <p className="text-xs text-muted-foreground">Resultado Estimado</p>
                        <p className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                            {formatCurrency(sim.resultado_estimado)}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-3">
                        <div>
                            <p className="text-muted-foreground/70 mb-0.5">Investimento</p>
                            <p className="text-white font-medium">{formatCurrency(sim.valor_inicial)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-muted-foreground/70 mb-0.5">Prazo</p>
                            <p className="text-white font-medium">{sim.prazo_meses} meses</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
