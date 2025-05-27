// Tipos para o Supabase
export interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  old_price: number | null;
  category_id: string | null;
  available: boolean;
  is_featured: boolean;
  is_promotion: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrder {
  id: string;
  customer_name: string;
  items: any;
  total_amount: number;
  status: string;
  ticket_number: string;
  created_at: string;
}

// Função para converter de snake_case (DB) para camelCase (App)
export function mapDbProductToAppProduct(dbProduct: DbProduct) {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description || '',
    price: dbProduct.price,
    old_price: dbProduct.old_price || null,
    category_id: dbProduct.category_id || null,
    available: dbProduct.available,
    is_featured: dbProduct.is_featured,
    is_promotion: dbProduct.is_promotion,
    image_url: dbProduct.image_url || '',
    created_at: dbProduct.created_at,
    updated_at: dbProduct.updated_at
  };
}

// Função para converter de snake_case (DB) para camelCase (App)
export function mapDbCategoryToAppCategory(dbCategory: DbCategory) {
  return {
    id: dbCategory.id,
    name: dbCategory.name,
    description: dbCategory.description || '',
    created_at: dbCategory.created_at,
    updated_at: dbCategory.updated_at
  };
}

// Função para converter de snake_case (DB) para camelCase (App)
export function mapDbOrderToAppOrder(dbOrder: DbOrder) {
  return {
    id: dbOrder.id,
    customer_name: dbOrder.customer_name,
    items: dbOrder.items,
    total_amount: dbOrder.total_amount,
    status: dbOrder.status,
    ticket_number: dbOrder.ticket_number,
    created_at: dbOrder.created_at
  };
}

// Função para converter de camelCase (App) para snake_case (DB)
export function mapAppProductToDbProduct(appProduct: any) {
  return {
    name: appProduct.name,
    description: appProduct.description || null,
    price: appProduct.price,
    old_price: appProduct.oldPrice || appProduct.old_price || null,
    category_id: appProduct.categoryId || appProduct.category_id || null,
    available: appProduct.available ?? true,
    is_featured: appProduct.isFeatured ?? appProduct.is_featured ?? false,
    is_promotion: appProduct.isPromotion ?? appProduct.is_promotion ?? false,
    image_url: appProduct.imageUrl || appProduct.image_url || null
  };
} 