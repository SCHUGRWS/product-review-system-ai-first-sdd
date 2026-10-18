export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          active: boolean;
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          locale: string;
          password: string;
          salt: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          created_at?: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          locale?: string;
          password: string;
          salt: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          locale?: string;
          password?: string;
          salt?: string;
        };
        Relationships: [];
      };
      app_flags: {
        Row: {
          ai_disabled_reason: string | null;
          ai_disabled_until: string | null;
          id: boolean;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          ai_disabled_reason?: string | null;
          ai_disabled_until?: string | null;
          id?: boolean;
          updated_at?: string;
        };
        Update: {
          ai_disabled_reason?: string | null;
          ai_disabled_until?: string | null;
          id?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      feedbacks: {
        Row: {
          account_id: string;
          comment: string;
          created_at: string;
          id: string;
          product_id: string | null;
          product_name: string;
          rating: number;
        };
        ComputedFields: never;
        Insert: {
          account_id: string;
          comment: string;
          created_at?: string;
          id: string;
          product_id?: string | null;
          product_name: string;
          rating: number;
        };
        Update: {
          account_id?: string;
          comment?: string;
          created_at?: string;
          id?: string;
          product_id?: string | null;
          product_name?: string;
          rating?: number;
        };
        Relationships: [
          {
            foreignKeyName: "feedbacks_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedbacks_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "available_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedbacks_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_feedback_summaries: {
        Row: {
          generated_at: string;
          locale: string;
          model: string;
          product_id: string;
          review_count: number;
          summary: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          generated_at?: string;
          locale: string;
          model: string;
          product_id: string;
          review_count: number;
          summary: NonNullable<Json>;
        };
        Update: {
          generated_at?: string;
          locale?: string;
          model?: string;
          product_id?: string;
          review_count?: number;
          summary?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "product_feedback_summaries_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "available_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_feedback_summaries_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          asin: string;
          category_name: string;
          category_slug: string;
          currency: string;
          discount_percent: number | null;
          first_seen_at: string;
          id: string;
          image_url: string;
          last_seen_at: string;
          list_price_cents: number | null;
          price_cents: number;
          rating: number | null;
          review_count: number | null;
          search: unknown;
          title: string;
          url: string;
        };
        ComputedFields: never;
        Insert: {
          asin: string;
          category_name: string;
          category_slug: string;
          currency?: string;
          discount_percent?: number | null;
          first_seen_at?: string;
          id?: string;
          image_url: string;
          last_seen_at?: string;
          list_price_cents?: number | null;
          price_cents: number;
          rating?: number | null;
          review_count?: number | null;
          search?: never;
          title: string;
          url: string;
        };
        Update: {
          asin?: string;
          category_name?: string;
          category_slug?: string;
          currency?: string;
          discount_percent?: number | null;
          first_seen_at?: string;
          id?: string;
          image_url?: string;
          last_seen_at?: string;
          list_price_cents?: number | null;
          price_cents?: number;
          rating?: number | null;
          review_count?: number | null;
          search?: never;
          title?: string;
          url?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          account_id: string;
          created_at: string;
          expires_at: string;
          id: string;
          token_hash: string;
        };
        ComputedFields: never;
        Insert: {
          account_id: string;
          created_at?: string;
          expires_at: string;
          id: string;
          token_hash: string;
        };
        Update: {
          account_id?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      available_products: {
        Row: {
          asin: string | null;
          category_name: string | null;
          category_slug: string | null;
          currency: string | null;
          discount_percent: number | null;
          first_seen_at: string | null;
          id: string | null;
          image_url: string | null;
          last_seen_at: string | null;
          list_price_cents: number | null;
          price_cents: number | null;
          rating: number | null;
          review_count: number | null;
          search: unknown;
          title: string | null;
          url: string | null;
        };
        ComputedFields: never;
        Insert: {
          asin?: string | null;
          category_name?: string | null;
          category_slug?: string | null;
          currency?: string | null;
          discount_percent?: number | null;
          first_seen_at?: string | null;
          id?: string | null;
          image_url?: string | null;
          last_seen_at?: string | null;
          list_price_cents?: number | null;
          price_cents?: number | null;
          rating?: number | null;
          review_count?: number | null;
          search?: unknown;
          title?: string | null;
          url?: string | null;
        };
        Update: {
          asin?: string | null;
          category_name?: string | null;
          category_slug?: string | null;
          currency?: string | null;
          discount_percent?: number | null;
          first_seen_at?: string | null;
          id?: string | null;
          image_url?: string | null;
          last_seen_at?: string | null;
          list_price_cents?: number | null;
          price_cents?: number | null;
          rating?: number | null;
          review_count?: number | null;
          search?: unknown;
          title?: string | null;
          url?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      list_product_categories: {
        Args: Record<PropertyKey, never>;
        Returns: {
          count: number;
          name: string;
          slug: string;
        }[];
      };
      most_reviewed_products: {
        Args: { max_count: number };
        Returns: {
          average: number;
          product_id: string;
          review_count: number;
        }[];
      };
      product_review_stats: {
        Args: { ids: string[] };
        Returns: {
          average: number;
          product_id: string;
          review_count: number;
        }[];
      };
      products_nanoid: { Args: Record<PropertyKey, never>; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
