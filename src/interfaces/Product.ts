export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  image_url?: string;
  created_at?: string;
  categories?: {
    id: number;
    name: string;
    slug?: string;
  }
} 