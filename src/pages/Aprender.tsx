import { useState, useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";

// Imports to Backend and Types
import { supabase } from "@/integrations/supabase/client";
import { Lesson, Term } from "@/lib/types";

// New Components and Hooks
import { LessonSidebar } from "@/components/aprender/LessonSidebar";
import { LessonContent } from "@/components/aprender/LessonContent";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { Button } from "@/components/ui/button";

export default function Aprender() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  // Real Data States
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [allTerms, setAllTerms] = useState<Term[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  // Use custom hook for progress logic
  const {
    currentAulaId,
    currentAula,
    timeLeft,
    canComplete,
    handleLessonChange,
    handleCompleteAndNext,
    TIME_LIMIT,
    xpAmount
  } = useLessonProgress(lessons, user, completedLessonIds, setCompletedLessonIds, isAdmin);

  // Fetching Data
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user);

        // Helper to validate UUID
        const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const userId = session?.user?.id;

        if (userId && !isValidUUID(userId)) {
          console.error("Aprender: Invalid UUID detected for user:", userId);
        }

        const [lessonsResult, termsResult, progressResult, perfilResult] = await Promise.all([
          supabase.from('lessons').select('*').order('order_index', { ascending: true }),
          supabase.from('terms').select('*'),
          (userId && isValidUUID(userId))
            ? supabase.from('user_progress')
              .select('lesson_id')
              .eq('user_id', userId)
              .eq('is_completed', true)
            : Promise.resolve({ data: null }),
          (userId && isValidUUID(userId))
            ? supabase.from('perfis')
              .select('is_admin')
              .eq('id', userId)
              .single()
            : Promise.resolve({ data: null })
        ]);

        // Admin check seguro — vem do Supabase, não do client
        setIsAdmin(perfilResult.data?.is_admin === true);

        const lessonsData = lessonsResult.data;
        const termsData = termsResult.data;
        const progressData = progressResult.data;

        const ids = progressData?.map((p: any) => p.lesson_id) || [];
        setCompletedLessonIds(ids);

        const mappedLessons: Lesson[] = (lessonsData || []).map((l: any) => ({
          ...l,
          titulo: l.title_short,
          tituloCompleto: l.title_full,
          nivel: l.level,
          duracao: l.duration,
          descricao: l.description,
          transcricaoCompleta: l.transcript_html
        }));
        setLessons(mappedLessons);

        const mappedTerms: Term[] = (termsData || []).map((t: any) => {
          const parentLesson = mappedLessons.find(l => l.id === t.lesson_id);
          return {
            ...t,
            sigla: t.acronym,
            nome: t.name,
            explicacaoCompleta: t.explanation_full,
            explicacaoSimplificada: t.explanation_simple,
            exemplo: t.example,
            dicaComoComecar: t.tip,
            nivelId: parentLesson?.nivel || 'fundamentos',
            aulaAssociadaId: t.lesson_id
          };
        });

        setAllTerms(mappedTerms);

      } catch (error: any) {
        console.error("Erro ao carregar dados:", error);

        if (error?.code === 'PGRST116' || error?.message?.includes('JWT')) {
          toast({
            title: "Sessão expirada",
            description: "Por favor, faça login novamente",
            variant: "destructive"
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  // Filter Terms
  const termosDaAula = useMemo(() => {
    if (!allTerms.length || !currentAula) return [];

    // Strip HTML tags to avoid matching class names (e.g. "pl-4" for padding-left matching "PL")
    const stripHtml = (html: string) => {
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
    };

    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const cleanTranscript = stripHtml(currentAula.transcricaoCompleta || "").toLowerCase();

    return allTerms.filter(term => {
      if (!term || !term.nome) return false;
      // Check if term appears in CLEAN text (no HTML tags)
      const name = term.nome?.toLowerCase();
      const acronym = term.sigla?.toLowerCase();

      // Use word boundaries. For very short acronyms (2 chars), enforce stricter matching if needed, 
      // but stripping HTML usually solves the "pl-4" issue.
      const hasName = name && new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(cleanTranscript);
      const hasAcronym = acronym && new RegExp(`\\b${escapeRegExp(acronym)}\\b`, 'i').test(cleanTranscript);

      return hasName || hasAcronym;
    });
  }, [currentAulaId, currentAula, allTerms]);

  // Loading State
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Carregando conteúdo...</p>
          </div>
        </div>
      </Layout>
    );
  }



  return (
    <Layout>
      <TooltipProvider>
        <div className="flex flex-col lg:flex-row min-h-screen lg:h-[calc(100vh-80px)] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 lg:overflow-hidden relative">

          {/* Guest Banner (Player Mode - Floating) */}
          {!user && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md">
              <div className="bg-slate-900/90 backdrop-blur-xl border border-primary/30 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
                <div className="text-xs text-slate-300">
                  <span className="block font-bold text-white mb-0.5">Progresso não salvo</span>
                  Entre para garantir seus pontos.
                </div>
                <Button
                  size="sm"
                  onClick={() => window.location.href = '/login'}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                  Entrar
                </Button>
              </div>
            </div>
          )}

          <LessonSidebar
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            lessons={lessons}
            currentAulaId={currentAulaId}
            completedLessonIds={completedLessonIds}
            handleLessonChange={handleLessonChange}
            isAdmin={isAdmin}

            user={user}
          />


          <LessonContent
            currentAula={currentAula}
            totalLessons={lessons.length}
            termosDaAula={termosDaAula}
            handleLessonChange={handleLessonChange}
            currentAulaId={currentAulaId}
            canComplete={canComplete}
            timeLeft={timeLeft}
            timeLimit={TIME_LIMIT}
            handleCompleteAndNext={handleCompleteAndNext}
            xpAmount={xpAmount}
            isAdmin={isAdmin}
            aulaFinalizada={completedLessonIds.includes(currentAulaId)}
          />
        </div>
      </TooltipProvider>
    </Layout>
  );
}
