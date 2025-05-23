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
          oldPrice?: number
          categoryId?: string
          available?: boolean
          isFeatured?: boolean
          isPromotion?: boolean
          imageUrl?: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          price: number
          oldPrice?: number
          categoryId?: string
          available?: boolean
          isFeatured?: boolean
          isPromotion?: boolean
          imageUrl?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          oldPrice?: number
          categoryId?: string
          available?: boolean
          isFeatured?: boolean
          isPromotion?: boolean
          imageUrl?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customerName: string
          items: any[]
          totalAmount: number
          status: string
          created_at: string
          ticketNumber: string
        }
        Insert: {
          id?: string
          customerName: string
          items: any[]
          totalAmount: number
          status: string
          created_at?: string
          ticketNumber?: string
        }
        Update: {
          id?: string
          customerName?: string
          items?: any[]
          totalAmount?: number
          status?: string
          ticketNumber?: string
        }
      }
    }
  }
} 