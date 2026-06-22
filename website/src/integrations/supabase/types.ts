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
      locations: {
        Row: {
          id: string
          slug: string
          name: string
          address: string | null
          city: string | null
          manager: string | null
          phone: string | null
          hours: string | null
          lat: number | null
          lng: number | null
          channels: string[]
          active: boolean
          created_at: string
        }
        Insert: { slug: string; name: string } & Partial<{
          id: string; address: string | null; city: string | null; manager: string | null
          phone: string | null; hours: string | null; lat: number | null; lng: number | null
          channels: string[]; active: boolean; created_at: string
        }>
        Update: Partial<Database["public"]["Tables"]["locations"]["Row"]>
        Relationships: []
      }
      menu_categories: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          sort_order: number
          active: boolean
          created_at: string
        }
        Insert: { slug: string; name: string } & Partial<{
          id: string; description: string | null; sort_order: number; active: boolean; created_at: string
        }>
        Update: Partial<Database["public"]["Tables"]["menu_categories"]["Row"]>
        Relationships: []
      }
      menu_items: {
        Row: {
          id: string
          slug: string
          category_id: string | null
          name: string
          description: string | null
          base_price: number
          image: string | null
          spice_level: "mild" | "medium" | "hot"
          available: boolean
          stock: number
          low_stock_threshold: number
          channel_overrides: Json
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: { slug: string; name: string } & Partial<Database["public"]["Tables"]["menu_items"]["Row"]>
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          id: string
          name: string | null
          email: string | null
          phone: string | null
          channels: string[]
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["customers"]["Row"]>
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          short_id: string | null
          channel: "web" | "app" | "pos"
          location_id: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_email: string | null
          subtotal: number
          tax: number
          fees: number
          tip: number
          total: number
          status: "new" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled"
          type: "pickup" | "delivery" | "dine_in"
          eta_minutes: number
          address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]>
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string | null
          name: string
          qty: number
          price: number
          spice_level: string | null
          modifiers: Json
        }
        Insert: { order_id: string; name: string } & Partial<Database["public"]["Tables"]["order_items"]["Row"]>
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      order_status_events: {
        Row: {
          id: string
          order_id: string
          status: "new" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled"
          note: string | null
          created_by: string | null
          created_at: string
        }
        Insert: { order_id: string; status: Database["public"]["Tables"]["order_status_events"]["Row"]["status"] } & Partial<Database["public"]["Tables"]["order_status_events"]["Row"]>
        Update: Partial<Database["public"]["Tables"]["order_status_events"]["Row"]>
        Relationships: []
      }
      catering_requests: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          event_type: string | null
          event_date: string | null
          guest_count: number | null
          location: string | null
          message: string | null
          status: string
          created_at: string
        }
        Insert: { name: string } & Partial<Database["public"]["Tables"]["catering_requests"]["Row"]>
        Update: Partial<Database["public"]["Tables"]["catering_requests"]["Row"]>
        Relationships: []
      }
      profiles: {
        Row: { id: string; email: string | null; full_name: string | null; created_at: string }
        Insert: { id: string } & Partial<{ email: string | null; full_name: string | null; created_at: string }>
        Update: Partial<{ email: string | null; full_name: string | null; created_at: string }>
        Relationships: []
      }
      user_roles: {
        Row: { id: string; user_id: string; role: "owner" | "manager" | "staff" | "developer" }
        Insert: { user_id: string; role: "owner" | "manager" | "staff" | "developer"; id?: string }
        Update: Partial<{ id: string; user_id: string; role: "owner" | "manager" | "staff" | "developer" }>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      place_order: {
        Args: {
          p_location_slug: string
          p_customer: Json
          p_type: string
          p_items: Json
          p_subtotal: number
          p_tax: number
          p_tip?: number
          p_fees?: number
          p_notes?: string | null
          p_address?: string | null
        }
        Returns: { order_id: string; short_id: string }[]
      }
      has_role: {
        Args: { _user_id: string; _role: "owner" | "manager" | "staff" | "developer" }
        Returns: boolean
      }
      is_staff: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: {
      spice_level: "mild" | "medium" | "hot"
      order_channel: "web" | "app" | "pos"
      order_type: "pickup" | "delivery" | "dine_in"
      order_status: "new" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled"
      app_role: "owner" | "manager" | "staff" | "developer"
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
