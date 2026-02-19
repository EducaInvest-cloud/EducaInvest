import { motion } from "framer-motion";
import { BookOpen, Calculator, Gamepad2, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface QuickActionsProps {
  userLoggedIn?: boolean;
  progress?: {
    completed: number;
    total: number;
    percentage: number;
  } | null;
}

export function QuickActions({ userLoggedIn = false, progress }: QuickActionsProps) {
  // Determina qual ação destacar baseado no progresso
  const getRecommendedAction = () => {
    if (!userLoggedIn || !progress) return "aprender";

    if (progress.percentage < 30) return "aprender";
    if (progress.percentage < 70) return "simular";
    return "praticar";
  };

  const recommendedPath = getRecommendedAction();

  const actions = [
    {
      title: "Sou Iniciante",
      subtitle: "Quero Aprender",
      description: userLoggedIn
        ? `Continue sua jornada! ${progress?.completed || 0} aulas concluídas.`
        : "Comece do zero com explicações simples e exemplos práticos do dia a dia.",
      icon: BookOpen,
      path: "/aprender",
      gradient: "bg-gradient-hero",
      iconBg: "bg-primary/20",
      badge: userLoggedIn && progress && progress.percentage > 0
        ? `${progress.percentage}% completo`
        : null,
      recommended: recommendedPath === "aprender",
    },
    {
      title: "Já sei um pouco",
      subtitle: "Quero Simular",
      description: userLoggedIn && progress && progress.percentage >= 30
        ? "Teste seus conhecimentos com simuladores realistas!"
        : "Teste cenários e veja como seu dinheiro pode crescer com o tempo.",
      icon: Calculator,
      path: "/simular",
      gradient: "bg-gradient-success",
      iconBg: "bg-success/20",
      badge: null,
      recommended: recommendedPath === "simular",
    },
    {
      title: "Quero me divertir",
      subtitle: "Quero Praticar",
      description: userLoggedIn && progress && progress.percentage >= 70
        ? "Domine o mercado com jogos educativos avançados!"
        : "Aprenda brincando com jogos educativos sobre investimentos.",
      icon: Gamepad2,
      path: "/praticar",
      gradient: "bg-gradient-arcade",
      iconBg: "bg-accent/20",
      badge: null,
      recommended: recommendedPath === "praticar",
    },
  ];

  return (
    <section className="py-16 md:py-20 relative">
      {/* Background decorativo */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            {userLoggedIn
              ? "Continue sua jornada de aprendizado"
              : "Por onde você quer começar?"}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {userLoggedIn
              ? "Escolha a próxima etapa da sua evolução como investidor"
              : "Escolha o caminho que faz mais sentido para você agora."}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {actions.map((action, index) => {
            const isRecommended = action.recommended && userLoggedIn;

            return (
              <motion.div
                key={action.path}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={action.path}>
                  <motion.div
                    className={`group relative bg-card rounded-2xl p-6 border shadow-md hover:shadow-xl transition-all duration-300 h-full ${isRecommended
                        ? "border-primary/50 ring-2 ring-primary/20"
                        : "border-border"
                      }`}
                    whileHover={{ y: -4 }}
                  >
                    {/* Gradient accent top */}
                    <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${action.gradient}`} />

                    {/* Badge de Recomendado */}
                    {isRecommended && (
                      <div className="absolute -top-3 right-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                        <Sparkles className="w-3 h-3" />
                        Recomendado
                      </div>
                    )}

                    {/* Badge de Progresso */}
                    {action.badge && (
                      <div className="absolute -top-3 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        {action.badge}
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl ${action.iconBg} flex items-center justify-center mb-4`}>
                      <action.icon className="w-7 h-7 text-foreground" />
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground font-medium">{action.title}</p>
                      <h3 className="font-display text-xl font-bold text-foreground">
                        {action.subtitle}
                      </h3>
                    </div>

                    <p className="text-muted-foreground text-sm mb-6 min-h-[3rem]">
                      {action.description}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                      <span>Acessar</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>

                    {/* Brilho de fundo para recomendado */}
                    {isRecommended && (
                      <div className="absolute inset-0 bg-primary/5 rounded-2xl pointer-events-none" />
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Mensagem motivacional (apenas para usuários logados) */}
        {userLoggedIn && progress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-12"
          >
            <p className="text-sm text-muted-foreground">
              {progress.percentage < 30 && "🚀 Continue aprendendo para evoluir ainda mais!"}
              {progress.percentage >= 30 && progress.percentage < 70 && "🎯 Você está progredindo muito bem! Continue assim."}

            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
