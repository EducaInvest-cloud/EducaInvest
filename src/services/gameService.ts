import { supabase } from "@/integrations/supabase/client";

export interface GameQuestion {
    id: number;
    game_type: 'consultor' | 'termo';
    content: any;
    difficulty: string;
}

export interface EmpireItem {
    id: number;
    name: string;
    type: 'active' | 'passive';
    base_cost: number;
    base_income: number;
    description: string;
}

export const gameService = {
    async getConsultorQuestions() {
        const { data, error } = await supabase
            .from('consultor_questions')
            .select('*');

        if (error) throw error;
        // Map the new table structure back to GameQuestion format for frontend compatibility if needed, 
        // OR update the frontend to use the new structure. 
        // Given the code in OConsultor expects a nested 'content' object, we might need to adapt.
        // The new table has 'text', 'type', etc directly on columns.
        // Let's adapt here to return the expected structure OR update the component.
        // Adapting here is safer to avoid breaking changes in components.
        return data.map(q => ({
            id: q.id,
            game_type: 'consultor',
            content: {
                text: q.text,
                type: q.type,
                explanation: q.explanation,
                icon: q.icon,
            },
            difficulty: q.difficulty
        })) as GameQuestion[];
    },

    async getTermPairs() {
        const { data, error } = await supabase
            .from('term_questions')
            .select('*');

        if (error) throw error;

        return data.map(q => ({
            id: q.id,
            game_type: 'termo',
            content: {
                term: q.term,
                definition: q.definition
            },
            difficulty: q.difficulty
        })) as GameQuestion[];
    },

    async getEmpireItems() {
        const { data, error } = await supabase
            .from('empire_items')
            .select('*')
            .order('base_cost', { ascending: true });

        if (error) throw error;
        return data as EmpireItem[];
    },

    async addUserXP(userId: string, amount: number) {
        if (!userId || amount <= 0) return;

        // Fetch current XP
        const { data: profile, error: fetchError } = await supabase
            .from('perfis')
            .select('xp_total')
            .eq('id', userId)
            .single();

        if (fetchError) {
            console.error("Error fetching user XP for game:", fetchError);
            return;
        }

        const newTotal = (profile?.xp_total || 0) + amount;

        // Update XP
        const { error: updateError } = await supabase
            .from('perfis')
            .update({ xp_total: newTotal })
            .eq('id', userId);

        if (updateError) {
            console.error("Error updating user XP for game:", updateError);
        } else {
            // Emit event for UI updates (e.g. sidebar XP counter)
            window.dispatchEvent(new CustomEvent('educainvest_xp_updated'));
        }
    },

    async resetXP(userId: string) {
        if (!userId) return { success: false };
        try {
            const { error } = await supabase
                .from('perfis')
                .update({
                    xp_total: 0,
                    current_level: 'Iniciante'
                })
                .eq('id', userId);

            if (error) throw error;
            window.dispatchEvent(new CustomEvent('educainvest_xp_updated'));
            return { success: true };
        } catch (error) {
            console.error("Error resetting XP:", error);
            return { success: false, error };
        }
    },

    async resetLessons(userId: string) {
        if (!userId) return { success: false };
        try {
            const { error } = await supabase
                .from('user_progress')
                .delete()
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error("Error resetting lessons:", error);
            return { success: false, error };
        }
    },

    async resetEmpireBuilder() {
        try {
            localStorage.removeItem('empireSave');
            return { success: true };
        } catch (error) {
            console.error("Error resetting Empire Builder:", error);
            return { success: false, error };
        }
    },

    async resetUserProgress(userId: string) {
        if (!userId) return { success: false };

        try {
            const xpResult = await this.resetXP(userId);
            if (!xpResult.success) throw xpResult.error;

            const lessonsResult = await this.resetLessons(userId);
            if (!lessonsResult.success) throw lessonsResult.error;

            return { success: true };
        } catch (error) {
            console.error("Error resetting user progress:", error);
            return { success: false, error };
        }
    }
};
