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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      administrators: {
        Row: {
          auth_user_id: string
          created_at: string
          id: string
          must_change_password: boolean
          status: string
          username: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          id?: string
          must_change_password?: boolean
          status?: string
          username: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          id?: string
          must_change_password?: boolean
          status?: string
          username?: string
        }
        Relationships: []
      }
      genres: {
        Row: {
          id: string
          name: string
          tmdb_genre_id: number
        }
        Insert: {
          id?: string
          name: string
          tmdb_genre_id: number
        }
        Update: {
          id?: string
          name?: string
          tmdb_genre_id?: number
        }
        Relationships: []
      }
      movie_genres: {
        Row: {
          genre_id: string
          movie_id: string
        }
        Insert: {
          genre_id: string
          movie_id: string
        }
        Update: {
          genre_id?: string
          movie_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movie_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movie_genres_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      movies: {
        Row: {
          backdrop_path: string | null
          created_at: string
          id: string
          metadata_updated_at: string
          original_title: string
          overview: string
          poster_path: string | null
          release_date: string
          runtime: number | null
          title: string
          tmdb_id: number
        }
        Insert: {
          backdrop_path?: string | null
          created_at?: string
          id?: string
          metadata_updated_at?: string
          original_title: string
          overview?: string
          poster_path?: string | null
          release_date: string
          runtime?: number | null
          title: string
          tmdb_id: number
        }
        Update: {
          backdrop_path?: string | null
          created_at?: string
          id?: string
          metadata_updated_at?: string
          original_title?: string
          overview?: string
          poster_path?: string | null
          release_date?: string
          runtime?: number | null
          title?: string
          tmdb_id?: number
        }
        Relationships: []
      }
      profile_favorite_genres: {
        Row: {
          genre_id: string
          profile_id: string
        }
        Insert: {
          genre_id: string
          profile_id: string
        }
        Update: {
          genre_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_favorite_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_favorite_genres_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about: string
          administrator_id: string
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          rating_philosophy: string
          updated_at: string
        }
        Insert: {
          about?: string
          administrator_id: string
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          rating_philosophy?: string
          updated_at?: string
        }
        Update: {
          about?: string
          administrator_id?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          rating_philosophy?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: true
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          administrator_id: string
          comment: string
          created_at: string
          id: string
          movie_id: string
          rating: number
          recommend: boolean
          updated_at: string
          updated_by: string
        }
        Insert: {
          administrator_id: string
          comment: string
          created_at?: string
          id?: string
          movie_id: string
          rating: number
          recommend: boolean
          updated_at?: string
          updated_by: string
        }
        Update: {
          administrator_id?: string
          comment?: string
          created_at?: string
          id?: string
          movie_id?: string
          rating?: number
          recommend?: boolean
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          added_at: string
          administrator_id: string
          id: string
          movie_id: string
        }
        Insert: {
          added_at?: string
          administrator_id: string
          id?: string
          movie_id: string
        }
        Update: {
          added_at?: string
          administrator_id?: string
          id?: string
          movie_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlist_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      avatar_allowed: { Args: { path: string }; Returns: boolean }
      club_member: { Args: { require_ready?: boolean }; Returns: string }
      club_owner: { Args: never; Returns: boolean }
      store_tmdb_movie: {
        Args: { payload: Json }
        Returns: {
          backdrop_path: string | null
          created_at: string
          id: string
          metadata_updated_at: string
          original_title: string
          overview: string
          poster_path: string | null
          release_date: string
          runtime: number | null
          title: string
          tmdb_id: number
        }
        SetofOptions: {
          from: "*"
          to: "movies"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "owner" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["owner", "admin"],
    },
  },
} as const
