export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          price: number;
          old_price: number | null;
          image_url: string | null;
          category_id: number;
          is_available: boolean;
          is_featured: boolean;
          is_promotion: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          price: number;
          old_price?: number | null;
          image_url?: string | null;
          category_id: number;
          is_available?: boolean;
          is_featured?: boolean;
          is_promotion?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string | null;
          price?: number;
          old_price?: number | null;
          image_url?: string | null;
          category_id?: number;
          is_available?: boolean;
          is_featured?: boolean;
          is_promotion?: boolean;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: number;
          customer_name: string;
          customer_email: string | null;
          status: string;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          customer_name: string;
          customer_email?: string | null;
          status?: string;
          total: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          customer_name?: string;
          customer_email?: string | null;
          status?: string;
          total?: number;
          created_at?: string;
        };
      };
      order_items: {
        Row: {
          id: number;
          order_id: number;
          product_id: number;
          quantity: number;
          price: number;
        };
        Insert: {
          id?: number;
          order_id: number;
          product_id: number;
          quantity: number;
          price: number;
        };
        Update: {
          id?: number;
          order_id?: number;
          product_id?: number;
          quantity?: number;
          price?: number;
        };
      };
    };
  };
}