export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  is_popular: boolean;
  is_special_offer: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}