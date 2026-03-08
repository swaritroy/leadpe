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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      build_requests: {
        Row: {
          assigned_coder_id: string | null
          assigned_coder_name: string | null
          business_id: string | null
          business_name: string | null
          business_type: string | null
          city: string | null
          coder_earning: number | null
          created_at: string | null
          deadline: string | null
          deploy_url: string | null
          deployed_at: string | null
          github_url: string | null
          id: string
          owner_name: string | null
          owner_whatsapp: string | null
          package_id: string | null
          package_price: number | null
          plan_selected: string | null
          practice_build: boolean | null
          reference_sites: string | null
          special_requirements: string | null
          status: string | null
          submitted_at: string | null
          website_purpose: string | null
        }
        Insert: {
          assigned_coder_id?: string | null
          assigned_coder_name?: string | null
          business_id?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          coder_earning?: number | null
          created_at?: string | null
          deadline?: string | null
          deploy_url?: string | null
          deployed_at?: string | null
          github_url?: string | null
          id?: string
          owner_name?: string | null
          owner_whatsapp?: string | null
          package_id?: string | null
          package_price?: number | null
          plan_selected?: string | null
          practice_build?: boolean | null
          reference_sites?: string | null
          special_requirements?: string | null
          status?: string | null
          submitted_at?: string | null
          website_purpose?: string | null
        }
        Update: {
          assigned_coder_id?: string | null
          assigned_coder_name?: string | null
          business_id?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          coder_earning?: number | null
          created_at?: string | null
          deadline?: string | null
          deploy_url?: string | null
          deployed_at?: string | null
          github_url?: string | null
          id?: string
          owner_name?: string | null
          owner_whatsapp?: string | null
          package_id?: string | null
          package_price?: number | null
          plan_selected?: string | null
          practice_build?: boolean | null
          reference_sites?: string | null
          special_requirements?: string | null
          status?: string | null
          submitted_at?: string | null
          website_purpose?: string | null
        }
        Relationships: []
      }
      business_seo: {
        Row: {
          about_text: string | null
          business_id: string | null
          business_name: string | null
          generated_at: string | null
          google_description: string | null
          h1_heading: string | null
          id: string
          keywords: string | null
          meta_description: string | null
          page_title: string | null
          whatsapp_bio: string | null
        }
        Insert: {
          about_text?: string | null
          business_id?: string | null
          business_name?: string | null
          generated_at?: string | null
          google_description?: string | null
          h1_heading?: string | null
          id?: string
          keywords?: string | null
          meta_description?: string | null
          page_title?: string | null
          whatsapp_bio?: string | null
        }
        Update: {
          about_text?: string | null
          business_id?: string | null
          business_name?: string | null
          generated_at?: string | null
          google_description?: string | null
          h1_heading?: string | null
          id?: string
          keywords?: string | null
          meta_description?: string | null
          page_title?: string | null
          whatsapp_bio?: string | null
        }
        Relationships: []
      }
      businesses: {
        Row: {
          addon_booking: boolean
          addon_chatbot: boolean
          addon_sms: boolean
          addon_whatsapp: boolean
          business_hours: string | null
          business_type: string | null
          city: string | null
          contact_info: Json | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          owner_name: string | null
          referral_code: string | null
          service_pricing: Json | null
          slug: string
          special_offer: string | null
          starting_price: string | null
          subscription_active: boolean
          theme_json: Json | null
          timing: string | null
          trial_active: boolean | null
          trial_start_date: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          addon_booking?: boolean
          addon_chatbot?: boolean
          addon_sms?: boolean
          addon_whatsapp?: boolean
          business_hours?: string | null
          business_type?: string | null
          city?: string | null
          contact_info?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          owner_name?: string | null
          referral_code?: string | null
          service_pricing?: Json | null
          slug: string
          special_offer?: string | null
          starting_price?: string | null
          subscription_active?: boolean
          theme_json?: Json | null
          timing?: string | null
          trial_active?: boolean | null
          trial_start_date?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          addon_booking?: boolean
          addon_chatbot?: boolean
          addon_sms?: boolean
          addon_whatsapp?: boolean
          business_hours?: string | null
          business_type?: string | null
          city?: string | null
          contact_info?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          owner_name?: string | null
          referral_code?: string | null
          service_pricing?: Json | null
          slug?: string
          special_offer?: string | null
          starting_price?: string | null
          subscription_active?: boolean
          theme_json?: Json | null
          timing?: string | null
          trial_active?: boolean | null
          trial_start_date?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      deployments: {
        Row: {
          building_fee: number | null
          business_id: string | null
          business_name: string | null
          business_type: string | null
          city: string | null
          converted: boolean | null
          created_at: string | null
          day1_sent: boolean | null
          day2_sent: boolean | null
          day3_sent: boolean | null
          day4_sent: boolean | null
          day5_sent: boolean | null
          day6_sent: boolean | null
          day7_sent: boolean | null
          github_url: string | null
          id: string
          indexnow_pinged: boolean | null
          leadpe_commission: number | null
          meta_keywords: string | null
          monthly_passive: number | null
          og_tags: string | null
          owner_name: string | null
          owner_whatsapp: string | null
          schema_markup: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_schema: string | null
          seo_title: string | null
          status: string | null
          subdomain: string | null
          trial_day: number | null
          trial_start_date: string | null
          url_slug: string | null
          vibe_coder_earning: number | null
          vibe_coder_id: string | null
        }
        Insert: {
          building_fee?: number | null
          business_id?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          converted?: boolean | null
          created_at?: string | null
          day1_sent?: boolean | null
          day2_sent?: boolean | null
          day3_sent?: boolean | null
          day4_sent?: boolean | null
          day5_sent?: boolean | null
          day6_sent?: boolean | null
          day7_sent?: boolean | null
          github_url?: string | null
          id?: string
          indexnow_pinged?: boolean | null
          leadpe_commission?: number | null
          meta_keywords?: string | null
          monthly_passive?: number | null
          og_tags?: string | null
          owner_name?: string | null
          owner_whatsapp?: string | null
          schema_markup?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_schema?: string | null
          seo_title?: string | null
          status?: string | null
          subdomain?: string | null
          trial_day?: number | null
          trial_start_date?: string | null
          url_slug?: string | null
          vibe_coder_earning?: number | null
          vibe_coder_id?: string | null
        }
        Update: {
          building_fee?: number | null
          business_id?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          converted?: boolean | null
          created_at?: string | null
          day1_sent?: boolean | null
          day2_sent?: boolean | null
          day3_sent?: boolean | null
          day4_sent?: boolean | null
          day5_sent?: boolean | null
          day6_sent?: boolean | null
          day7_sent?: boolean | null
          github_url?: string | null
          id?: string
          indexnow_pinged?: boolean | null
          leadpe_commission?: number | null
          meta_keywords?: string | null
          monthly_passive?: number | null
          og_tags?: string | null
          owner_name?: string | null
          owner_whatsapp?: string | null
          schema_markup?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_schema?: string | null
          seo_title?: string | null
          status?: string | null
          subdomain?: string | null
          trial_day?: number | null
          trial_start_date?: string | null
          url_slug?: string | null
          vibe_coder_earning?: number | null
          vibe_coder_id?: string | null
        }
        Relationships: []
      }
      earnings: {
        Row: {
          amount: number | null
          created_at: string | null
          deployment_id: string | null
          id: string
          month: string | null
          paid: boolean | null
          paid_at: string | null
          type: string | null
          vibe_coder_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          deployment_id?: string | null
          id?: string
          month?: string | null
          paid?: boolean | null
          paid_at?: string | null
          type?: string | null
          vibe_coder_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          deployment_id?: string | null
          id?: string
          month?: string | null
          paid?: boolean | null
          paid_at?: string | null
          type?: string | null
          vibe_coder_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          business_id: string
          created_at: string
          customer_email: string | null
          customer_name: string
          id: string
          message: string | null
          phone: string | null
          source: string | null
          status: string
          value: number | null
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_email?: string | null
          customer_name: string
          id?: string
          message?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          value?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      message_log: {
        Row: {
          business_id: string | null
          channel: string | null
          id: string
          language: string | null
          message: string | null
          message_type: string | null
          sent_at: string | null
          status: string | null
          to_number: string | null
        }
        Insert: {
          business_id?: string | null
          channel?: string | null
          id?: string
          language?: string | null
          message?: string | null
          message_type?: string | null
          sent_at?: string | null
          status?: string | null
          to_number?: string | null
        }
        Update: {
          business_id?: string | null
          channel?: string | null
          id?: string
          language?: string | null
          message?: string | null
          message_type?: string | null
          sent_at?: string | null
          status?: string | null
          to_number?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          activated_at: string | null
          amount: number | null
          business_id: string | null
          business_name: string | null
          created_at: string | null
          gateway_order_id: string | null
          gst: number | null
          id: string
          method: string | null
          plan: string | null
          status: string | null
          total: number | null
        }
        Insert: {
          activated_at?: string | null
          amount?: number | null
          business_id?: string | null
          business_name?: string | null
          created_at?: string | null
          gateway_order_id?: string | null
          gst?: number | null
          id?: string
          method?: string | null
          plan?: string | null
          status?: string | null
          total?: number | null
        }
        Update: {
          activated_at?: string | null
          amount?: number | null
          business_id?: string | null
          business_name?: string | null
          created_at?: string | null
          gateway_order_id?: string | null
          gst?: number | null
          id?: string
          method?: string | null
          plan?: string | null
          status?: string | null
          total?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_name: string | null
          business_type: string | null
          city: string | null
          created_at: string
          display_name: string | null
          email: string | null
          founding_member: boolean | null
          full_name: string | null
          id: string
          monthly_capacity: string | null
          monthly_passive: number | null
          onboarding_complete: boolean | null
          plan_renewal_date: string | null
          plan_status: string | null
          preferred_fee: number | null
          preferred_language: string | null
          role: string | null
          site_url: string | null
          status: string | null
          subscription_plan: string | null
          total_earned: number | null
          total_sites_built: number | null
          total_sites_live: number | null
          trial_code: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          upi_id: string | null
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          founding_member?: boolean | null
          full_name?: string | null
          id?: string
          monthly_capacity?: string | null
          monthly_passive?: number | null
          onboarding_complete?: boolean | null
          plan_renewal_date?: string | null
          plan_status?: string | null
          preferred_fee?: number | null
          preferred_language?: string | null
          role?: string | null
          site_url?: string | null
          status?: string | null
          subscription_plan?: string | null
          total_earned?: number | null
          total_sites_built?: number | null
          total_sites_live?: number | null
          trial_code?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          upi_id?: string | null
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          founding_member?: boolean | null
          full_name?: string | null
          id?: string
          monthly_capacity?: string | null
          monthly_passive?: number | null
          onboarding_complete?: boolean | null
          plan_renewal_date?: string | null
          plan_status?: string | null
          preferred_fee?: number | null
          preferred_language?: string | null
          role?: string | null
          site_url?: string | null
          status?: string | null
          subscription_plan?: string | null
          total_earned?: number | null
          total_sites_built?: number | null
          total_sites_live?: number | null
          trial_code?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          upi_id?: string | null
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          business_id: string | null
          category: string | null
          code_content: string | null
          created_at: string
          dev_id: string
          id: string
          mobile_score: number | null
          performance_score: number | null
          seo_score: number | null
          status: string
          title: string
          updated_at: string
          vetting_score: number | null
        }
        Insert: {
          business_id?: string | null
          category?: string | null
          code_content?: string | null
          created_at?: string
          dev_id: string
          id?: string
          mobile_score?: number | null
          performance_score?: number | null
          seo_score?: number | null
          status?: string
          title: string
          updated_at?: string
          vetting_score?: number | null
        }
        Update: {
          business_id?: string | null
          category?: string | null
          code_content?: string | null
          created_at?: string
          dev_id?: string
          id?: string
          mobile_score?: number | null
          performance_score?: number | null
          seo_score?: number | null
          status?: string
          title?: string
          updated_at?: string
          vetting_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_reports: {
        Row: {
          ai_suggestions: string | null
          build_request_id: string | null
          checks: Json | null
          created_at: string
          fixes: Json | null
          id: string
          issues: Json | null
          passed: boolean
          score: number
        }
        Insert: {
          ai_suggestions?: string | null
          build_request_id?: string | null
          checks?: Json | null
          created_at?: string
          fixes?: Json | null
          id?: string
          issues?: Json | null
          passed?: boolean
          score?: number
        }
        Update: {
          ai_suggestions?: string | null
          build_request_id?: string | null
          checks?: Json | null
          created_at?: string
          fixes?: Json | null
          id?: string
          issues?: Json | null
          passed?: boolean
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "quality_reports_build_request_id_fkey"
            columns: ["build_request_id"]
            isOneToOne: false
            referencedRelation: "build_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          sent_at: string | null
          status: string | null
          to: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          sent_at?: string | null
          status?: string | null
          to: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          sent_at?: string | null
          status?: string | null
          to?: string
          type?: string | null
        }
        Relationships: []
      }
      signups: {
        Row: {
          business_name: string
          business_type: string | null
          city: string | null
          created_at: string | null
          id: string
          owner_name: string | null
          plan_selected: string | null
          preferred_language: string | null
          status: string | null
          trial_code: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          whatsapp_number: string
        }
        Insert: {
          business_name: string
          business_type?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          owner_name?: string | null
          plan_selected?: string | null
          preferred_language?: string | null
          status?: string | null
          trial_code?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          whatsapp_number: string
        }
        Update: {
          business_name?: string
          business_type?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          owner_name?: string | null
          plan_selected?: string | null
          preferred_language?: string | null
          status?: string | null
          trial_code?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          whatsapp_number?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_business_owner: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_subscription_active: {
        Args: { _business_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "business" | "developer"
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
    Enums: {
      app_role: ["admin", "business", "developer"],
    },
  },
} as const
