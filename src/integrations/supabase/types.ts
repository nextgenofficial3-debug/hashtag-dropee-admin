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
      agent_availability: {
        Row: {
          agent_id: string
          id: string
          last_seen: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          id?: string
          last_seen?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          id?: string
          last_seen?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_availability_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "delivery_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_order_responses: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          order_id: string
          proposed_fee: number | null
          reason: string | null
          response_type: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          order_id: string
          proposed_fee?: number | null
          reason?: string | null
          response_type: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          order_id?: string
          proposed_fee?: number | null
          reason?: string | null
          response_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_order_responses_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "delivery_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_order_responses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          agent_user_id: string
          created_at: string
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          phone: string | null
          plus_code: string | null
          total_orders: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          agent_user_id: string
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          plus_code?: string | null
          total_orders?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          agent_user_id?: string
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          plus_code?: string | null
          total_orders?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      delivery_agents: {
        Row: {
          agent_code: string
          avatar_url: string | null
          average_rating: number | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_verified: boolean
          phone: string | null
          total_deliveries: number | null
          total_earnings: number | null
          updated_at: string
          user_id: string
          vehicle: string
        }
        Insert: {
          agent_code: string
          avatar_url?: string | null
          average_rating?: number | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_verified?: boolean
          phone?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          updated_at?: string
          user_id: string
          vehicle?: string
        }
        Update: {
          agent_code?: string
          avatar_url?: string | null
          average_rating?: number | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_verified?: boolean
          phone?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
          vehicle?: string
        }
        Relationships: []
      }
      delivery_orders: {
        Row: {
          agent_id: string | null
          agent_user_id: string | null
          base_fee: number | null
          created_at: string
          customer_name: string
          customer_phone: string | null
          delivery_address: string
          delivery_lat: number | null
          delivery_lng: number | null
          distance_km: number | null
          distance_surcharge: number | null
          fragility_surcharge: number | null
          id: string
          is_fragile: boolean | null
          order_code: string
          package_description: string | null
          package_weight_kg: number | null
          pickup_address: string
          pickup_lat: number | null
          pickup_lng: number | null
          plus_code: string | null
          proof_photo_url: string | null
          special_instructions: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_fee: number | null
          updated_at: string
          urgency_bonus: number | null
          weather_adjustment: number | null
          weight_surcharge: number | null
        }
        Insert: {
          agent_id?: string | null
          agent_user_id?: string | null
          base_fee?: number | null
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          delivery_address: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          distance_km?: number | null
          distance_surcharge?: number | null
          fragility_surcharge?: number | null
          id?: string
          is_fragile?: boolean | null
          order_code: string
          package_description?: string | null
          package_weight_kg?: number | null
          pickup_address: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          plus_code?: string | null
          proof_photo_url?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_fee?: number | null
          updated_at?: string
          urgency_bonus?: number | null
          weather_adjustment?: number | null
          weight_surcharge?: number | null
        }
        Update: {
          agent_id?: string | null
          agent_user_id?: string | null
          base_fee?: number | null
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_address?: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          distance_km?: number | null
          distance_surcharge?: number | null
          fragility_surcharge?: number | null
          id?: string
          is_fragile?: boolean | null
          order_code?: string
          package_description?: string | null
          package_weight_kg?: number | null
          pickup_address?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          plus_code?: string | null
          proof_photo_url?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_fee?: number | null
          updated_at?: string
          urgency_bonus?: number | null
          weather_adjustment?: number | null
          weight_surcharge?: number | null
        }
        Relationships: []
      }
      delivery_tracking: {
        Row: {
          agent_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          order_id: string
          recorded_at: string
          speed: number | null
          user_id: string
        }
        Insert: {
          agent_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          order_id: string
          recorded_at?: string
          speed?: number | null
          user_id: string
        }
        Update: {
          agent_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          order_id?: string
          recorded_at?: string
          speed?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "delivery_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      fcm_tokens: {
        Row: {
          app: string
          created_at: string | null
          id: string
          token: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          app?: string
          created_at?: string | null
          id?: string
          token: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          app?: string
          created_at?: string | null
          id?: string
          token?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      mfc_categories: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      mfc_coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      mfc_notification_history: {
        Row: {
          body: string
          created_at: string | null
          id: string
          sent_by: string | null
          sent_count: number | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          sent_by?: string | null
          sent_count?: number | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          sent_by?: string | null
          sent_count?: number | null
          title?: string
        }
        Relationships: []
      }
      mfc_orders: {
        Row: {
          created_at: string
          customer_address: string
          customer_name: string
          customer_phone: string
          discount: number
          hub_order_id: string | null
          id: string
          items: Json
          payment_method: string
          special_instructions: string | null
          status: string
          subtotal: number
          total: number
        }
        Insert: {
          created_at?: string
          customer_address: string
          customer_name: string
          customer_phone: string
          discount?: number
          hub_order_id?: string | null
          id?: string
          items: Json
          payment_method?: string
          special_instructions?: string | null
          status?: string
          subtotal: number
          total: number
        }
        Update: {
          created_at?: string
          customer_address?: string
          customer_name?: string
          customer_phone?: string
          discount?: number
          hub_order_id?: string | null
          id?: string
          items?: Json
          payment_method?: string
          special_instructions?: string | null
          status?: string
          subtotal?: number
          total?: number
        }
        Relationships: []
      }
      mfc_products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          in_stock: boolean | null
          is_bestseller: boolean | null
          is_spicy: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          is_bestseller?: boolean | null
          is_spicy?: boolean | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          is_bestseller?: boolean | null
          is_spicy?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfc_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mfc_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      mfc_promotions: {
        Row: {
          applies_to_all: boolean | null
          banner_image: string | null
          created_at: string
          description: string | null
          discount_percentage: number | null
          id: string
          is_active: boolean | null
          product_ids: string[] | null
          title: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applies_to_all?: boolean | null
          banner_image?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          product_ids?: string[] | null
          title: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applies_to_all?: boolean | null
          banner_image?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          product_ids?: string[] | null
          title?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      mfc_push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      mfc_reviews: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          is_approved: boolean
          rating: number
          review_text: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          is_approved?: boolean
          rating: number
          review_text: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          is_approved?: boolean
          rating?: number
          review_text?: string
        }
        Relationships: []
      }
      mfc_site_content: {
        Row: {
          address: string | null
          content: string
          directions_url: string | null
          email: string | null
          id: string
          image_url: string | null
          map_embed_url: string | null
          phone_1: string | null
          phone_2: string | null
          section: string
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          content?: string
          directions_url?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          map_embed_url?: string | null
          phone_1?: string | null
          phone_2?: string | null
          section: string
          title?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          content?: string
          directions_url?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          map_embed_url?: string | null
          phone_1?: string | null
          phone_2?: string | null
          section?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mfc_store_settings: {
        Row: {
          admin_password_hash: string
          average_rating: string | null
          base_delivery_fee: number
          closing_time: string | null
          customers_served: string | null
          id: string
          is_open: boolean | null
          menu_images: string[] | null
          open_days: number[] | null
          opening_time: string | null
          packaging_fee: number
          per_km_delivery_fee: number
          updated_at: string
          upi_id: string | null
          use_scheduled_hours: boolean | null
          whatsapp_primary: string | null
          whatsapp_secondary: string | null
          years_running: string | null
        }
        Insert: {
          admin_password_hash?: string
          average_rating?: string | null
          base_delivery_fee?: number
          closing_time?: string | null
          customers_served?: string | null
          id?: string
          is_open?: boolean | null
          menu_images?: string[] | null
          open_days?: number[] | null
          opening_time?: string | null
          packaging_fee?: number
          per_km_delivery_fee?: number
          updated_at?: string
          upi_id?: string | null
          use_scheduled_hours?: boolean | null
          whatsapp_primary?: string | null
          whatsapp_secondary?: string | null
          years_running?: string | null
        }
        Update: {
          admin_password_hash?: string
          average_rating?: string | null
          base_delivery_fee?: number
          closing_time?: string | null
          customers_served?: string | null
          id?: string
          is_open?: boolean | null
          menu_images?: string[] | null
          open_days?: number[] | null
          opening_time?: string | null
          packaging_fee?: number
          per_km_delivery_fee?: number
          updated_at?: string
          upi_id?: string | null
          use_scheduled_hours?: boolean | null
          whatsapp_primary?: string | null
          whatsapp_secondary?: string | null
          years_running?: string | null
        }
        Relationships: []
      }
      mfc_vapid_keys: {
        Row: {
          created_at: string
          id: string
          private_key: string
          public_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          private_key: string
          public_key: string
        }
        Update: {
          created_at?: string
          id?: string
          private_key?: string
          public_key?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_status_timeline: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_timeline_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          agent_id: string | null
          agent_user_id: string | null
          created_at: string
          customer_address: string
          customer_name: string
          customer_phone: string
          discount: number
          fee: number | null
          hub_order_id: string | null
          id: string
          items: Json
          payment_method: string
          pickup_address: string | null
          plus_code: string | null
          proof_photo_url: string | null
          special_instructions: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          agent_user_id?: string | null
          created_at?: string
          customer_address: string
          customer_name: string
          customer_phone: string
          discount?: number
          fee?: number | null
          hub_order_id?: string | null
          id?: string
          items?: Json
          payment_method?: string
          pickup_address?: string | null
          plus_code?: string | null
          proof_photo_url?: string | null
          special_instructions?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          agent_user_id?: string | null
          created_at?: string
          customer_address?: string
          customer_name?: string
          customer_phone?: string
          discount?: number
          fee?: number | null
          hub_order_id?: string | null
          id?: string
          items?: Json
          payment_method?: string
          pickup_address?: string | null
          plus_code?: string | null
          proof_photo_url?: string | null
          special_instructions?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      role_invitations: {
        Row: {
          created_at: string
          email: string
          granted_at: string | null
          id: string
          invited_by: string | null
          notes: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email: string
          granted_at?: string | null
          id?: string
          invited_by?: string | null
          notes?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          granted_at?: string | null
          id?: string
          invited_by?: string | null
          notes?: string | null
          role?: Database["public"]["Enums"]["app_role"]
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
      vendors: {
        Row: {
          address: string | null
          agent_user_id: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          phone: string | null
          total_orders: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          agent_user_id: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          total_orders?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          agent_user_id?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          total_orders?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "agent" | "user" | "super_admin"
      order_status:
        | "pending_assignment"
        | "accepted"
        | "en_route_pickup"
        | "arrived_pickup"
        | "picked_up"
        | "in_transit"
        | "arrived_delivery"
        | "delivered"
        | "cancelled"
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
      app_role: ["admin", "moderator", "agent", "user", "super_admin"],
      order_status: [
        "pending_assignment",
        "accepted",
        "en_route_pickup",
        "arrived_pickup",
        "picked_up",
        "in_transit",
        "arrived_delivery",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const

