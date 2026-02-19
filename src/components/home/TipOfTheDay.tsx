import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Share2, ChevronLeft, ChevronRight, Quote, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Tip {
  id: number;
  title: string;
  content: string;
}

export function TipOfTheDay() {
  const [dailyTips, setDailyTips] = useState<Tip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTips() {
      try {
        const { data, error } = await supabase
          .from('tips')
          .select('*')
          .order('id');

        if (error) throw error;

        if (data && data.length > 0) {
          // Deterministic selection of 3 tips based on date
          const today = new Date();
          const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);

          // Select 3 distinct tips using prime number offsets to avoid repetition patterns
          const len = data.length;
          const tip1 = data[dayOfYear % len];
          const tip2 = data[(dayOfYear + 17) % len]; // Offset by 17
          const tip3 = data[(dayOfYear + 37) % len]; // Offset by 37

          setDailyTips([tip1, tip2, tip3]);
        }
      } catch (error) {
        console.error("Error fetching tips:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTips();
  }, []);

  const handleShare = (tip: Tip) => {
    const textToShare = `💡 Inspiração do dia EducaInvest:\n\n*${tip.title}*\n"${tip.content}"\n\nAprenda mais em: educainvest.app`;

    if (navigator.share) {
      navigator.share({
        title: 'Inspiração do dia EducaInvest',
        text: textToShare,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(textToShare);
      toast({
        title: "Copiado!",
        description: "Frase copiada para a área de transferência.",
      });
    }
  };

  if (isLoading) return null;
  if (dailyTips.length === 0) return null;

  return (
    <section className="py-12 md:py-16 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Inspiração Diária</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
              Doses de Sabedoria
            </h2>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
              Três pílulas de conhecimento para guiar suas decisões financeiras hoje.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dailyTips.map((tip, index) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500/20 to-purple-500/20 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative h-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 md:p-8 flex flex-col shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">

                  <div className="absolute top-6 right-6 text-white/5 group-hover:text-white/10 transition-colors">
                    <Quote className="w-12 h-12" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-400 mb-4 font-display pr-8">
                      {tip.title}
                    </h3>
                    <p className="text-slate-300 leading-relaxed italic relative z-10">
                      "{tip.content}"
                    </p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500">
                      #{index + 1} do dia
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(tip)}
                      className="h-8 gap-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-full text-xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </motion.div>
      </div>
    </section>
  );
}
