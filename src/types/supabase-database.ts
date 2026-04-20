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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      central_deployments: {
        Row: {
          academic_year: string
          activation_at: string | null
          created_at: string
          deadline_at: string | null
          id: string
          instrument_version_id: string
          program_id: string | null
          semester: string
          status: string
          target_stakeholder: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          activation_at?: string | null
          created_at?: string
          deadline_at?: string | null
          id?: string
          instrument_version_id: string
          program_id?: string | null
          semester: string
          status: string
          target_stakeholder: string
          updated_at: string
        }
        Update: {
          academic_year?: string
          activation_at?: string | null
          created_at?: string
          deadline_at?: string | null
          id?: string
          instrument_version_id?: string
          program_id?: string | null
          semester?: string
          status?: string
          target_stakeholder?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "central_deployments_instrument_version_id_fkey"
            columns: ["instrument_version_id"]
            isOneToOne: false
            referencedRelation: "instrument_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "central_deployments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      cilo_mappings: {
        Row: {
          cilo_id: string
          created_at: string
          go_id: string | null
          id: string
          plo_id: string | null
        }
        Insert: {
          cilo_id: string
          created_at?: string
          go_id?: string | null
          id?: string
          plo_id?: string | null
        }
        Update: {
          cilo_id?: string
          created_at?: string
          go_id?: string | null
          id?: string
          plo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cilo_mappings_cilo_id_fkey"
            columns: ["cilo_id"]
            isOneToOne: false
            referencedRelation: "cilos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cilo_mappings_go_id_fkey"
            columns: ["go_id"]
            isOneToOne: false
            referencedRelation: "gos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cilo_mappings_plo_id_fkey"
            columns: ["plo_id"]
            isOneToOne: false
            referencedRelation: "plos"
            referencedColumns: ["id"]
          },
        ]
      }
      cilos: {
        Row: {
          academic_term: string
          course_id: string
          created_at: string
          created_by: string
          description: string
          id: string
          order: number
          updated_at: string
        }
        Insert: {
          academic_term: string
          course_id: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          order: number
          updated_at: string
        }
        Update: {
          academic_term?: string
          course_id?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cilos_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cilos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_bound_evaluations: {
        Row: {
          academic_year: string
          activation_at: string | null
          cilos_snapshot: Json
          course_id: string
          course_info_snapshot: Json
          created_at: string
          deadline_at: string | null
          faculty_id: string
          id: string
          instrument_version_id: string
          major_id: string | null
          program_id: string
          published_at: string | null
          semester: string
          status: string
          term: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          activation_at?: string | null
          cilos_snapshot: Json
          course_id: string
          course_info_snapshot: Json
          created_at?: string
          deadline_at?: string | null
          faculty_id: string
          id?: string
          instrument_version_id: string
          major_id?: string | null
          program_id: string
          published_at?: string | null
          semester: string
          status: string
          term: string
          updated_at: string
        }
        Update: {
          academic_year?: string
          activation_at?: string | null
          cilos_snapshot?: Json
          course_id?: string
          course_info_snapshot?: Json
          created_at?: string
          deadline_at?: string | null
          faculty_id?: string
          id?: string
          instrument_version_id?: string
          major_id?: string | null
          program_id?: string
          published_at?: string | null
          semester?: string
          status?: string
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_bound_evaluations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_bound_evaluations_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_bound_evaluations_instrument_version_id_fkey"
            columns: ["instrument_version_id"]
            isOneToOne: false
            referencedRelation: "instrument_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_bound_evaluations_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_bound_evaluations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      course_types: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          code: string
          course_type_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          program_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          course_type_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          program_id?: string | null
          title: string
          updated_at: string
        }
        Update: {
          code?: string
          course_type_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          program_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_course_type_id_fkey"
            columns: ["course_type_id"]
            isOneToOne: false
            referencedRelation: "course_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_assignments: {
        Row: {
          assigned_at: string
          central_deployment_id: string | null
          course_bound_id: string | null
          id: string
          respondent_id: string
        }
        Insert: {
          assigned_at?: string
          central_deployment_id?: string | null
          course_bound_id?: string | null
          id?: string
          respondent_id: string
        }
        Update: {
          assigned_at?: string
          central_deployment_id?: string | null
          course_bound_id?: string | null
          id?: string
          respondent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_assignments_central_deployment_id_fkey"
            columns: ["central_deployment_id"]
            isOneToOne: false
            referencedRelation: "central_deployments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_assignments_course_bound_id_fkey"
            columns: ["course_bound_id"]
            isOneToOne: false
            referencedRelation: "course_bound_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_assignments_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gos: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          order: number
          program_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          order: number
          program_id: string
          updated_at: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          order?: number
          program_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gos_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      instrument_templates: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          structure: Json
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          structure: Json
          updated_at: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          structure?: Json
          updated_at?: string
        }
        Relationships: []
      }
      instrument_versions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          structure_snapshot: Json
          template_id: string
          updated_at: string
          version_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          structure_snapshot: Json
          template_id: string
          updated_at: string
          version_number: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          structure_snapshot?: Json
          template_id?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "instrument_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "instrument_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      majors: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          program_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          program_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          program_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "majors_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      plos: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          order: number
          program_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          order: number
          program_id: string
          updated_at: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          order?: number
          program_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plos_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      qualitative_response_items: {
        Row: {
          created_at: string
          id: string
          prompt_key: string
          response_id: string
          section_key: string
          text_content: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt_key: string
          response_id: string
          section_key: string
          text_content: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt_key?: string
          response_id?: string
          section_key?: string
          text_content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualitative_response_items_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
        ]
      }
      quantitative_response_items: {
        Row: {
          created_at: string
          id: string
          item_key: string
          rating_value: number
          response_id: string
          section_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_key: string
          rating_value: number
          response_id: string
          section_key: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          item_key?: string
          rating_value?: number
          response_id?: string
          section_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quantitative_response_items_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          assignment_id: string
          created_at: string
          deployment_id: string
          deployment_type: string
          id: string
          respondent_id: string
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          deployment_id: string
          deployment_type: string
          id?: string
          respondent_id: string
          status: string
          submitted_at?: string | null
          updated_at: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          deployment_id?: string
          deployment_type?: string
          id?: string
          respondent_id?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "evaluation_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          academic_year: string
          created_at: string
          id: string
          name: string
          program_id: string
          semester: string
          updated_at: string
          year_level_id: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          id?: string
          name: string
          program_id: string
          semester: string
          updated_at: string
          year_level_id: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          id?: string
          name?: string
          program_id?: string
          semester?: string
          updated_at?: string
          year_level_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_year_level_id_fkey"
            columns: ["year_level_id"]
            isOneToOne: false
            referencedRelation: "year_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      student_academic_profiles: {
        Row: {
          academic_year: string
          created_at: string
          id: string
          major_id: string | null
          program_id: string
          section_id: string | null
          student_id_number: string | null
          updated_at: string
          user_id: string
          year_level_id: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          id?: string
          major_id?: string | null
          program_id: string
          section_id?: string | null
          student_id_number?: string | null
          updated_at: string
          user_id: string
          year_level_id: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          id?: string
          major_id?: string | null
          program_id?: string
          section_id?: string | null
          student_id_number?: string | null
          updated_at?: string
          user_id?: string
          year_level_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_academic_profiles_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_profiles_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_profiles_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_profiles_year_level_id_fkey"
            columns: ["year_level_id"]
            isOneToOne: false
            referencedRelation: "year_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          updated_at: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      year_levels: {
        Row: {
          id: string
          name: string
          order: number
        }
        Insert: {
          id?: string
          name: string
          order: number
        }
        Update: {
          id?: string
          name?: string
          order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
