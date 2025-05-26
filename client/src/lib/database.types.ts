export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description?: string
          price: number
          old_price?: number
          category_id?: string
          available?: boolean
          is_featured?: boolean
          is_promotion?: boolean
          image_url?: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          price: number
          old_price?: number
          category_id?: string
          available?: boolean
          is_featured?: boolean
          is_promotion?: boolean
          image_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          old_price?: number
          category_id?: string
          available?: boolean
          is_featured?: boolean
          is_promotion?: boolean
          image_url?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          items: any[]
          total_amount: number
          status: string
          created_at: string
          ticket_number: string
        }
        Insert: {
          id?: string
          customer_name: string
          items: any[]
          total_amount: number
          status: string
          created_at?: string
          ticket_number?: string
        }
        Update: {
          id?: string
          customer_name?: string
          items?: any[]
          total_amount?: number
          status?: string
          ticket_number?: string
        }
      }
    }
  }
} 