// Tipos generados a partir del schema de Supabase
// Se regeneran con: npx supabase gen types typescript --local > src/lib/supabase/types.ts

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          plan: "free" | "pro" | "team" | "agency";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          plan?: "free" | "pro" | "team" | "agency";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
      };

      clients: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          logo_url: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          logo_url?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
      };

      projects: {
        Row: {
          id: string;
          tenant_id: string;
          client_id: string | null;
          name: string;
          description: string | null;
          status: "active" | "paused" | "completed" | "archived";
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          client_id?: string | null;
          name: string;
          description?: string | null;
          status?: "active" | "paused" | "completed" | "archived";
          color?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };

      files: {
        Row: {
          id: string;
          tenant_id: string;
          project_id: string | null;
          name: string;
          type: "document" | "image" | "video" | "audio" | "other";
          mime_type: string | null;
          storage_path: string;
          size_bytes: number;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          project_id?: string | null;
          name: string;
          type: "document" | "image" | "video" | "audio" | "other";
          mime_type?: string | null;
          storage_path: string;
          size_bytes?: number;
          uploaded_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["files"]["Insert"]>;
      };

      tasks: {
        Row: {
          id: string;
          tenant_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          status: "todo" | "in_progress" | "review" | "done" | "blocked";
          priority: "low" | "medium" | "high" | "urgent";
          assigned_to: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          project_id?: string | null;
          title: string;
          description?: string | null;
          status?: "todo" | "in_progress" | "review" | "done" | "blocked";
          priority?: "low" | "medium" | "high" | "urgent";
          assigned_to?: string | null;
          due_date?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };

      activity_events: {
        Row: {
          id: string;
          tenant_id: string;
          project_id: string | null;
          type: string;
          payload: Record<string, unknown>;
          actor: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          project_id?: string | null;
          type: string;
          payload?: Record<string, unknown>;
          actor?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["activity_events"]["Insert"]>;
      };

      agent_messages: {
        Row: {
          id: string;
          tenant_id: string;
          project_id: string | null;
          direction: "outbound" | "inbound";
          content: string;
          status: "sent" | "queued" | "processing" | "completed" | "error";
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          project_id?: string | null;
          direction: "outbound" | "inbound";
          content: string;
          status?: "sent" | "queued" | "processing" | "completed" | "error";
        };
        Update: Partial<Database["public"]["Tables"]["agent_messages"]["Insert"]>;
      };
    };
  };
}

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type File = Database["public"]["Tables"]["files"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type ActivityEvent = Database["public"]["Tables"]["activity_events"]["Row"];
