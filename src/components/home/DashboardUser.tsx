import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Play, CheckCircle2, Star, ArrowRight } from "lucide-react";
import { RecentSimulations } from "./RecentSimulations";

export function DashboardUser({ user, perfil }: { user: any; perfil: any; progress?: any; }) {
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function getProgress() {
      // Busca qual foi a última aula concluída
      const { data: progress } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .order('lesson_id', { ascending: false })
        .limit(1);

      const lastId = progress?.[0]?.lesson_id || 0;

      // Busca a próxima aula (ID + 1)
      const { data: lesson } = await supabase
        .from('lessons')
        .select('id, title_short, description')
        .eq('id', lastId + 1)
        .maybeSingle();

      setNextLesson(lesson || null);
      setLoading(false);
    }
    if (user) getProgress();
  }, [user]);

  // Lógica de Nível (Ex: cada 1000 XP sobe um nível)
  const xpParaProximoNivel = 1000;
  const progressoNivel = ((perfil?.xp_total || 0) % xpParaProximoNivel) / 10;

  return (
    <section className="py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Card de Perfil e XP */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 bg-slate-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <img
                src={user.user_metadata?.avatar_url}
                className="w-16 h-16 rounded-2xl border-2 border-primary/30"
                alt="Avatar"
              />
              <div className="absolute -bottom-2 -right-2 bg-primary p-1.5 rounded-lg shadow-lg">
                <Trophy className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Olá, {user.user_metadata?.full_name?.split(' ')[0]}!</h2>
              <p className="text-primary text-xs font-bold uppercase tracking-widest">{perfil?.current_level || 'Poupador Aprendiz'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Progresso do Nível</span>
              <span className="text-white">{perfil?.xp_total || 0} XP</span>
            </div>
            <Progress value={progressoNivel} className="h-2 bg-white/5" />
            <p className="text-[10px] text-muted-foreground text-right italic">Mais {1000 - ((perfil?.xp_total || 0) % 1000)} XP para o próximo nível</p>
          </div>
        </motion.div>

        {/* Card de Próxima Aula */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-md transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5"
        >
          {/* Background Image / Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-slate-950/80 z-0" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl transition-all group-hover:bg-primary/30" />

          <div className="relative z-10 flex flex-col h-full justify-between p-8">
            <div className="flex flex-col md:flex-row gap-6 md:items-start">

              {/* Icon / Thumbnail Box */}
              <div className="shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg group-hover:scale-105 transition-transform duration-500">
                  {nextLesson ? (
                    <Play className="h-8 w-8 text-primary fill-current" />
                  ) : (
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary uppercase tracking-wider border border-primary/20">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    {nextLesson ? "Sua Próxima Missão" : "Missão Cumprida"}
                  </span>
                  {nextLesson && (
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider border border-white/5 px-2 py-0.5 rounded-full bg-white/5">
                      {nextLesson.level || "Módulo Principal"}
                    </span>
                  )}
                </div>

                <h3 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight">
                  {nextLesson ? nextLesson.title_short : "Você completou todas as aulas!"}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                  {nextLesson
                    ? nextLesson.description
                    : "Parabéns, investidor! Você dominou todo o conteúdo disponível. Fique ligado para novos módulos em breve."}
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
              <div className="flex flex-col gap-1">
                {nextLesson && (
                  <>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Recompensa</span>
                    <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" /> +150 XP
                    </span>
                  </>
                )}
              </div>

              {nextLesson ? (
                <Button
                  onClick={() => navigate(`/aprender?aulaId=${nextLesson.id}`)}
                  className="rounded-full bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/30 group/btn"
                >
                  Continuar Jornada
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/praticar')}
                  className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-6 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 hover:shadow-emerald-500/30 group/btn"
                >
                  Explorar Jogos e Desafios
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Widget de Simulações Recentes */}
        <RecentSimulations userId={user.id} />

      </div>
    </section>
  );
}
