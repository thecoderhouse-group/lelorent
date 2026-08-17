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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      cities: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          name: string
          slug: string
          state: string
        }
        Insert: {
          created_at?: string
          id?: never
          is_active?: boolean
          name: string
          slug: string
          state: string
        }
        Update: {
          created_at?: string
          id?: never
          is_active?: boolean
          name?: string
          slug?: string
          state?: string
        }
        Relationships: []
      }
      contact_reveals: {
        Row: {
          created_at: string
          id: string
          last_revealed_at: string
          listing_id: string
          reveal_count: number
          viewer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_revealed_at?: string
          listing_id: string
          reveal_count?: number
          viewer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_revealed_at?: string
          listing_id?: string
          reveal_count?: number
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_reveals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_reveals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_reveals_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_photos: {
        Row: {
          blur_data_url: string | null
          bytes: number | null
          card_path: string
          created_at: string
          full_path: string
          height: number | null
          id: string
          listing_id: string
          position: number
          width: number | null
        }
        Insert: {
          blur_data_url?: string | null
          bytes?: number | null
          card_path: string
          created_at?: string
          full_path: string
          height?: number | null
          id?: string
          listing_id: string
          position?: number
          width?: number | null
        }
        Update: {
          blur_data_url?: string | null
          bytes?: number | null
          card_path?: string
          created_at?: string
          full_path?: string
          height?: number | null
          id?: string
          listing_id?: string
          position?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_reports: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          reason: string
          reporter_id: string | null
          resolved: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          reason: string
          reporter_id?: string | null
          resolved?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          reason?: string
          reporter_id?: string | null
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "listing_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address_line: string | null
          amenities: string[]
          available_from: string
          balconies: number | null
          bathrooms: number | null
          bedrooms: number | null
          carpet_area_sqft: number | null
          city: string
          city_id: number
          couples_allowed: boolean
          created_at: string
          deposit: number
          description: string | null
          drinking_allowed: boolean
          expires_at: string | null
          flat_type: Database["public"]["Enums"]["flat_type"]
          floor_number: number | null
          food_pref: Database["public"]["Enums"]["food_pref"]
          furnishing: Database["public"]["Enums"]["furnishing"]
          id: string
          listing_kind: Database["public"]["Enums"]["listing_kind"]
          locality: string
          locality_id: number
          maintenance: number
          maintenance_included: boolean
          min_stay_months: number | null
          owner_id: string
          parking: Database["public"]["Enums"]["parking_type"]
          pets_allowed: boolean
          photo_count: number
          pincode: string | null
          published_at: string | null
          rent: number
          search_vector: unknown
          smoking_allowed: boolean
          status: Database["public"]["Enums"]["listing_status"]
          tenant_prefs: Database["public"]["Enums"]["tenant_pref"][]
          title: string
          total_floors: number | null
          updated_at: string
          views_count: number
        }
        Insert: {
          address_line?: string | null
          amenities?: string[]
          available_from: string
          balconies?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          carpet_area_sqft?: number | null
          city?: string
          city_id: number
          couples_allowed?: boolean
          created_at?: string
          deposit?: number
          description?: string | null
          drinking_allowed?: boolean
          expires_at?: string | null
          flat_type: Database["public"]["Enums"]["flat_type"]
          floor_number?: number | null
          food_pref?: Database["public"]["Enums"]["food_pref"]
          furnishing?: Database["public"]["Enums"]["furnishing"]
          id?: string
          listing_kind: Database["public"]["Enums"]["listing_kind"]
          locality?: string
          locality_id: number
          maintenance?: number
          maintenance_included?: boolean
          min_stay_months?: number | null
          owner_id: string
          parking?: Database["public"]["Enums"]["parking_type"]
          pets_allowed?: boolean
          photo_count?: number
          pincode?: string | null
          published_at?: string | null
          rent: number
          search_vector?: unknown
          smoking_allowed?: boolean
          status?: Database["public"]["Enums"]["listing_status"]
          tenant_prefs?: Database["public"]["Enums"]["tenant_pref"][]
          title: string
          total_floors?: number | null
          updated_at?: string
          views_count?: number
        }
        Update: {
          address_line?: string | null
          amenities?: string[]
          available_from?: string
          balconies?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          carpet_area_sqft?: number | null
          city?: string
          city_id?: number
          couples_allowed?: boolean
          created_at?: string
          deposit?: number
          description?: string | null
          drinking_allowed?: boolean
          expires_at?: string | null
          flat_type?: Database["public"]["Enums"]["flat_type"]
          floor_number?: number | null
          food_pref?: Database["public"]["Enums"]["food_pref"]
          furnishing?: Database["public"]["Enums"]["furnishing"]
          id?: string
          listing_kind?: Database["public"]["Enums"]["listing_kind"]
          locality?: string
          locality_id?: number
          maintenance?: number
          maintenance_included?: boolean
          min_stay_months?: number | null
          owner_id?: string
          parking?: Database["public"]["Enums"]["parking_type"]
          pets_allowed?: boolean
          photo_count?: number
          pincode?: string | null
          published_at?: string | null
          rent?: number
          search_vector?: unknown
          smoking_allowed?: boolean
          status?: Database["public"]["Enums"]["listing_status"]
          tenant_prefs?: Database["public"]["Enums"]["tenant_pref"][]
          title?: string
          total_floors?: number | null
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_locality_in_city"
            columns: ["locality_id", "city_id"]
            isOneToOne: false
            referencedRelation: "localities"
            referencedColumns: ["id", "city_id"]
          },
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      localities: {
        Row: {
          city_id: number
          created_at: string
          id: number
          is_active: boolean
          name: string
          pincode: string | null
          slug: string
        }
        Insert: {
          city_id: number
          created_at?: string
          id?: never
          is_active?: boolean
          name: string
          pincode?: string | null
          slug: string
        }
        Update: {
          city_id?: number
          created_at?: string
          id?: never
          is_active?: boolean
          name?: string
          pincode?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "localities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: Database["public"]["Enums"]["plan_code"]
          created_at: string
          description: string
          duration_days: number | null
          gst_rate_bp: number
          is_active: boolean
          name: string
          price_paise: number
          reveal_quota: number | null
          sort_order: number
        }
        Insert: {
          code: Database["public"]["Enums"]["plan_code"]
          created_at?: string
          description: string
          duration_days?: number | null
          gst_rate_bp?: number
          is_active?: boolean
          name: string
          price_paise: number
          reveal_quota?: number | null
          sort_order?: number
        }
        Update: {
          code?: Database["public"]["Enums"]["plan_code"]
          created_at?: string
          description?: string
          duration_days?: number | null
          gst_rate_bp?: number
          is_active?: boolean
          name?: string
          price_paise?: number
          reveal_quota?: number | null
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_listings: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_paise: number
          created_at: string
          expires_at: string | null
          id: string
          plan_code: Database["public"]["Enums"]["plan_code"]
          provider: string | null
          provider_order_id: string | null
          provider_payment_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tax_paise: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_code: Database["public"]["Enums"]["plan_code"]
          provider?: string | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tax_paise?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_code?: Database["public"]["Enums"]["plan_code"]
          provider?: string | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tax_paise?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      listings_public: {
        Row: {
          amenities: string[] | null
          available_from: string | null
          balconies: number | null
          bathrooms: number | null
          bedrooms: number | null
          carpet_area_sqft: number | null
          city: string | null
          city_id: number | null
          city_slug: string | null
          couples_allowed: boolean | null
          cover_blur: string | null
          cover_card_path: string | null
          created_at: string | null
          deposit: number | null
          description: string | null
          drinking_allowed: boolean | null
          flat_type: Database["public"]["Enums"]["flat_type"] | null
          floor_number: number | null
          food_pref: Database["public"]["Enums"]["food_pref"] | null
          furnishing: Database["public"]["Enums"]["furnishing"] | null
          id: string | null
          listing_kind: Database["public"]["Enums"]["listing_kind"] | null
          locality: string | null
          locality_id: number | null
          locality_slug: string | null
          maintenance: number | null
          maintenance_included: boolean | null
          min_stay_months: number | null
          owner_avatar: string | null
          owner_name: string | null
          parking: Database["public"]["Enums"]["parking_type"] | null
          pets_allowed: boolean | null
          photo_count: number | null
          pincode: string | null
          published_at: string | null
          rent: number | null
          search_vector: unknown
          smoking_allowed: boolean | null
          status: Database["public"]["Enums"]["listing_status"] | null
          tenant_prefs: Database["public"]["Enums"]["tenant_pref"][] | null
          title: string | null
          total_floors: number | null
          views_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_locality_in_city"
            columns: ["locality_id", "city_id"]
            isOneToOne: false
            referencedRelation: "localities"
            referencedColumns: ["id", "city_id"]
          },
        ]
      }
    }
    Functions: {
      expire_subscriptions: { Args: never; Returns: number }
      free_reveal_quota: { Args: never; Returns: number }
      gst_split: {
        Args: { p_price_paise: number; p_rate_bp: number }
        Returns: {
          base_paise: number
          tax_paise: number
        }[]
      }
      has_active_premium: { Args: { p_user: string }; Returns: boolean }
      listing_is_published: { Args: { p_listing_id: string }; Returns: boolean }
      localities_for_city: {
        Args: { p_city_slug: string }
        Returns: {
          id: number
          name: string
          slug: string
        }[]
      }
      owns_listing: { Args: { p_listing_id: string }; Returns: boolean }
      owns_listing_path: { Args: { p_object_name: string }; Returns: boolean }
      reveal_contact: {
        Args: { p_listing_id: string }
        Returns: {
          owner_name: string
          owner_phone: string
          remaining: number
          result: Database["public"]["Enums"]["reveal_result"]
        }[]
      }
      reveal_status: {
        Args: { p_listing_id: string }
        Returns: {
          already_unlocked: boolean
          is_authenticated: boolean
          is_premium: boolean
          quota: number
          remaining: number
          used: number
        }[]
      }
    }
    Enums: {
      flat_type:
        | "1RK"
        | "1BHK"
        | "2BHK"
        | "3BHK"
        | "4BHK"
        | "4BHK_PLUS"
        | "PG_BED"
        | "SHARED_ROOM"
        | "PRIVATE_ROOM"
        | "INDEPENDENT_HOUSE"
      food_pref: "VEG_ONLY" | "EGGETARIAN" | "NON_VEG_ALLOWED" | "NO_PREFERENCE"
      furnishing: "UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED"
      listing_kind: "FLAT" | "ROOM" | "FLATMATE" | "PG"
      listing_status: "DRAFT" | "PUBLISHED" | "RENTED" | "EXPIRED" | "REMOVED"
      parking_type: "NONE" | "TWO_WHEELER" | "FOUR_WHEELER" | "BOTH"
      plan_code: "FREE" | "PREMIUM_1M"
      reveal_result:
        | "OK"
        | "NOT_AUTHENTICATED"
        | "NOT_FOUND"
        | "QUOTA_EXCEEDED"
        | "RATE_LIMITED"
      subscription_status:
        | "PENDING"
        | "ACTIVE"
        | "EXPIRED"
        | "CANCELLED"
        | "FAILED"
      tenant_pref:
        | "FAMILY"
        | "BACHELOR_MALE"
        | "BACHELOR_FEMALE"
        | "STUDENTS"
        | "WORKING_PROFESSIONALS"
        | "ANYONE"
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
      flat_type: [
        "1RK",
        "1BHK",
        "2BHK",
        "3BHK",
        "4BHK",
        "4BHK_PLUS",
        "PG_BED",
        "SHARED_ROOM",
        "PRIVATE_ROOM",
        "INDEPENDENT_HOUSE",
      ],
      food_pref: ["VEG_ONLY", "EGGETARIAN", "NON_VEG_ALLOWED", "NO_PREFERENCE"],
      furnishing: ["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"],
      listing_kind: ["FLAT", "ROOM", "FLATMATE", "PG"],
      listing_status: ["DRAFT", "PUBLISHED", "RENTED", "EXPIRED", "REMOVED"],
      parking_type: ["NONE", "TWO_WHEELER", "FOUR_WHEELER", "BOTH"],
      plan_code: ["FREE", "PREMIUM_1M"],
      reveal_result: [
        "OK",
        "NOT_AUTHENTICATED",
        "NOT_FOUND",
        "QUOTA_EXCEEDED",
        "RATE_LIMITED",
      ],
      subscription_status: [
        "PENDING",
        "ACTIVE",
        "EXPIRED",
        "CANCELLED",
        "FAILED",
      ],
      tenant_pref: [
        "FAMILY",
        "BACHELOR_MALE",
        "BACHELOR_FEMALE",
        "STUDENTS",
        "WORKING_PROFESSIONALS",
        "ANYONE",
      ],
    },
  },
} as const
