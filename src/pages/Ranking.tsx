import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Crown, Shield } from "lucide-react";
import { UserProfile } from "@/lib/types";

export default function Ranking() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRanking();
    }, []);

    const fetchRanking = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setCurrentUser(session?.user);

            const { data, error } = await supabase
                .from('ranking_publico')
                .select('*')
                .order('xp_total', { ascending: false })
                .limit(50);

            if (data) {
                // Mapeia os campos da view para o tipo UserProfile
                const mapped = data.map((d: any) => ({
                    ...d,
                    full_name: d.nome_completo,
                    avatar_url: d.url_avatar
                }));
                setUsers(mapped as UserProfile[]);
            }
        } catch (error) {
            console.error("Error fetching ranking:", error);
        } finally {
            setLoading(false);
        }
    };

    const getMedalColor = (index: number) => {
        switch (index) {
            case 0: return "text-yellow-400";
            case 1: return "text-slate-300";
            case 2: return "text-amber-600";
            default: return "text-slate-500";
        }
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
            case 1: return <Medal className="w-6 h-6 text-slate-300" />;
            case 2: return <Medal className="w-6 h-6 text-amber-600" />;
            default: return <span className="font-bold text-slate-500 w-6 text-center">{index + 1}</span>;
        }
    };

    const topThree = users.slice(0, 3);
    const restOfUsers = users.slice(3);

    return (
        <Layout>
            <div className="min-h-screen bg-slate-950 pb-20">
                {/* Header Section */}
                <div className="relative pt-12 pb-24 px-4 bg-gradient-to-b from-primary/10 to-slate-950 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2" />
                    <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2" />

                    <div className="container mx-auto text-center relative z-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center justify-center p-3 bg-white/5 rounded-full mb-4 border border-white/10"
                        >
                            <Trophy className="w-8 h-8 text-amber-400" />
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-2">Ranking Global</h1>
                        <p className="text-muted-foreground max-w-lg mx-auto">
                            Os maiores investidores da nossa comunidade. Continue aprendendo para subir no ranking!
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 max-w-4xl -mt-12 relative z-20">

                    {/* Top 3 Podium */}
                    {topThree.length > 0 && (
                        <div className="flex justify-center items-end gap-4 mb-12">
                            {/* 2nd Place */}
                            {topThree[1] && (
                                <motion.div
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex flex-col items-center"
                                >
                                    <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-slate-300 shadow-xl mb-3">
                                        <AvatarImage src={topThree[1].avatar_url} />
                                        <AvatarFallback className="bg-slate-800 text-slate-300">
                                            {topThree[1].email?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-center">
                                        <p className="font-bold text-white text-sm md:text-base max-w-[80px] truncate">{topThree[1].full_name || topThree[1].email?.split('@')[0] || "Investidor"}</p>
                                        <p className="text-xs text-slate-400 font-mono">{topThree[1].xp_total} XP</p>
                                    </div>
                                    <div className="h-24 w-16 md:w-20 bg-gradient-to-t from-slate-300/20 to-slate-300/5 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                                        <span className="text-2xl font-bold text-slate-300">2</span>
                                    </div>
                                </motion.div>
                            )}

                            {/* 1st Place */}
                            {topThree[0] && (
                                <motion.div
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex flex-col items-center z-10"
                                >
                                    <div className="relative">
                                        <Crown className="w-8 h-8 text-yellow-400 absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce" />
                                        <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)] mb-3">
                                            <AvatarImage src={topThree[0].avatar_url} />
                                            <AvatarFallback className="bg-slate-800 text-yellow-400">
                                                {topThree[0].email?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-white text-base md:text-lg max-w-[100px] truncate">{topThree[0].full_name || topThree[0].email?.split('@')[0] || "Mestre"}</p>
                                        <p className="text-xs text-yellow-400 font-mono font-bold">{topThree[0].xp_total} XP</p>
                                    </div>
                                    <div className="h-32 w-20 md:w-24 bg-gradient-to-t from-yellow-400/20 to-yellow-400/5 rounded-t-lg mt-2 flex items-end justify-center pb-2 border-t border-yellow-400/20">
                                        <span className="text-4xl font-bold text-yellow-400">1</span>
                                    </div>
                                </motion.div>
                            )}

                            {/* 3rd Place */}
                            {topThree[2] && (
                                <motion.div
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex flex-col items-center"
                                >
                                    <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-amber-600 shadow-xl mb-3">
                                        <AvatarImage src={topThree[2].avatar_url} />
                                        <AvatarFallback className="bg-slate-800 text-amber-600">
                                            {topThree[2].email?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-center">
                                        <p className="font-bold text-white text-sm md:text-base max-w-[80px] truncate">{topThree[2].full_name || topThree[2].email?.split('@')[0] || "Investidor"}</p>
                                        <p className="text-xs text-slate-400 font-mono">{topThree[2].xp_total} XP</p>
                                    </div>
                                    <div className="h-20 w-16 md:w-20 bg-gradient-to-t from-amber-600/20 to-amber-600/5 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                                        <span className="text-2xl font-bold text-amber-600">3</span>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm relative min-h-[400px]"
                    >
                        {/* Guest Overlay */}
                        {!currentUser && !loading && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm p-6 text-center">
                                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 border border-primary/20">
                                    <Shield className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Ranking da Comunidade
                                </h3>
                                <p className="text-slate-300 mb-6 max-w-sm">
                                    Entre para ver sua posição e conferir o ranking completo dos investidores.
                                </p>
                                <Button
                                    onClick={() => window.location.href = '/login'}
                                    size="lg"
                                    className="font-bold px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                                >
                                    Entrar para Competição
                                </Button>
                            </div>
                        )}

                        {/* Empty State for Logged In Users with no competitors below top 3 */}
                        {currentUser && restOfUsers.length === 0 && (
                            <div className="text-center py-12 px-4">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trophy className="w-8 h-8 text-yellow-500/50" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Ranking em Construção!</h3>
                                <p className="text-slate-400 max-w-sm mx-auto">
                                    Você está entre os pioneiros! Em breve novos competidores chegarão para desafiar sua posição.
                                </p>
                            </div>
                        )}

                        {/* Real List or Dummy List for Guests */}
                        {(currentUser ? restOfUsers : (users.length > 0 ? restOfUsers : Array(10).fill(null))).map((user, index) => (
                            <div
                                key={user?.id || index}
                                className={`flex items-center gap-4 p-4 border-b border-white/5 ${!currentUser ? 'opacity-50 blur-sm' : 'hover:bg-white/5 transition-colors'} ${currentUser?.id === user?.id ? "bg-primary/10 hover:bg-primary/20" : ""}`}
                            >
                                <div className="w-8 flex justify-center shrink-0">
                                    <span className="font-bold text-slate-500">{index + 4}</span>
                                </div>
                                <Avatar className="w-10 h-10 border border-white/10">
                                    <AvatarImage src={user?.avatar_url} />
                                    <AvatarFallback className="bg-slate-800 text-slate-400">
                                        {user?.email?.charAt(0).toUpperCase() || "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium truncate ${currentUser?.id === user?.id ? "text-primary" : "text-slate-200"}`}>
                                        {user?.full_name || user?.email?.split('@')[0] || "Investidor Anônimo"}
                                        {currentUser?.id === user?.id && <span className="ml-2 text-[10px] uppercase bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">Você</span>}
                                    </p>
                                    <p className="text-xs text-slate-500">{user?.current_level || "Iniciante"}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="font-bold text-white font-mono">{user?.xp_total || "---"}</span>
                                    <span className="text-xs text-slate-500 ml-1">XP</span>
                                </div>
                            </div>
                        ))}

                        {users.length === 0 && currentUser && !loading && (
                            <div className="p-8 text-center text-muted-foreground">
                                Nenhum competidor encontrado ainda.
                            </div>
                        )}

                        {loading && (
                            <div className="p-8 text-center text-muted-foreground animate-pulse">
                                Carregando ranking...
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </Layout>
    );
}
