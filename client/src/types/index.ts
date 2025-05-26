export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  old_price?: number;
  category_id?: string;
  available: boolean;
  is_featured: boolean;
  is_promotion: boolean;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
} 