export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      dados_mercado: {
        Row: {
          historico_precos: Json | null
          id: string
          preco_atual: number | null
          ticker: string
          ultima_atualizacao: string | null
          variacao_dia: number | null
        }
        Insert: {
          historico_precos?: Json | null
          id?: string
          preco_atual?: number | null
          ticker: string
          ultima_atualizacao?: string | null
          variacao_dia?: number | null
        }
        Update: {
          historico_precos?: Json | null
          id?: string
          preco_atual?: number | null
          ticker?: string
          ultima_atualizacao?: string | null
          variacao_dia?: number | null
        }
        Relationships: []
      }
      empire_items: {
        Row: {
          base_cost: number
          base_income: number
          created_at: string
          description: string | null
          id: number
          name: string
          type: string
        }
        Insert: {
          base_cost: number
          base_income: number
          created_at?: string
          description?: string | null
          id?: number
          name: string
          type: string
        }
        Update: {
          base_cost?: number
          base_income?: number
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          type?: string
        }
        Relationships: []
      }
      game_questions: {
        Row: {
          content: Json
          created_at: string
          difficulty: string | null
          game_type: string
          id: number
        }
        Insert: {
          content: Json
          created_at?: string
          difficulty?: string | null
          game_type: string
          id?: number
        }
        Update: {
          content?: Json
          created_at?: string
          difficulty?: string | null
          game_type?: string
          id?: number
        }
        Relationships: []
      }
      lessons: {
        Row: {
          created_at: string
          description: string | null
          duration: string
          id: number
          level: string
          order_index: number
          title_full: string
          title_short: string
          transcript_html: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration: string
          id?: number
          level: string
          order_index: number
          title_full: string
          title_short: string
          transcript_html?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: string
          id?: number
          level?: string
          order_index?: number
          title_full?: string
          title_short?: string
          transcript_html?: string | null
        }
        Relationships: []
      }
      perfis: {
        Row: {
          criado_em: string | null
          current_level: string | null
          email: string | null
          id: string
          nome_completo: string | null
          url_avatar: string | null
          xp_total: number | null
        }
        Insert: {
          criado_em?: string | null
          current_level?: string | null
          email?: string | null
          id: string
          nome_completo?: string | null
          url_avatar?: string | null
          xp_total?: number | null
        }
        Update: {
          criado_em?: string | null
          current_level?: string | null
          email?: string | null
          id?: string
          nome_completo?: string | null
          url_avatar?: string | null
          xp_total?: number | null
        }
        Relationships: []
      }
      simulacoes: {
        Row: {
          aporte_mensal: number | null
          criado_em: string | null
          id: string
          prazo_meses: number
          resultado_estimado: number | null
          tipo_ativo: string
          usuario_id: string | null
          valor_inicial: number
        }
        Insert: {
          aporte_mensal?: number | null
          criado_em?: string | null
          id?: string
          prazo_meses: number
          resultado_estimado?: number | null
          tipo_ativo: string
          usuario_id?: string | null
          valor_inicial: number
        }
        Update: {
          aporte_mensal?: number | null
          criado_em?: string | null
          id?: string
          prazo_meses?: number
          resultado_estimado?: number | null
          tipo_ativo?: string
          usuario_id?: string | null
          valor_inicial?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          acronym: string
          category: string
          example: string | null
          explanation_full: string | null
          explanation_simple: string | null
          id: number
          lesson_id: number | null
          name: string
          tip: string | null
        }
        Insert: {
          acronym: string
          category: string
          example?: string | null
          explanation_full?: string | null
          explanation_simple?: string | null
          id?: number
          lesson_id?: number | null
          name: string
          tip?: string | null
        }
        Update: {
          acronym?: string
          category?: string
          example?: string | null
          explanation_full?: string | null
          explanation_simple?: string | null
          id?: number
          lesson_id?: number | null
          name?: string
          tip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terms_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      tips: {
        Row: {
          content: string
          created_at: string
          id: number
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          title?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed_at: string | null
          id: number
          is_completed: boolean | null
          lesson_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: number
          is_completed?: boolean | null
          lesson_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: number
          is_completed?: boolean | null
          lesson_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar_conteudo_educacional: {
        Args: { termo_busca: string }
        Returns: {
          corpo: string
          tipo: string
          titulo: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
