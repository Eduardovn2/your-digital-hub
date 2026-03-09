export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customer_addresses: {
        Row: {
          id: string
          device_id: string
          zip_code: string | null
          street: string | null
          number: string | null
          neighborhood: string | null
          city: string | null
          complement: string | null
          referencia: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          device_id: string
          zip_code?: string | null
          street?: string | null
          number?: string | null
          neighborhood?: string | null
          city?: string | null
          complement?: string | null
          referencia?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          zip_code?: string | null
          street?: string | null
          number?: string | null
          neighborhood?: string | null
          city?: string | null
          complement?: string | null
          referencia?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_rules: {
        Row: {
          id: string
          store_id: string
          max_km: number
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          max_km?: number
          price?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          max_km?: number
          price?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      delivery_zones: {
        Row: {
          id: string
          store_id: string
          name: string
          cep_prefix: string | null
          fee: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          cep_prefix?: string | null
          fee?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          cep_prefix?: string | null
          fee?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_price: number
          quantity: number
          subtotal: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_price: number
          quantity?: number
          subtotal: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_price?: number
          quantity?: number
          subtotal?: number
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          store_id: string
          customer_name: string
          customer_phone: string
          customer_address: string | null
          status: Database["public"]["Enums"]["order_status"]
          notes: string | null
          subtotal: number
          delivery_fee: number
          total: number
          payment_method: string
          change_for: number | null
          items: Json
          device_id: string | null
          mp_payment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          customer_name: string
          customer_phone: string
          customer_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          subtotal?: number
          delivery_fee?: number
          total?: number
          payment_method?: string
          change_for?: number | null
          items?: Json
          device_id?: string | null
          mp_payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          customer_name?: string
          customer_phone?: string
          customer_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          subtotal?: number
          delivery_fee?: number
          total?: number
          payment_method?: string
          change_for?: number | null
          items?: Json
          device_id?: string | null
          mp_payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      printer_settings: {
        Row: {
          id: string
          store_id: string
          printer_ip: string
          printer_port: number
          is_enabled: boolean
          paper_width: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          printer_ip: string
          printer_port?: number
          is_enabled?: boolean
          paper_width?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          printer_ip?: string
          printer_port?: number
          is_enabled?: boolean
          paper_width?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "printer_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          store_id: string | null
          name: string
          description: string | null
          price: number
          image_url: string | null
          category: string
          popular: boolean | null
          complements: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id?: string | null
          name: string
          description?: string | null
          price?: number
          image_url?: string | null
          category?: string
          popular?: boolean | null
          complements?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string | null
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          category?: string
          popular?: boolean | null
          complements?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      store_hours: {
        Row: {
          id: string
          store_id: string
          opening_time: string
          closing_time: string
          days_open: number[]
          is_auto_control: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          opening_time?: string
          closing_time?: string
          days_open?: number[]
          is_auto_control?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          opening_time?: string
          closing_time?: string
          days_open?: number[]
          is_auto_control?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_hours_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      stores: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          banner_url: string | null
          phone: string | null
          whatsapp: string | null
          address: string | null
          zip_code: string | null
          street: string | null
          street_number: string | null
          neighborhood: string | null
          city: string | null
          complement: string | null
          instagram: string | null
          primary_color: string
          secondary_color: string
          accent_color: string
          background_color: string
          text_color: string
          font_family: string
          layout_style: string
          show_banner: boolean
          show_categories: boolean
          is_active: boolean
          is_open: boolean
          mp_access_token: string | null
          mp_public_key: string | null
          mp_refresh_token: string | null
          status: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          phone?: string | null
          whatsapp?: string | null
          address?: string | null
          zip_code?: string | null
          street?: string | null
          street_number?: string | null
          neighborhood?: string | null
          city?: string | null
          complement?: string | null
          instagram?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          background_color?: string
          text_color?: string
          font_family?: string
          layout_style?: string
          show_banner?: boolean
          show_categories?: boolean
          is_active?: boolean
          is_open?: boolean
          mp_access_token?: string | null
          mp_public_key?: string | null
          mp_refresh_token?: string | null
          status?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          phone?: string | null
          whatsapp?: string | null
          address?: string | null
          zip_code?: string | null
          street?: string | null
          street_number?: string | null
          neighborhood?: string | null
          city?: string | null
          complement?: string | null
          instagram?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          background_color?: string
          text_color?: string
          font_family?: string
          layout_style?: string
          show_banner?: boolean
          show_categories?: boolean
          is_active?: boolean
          is_open?: boolean
          mp_access_token?: string | null
          mp_public_key?: string | null
          mp_refresh_token?: string | null
          status?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
    }
    Views: {
      orders_decrypted: {
        Row: {
          id: string | null
          store_id: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_address: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          notes: string | null
          subtotal: number | null
          delivery_fee: number | null
          total: number | null
          payment_method: string | null
          change_for: number | null
          items: Json | null
          device_id: string | null
          mp_payment_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      printer_settings_decrypted: {
        Row: {
          id: string | null
          store_id: string | null
          printer_ip: string | null
          printer_port: number | null
          is_enabled: boolean | null
          paper_width: number | null
          created_at: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_store_owner: {
        Args: {
          _store_id: string
        }
        Returns: boolean
      }
      decrypt_sensitive: {
        Args: {
          encrypted_text: string
        }
        Returns: string
      }
      encrypt_sensitive: {
        Args: {
          plain_text: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "delivered"
        | "cancelled"
        | "paid"
        | "accepted"
        | "delivering"
        | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never
