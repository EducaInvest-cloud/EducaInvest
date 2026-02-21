import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';


import { Lesson } from '@/lib/types';

const TIME_LIMIT = 30; // 30 seconds

export function useLessonProgress(
    lessons: Lesson[],
    user: any,
    completedLessonIds: number[],
    setCompletedLessonIds: Dispatch<SetStateAction<number[]>>,
    isAdmin: boolean = false
) {
    const { toast } = useToast();


    // State for current lesson
    const [searchParams] = useSearchParams();
    const urlAulaId = searchParams.get('aulaId');

    // State for current lesson
    const [currentAulaId, setCurrentAulaId] = useState(urlAulaId ? parseInt(urlAulaId) : 1);

    // Sincroniza o estado se o parâmetro da URL mudar
    useEffect(() => {
        if (urlAulaId) {
            const parsed = parseInt(urlAulaId);
            if (!isNaN(parsed) && parsed !== currentAulaId) {
                setCurrentAulaId(parsed);
            }
        }
    }, [urlAulaId]);


    // Timer and state
    const [timeLeft, setTimeLeft] = useState(isAdmin ? 0 : TIME_LIMIT);
    const [canComplete, setCanComplete] = useState(isAdmin);

    // Computed current lesson object
    const currentAula = lessons.find(a => a.id === currentAulaId) || lessons[0];

    useEffect(() => {
        if (isAdmin) {
            setTimeLeft(0);
            setCanComplete(true);
            return;
        }

        setTimeLeft(TIME_LIMIT);
        setCanComplete(false);
    }, [currentAulaId, isAdmin]);

    useEffect(() => {
        if (isAdmin) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setCanComplete(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentAulaId, isAdmin]); // Starts on lesson change or admin change

    const handleLessonChange = (newId: number) => {
        setCurrentAulaId(newId);
        window.scrollTo(0, 0);

        if (user) {
            supabase.from('user_progress').upsert({
                user_id: user.id,
                lesson_id: newId,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,lesson_id' }).then(({ error }) => {
                if (error) console.error("Erro ao salvar aula atual:", error);
            });
        }
    };

    const getXpReward = (nivel?: string) => {
        const rewards: Record<string, number> = {
            'fundamentos': 100,
            'pratica': 300,
            'alta_performance': 500,
            'especialista-fii': 800,
            'especialista-acao': 800,
            'especialista-rf': 800,
        };
        return rewards[nivel?.toLowerCase() || 'fundamentos'] || 100;
    };

    const handleCompleteAndNext = async () => {
        // Se a aula já foi concluída, apenas avança sem dar XP
        if (completedLessonIds.includes(currentAulaId)) {
            if (currentAulaId < lessons.length) {
                handleLessonChange(currentAulaId + 1);
                toast({
                    title: "Avançando para próxima aula",
                    description: "Aula já concluída anteriormente.",
                });
            } else {
                toast({
                    title: "Curso Concluído",
                    description: "Você já finalizou todas as aulas!",
                });
            }
            return;
        }

        if (!canComplete || !user) return;

        const currentLevel = currentAula.nivel || currentAula.level;
        const isLastOfCourse = currentAulaId === lessons.length;
        const xpAmount = getXpReward(currentLevel);

        try {
            const { error: progressError } = await supabase.from('user_progress').upsert({
                user_id: user.id,
                lesson_id: currentAulaId,
                is_completed: true,
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,lesson_id' });

            if (progressError) throw progressError;

            setCompletedLessonIds(prev => [...prev, currentAulaId]);

            // Chamada segura via RPC server-side (impede manipulação pelo cliente)
            await supabase.rpc('add_user_xp', {
                p_user_id: user.id,
                p_amount: xpAmount
            });

            window.dispatchEvent(new CustomEvent('educainvest_xp_updated'));

            toast({
                title: `+${xpAmount} XP Conquistados!`,
                description: isLastOfCourse ? "🎉 Parabéns! Você concluiu o curso!" : "Progresso salvo com sucesso.",
                className: "bg-emerald-500 border-none text-white"
            });

        } catch (error) {
            console.error("Erro ao salvar XP:", error);
            toast({
                title: "Erro ao salvar",
                description: "Verifique sua conexão e tente novamente.",
                variant: "destructive"
            });
            return;
        }

        if (currentAulaId < lessons.length) {
            handleLessonChange(currentAulaId + 1);
        }
    };

    return {
        currentAulaId,
        currentAula,
        timeLeft,
        canComplete,
        handleLessonChange,
        handleCompleteAndNext,
        TIME_LIMIT,
        xpAmount: currentAula ? getXpReward(currentAula.nivel || currentAula.level) : 0
    };
}
