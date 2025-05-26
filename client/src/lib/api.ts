import { Category, Order, Product } from '@shared/schema';
import { supabase } from './supabase';

// Chaves para localStorage
export const ORDERS_STORAGE_KEY = 'falecomigo-admin-orders';
export const STATS_STORAGE_KEY = 'falecomigo-admin-stats';

// API URL base
export const API_BASE_URL = '';

// Função auxiliar para fazer requisições à API
async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status}`);
  }

  return response.json();
}

// Funções de localStorage
export function getOrdersFromLocalStorage(): any[] {
  try {
    const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (storedOrders) {
      return JSON.parse(storedOrders);
    }
  } catch (error) {
    console.error('Erro ao recuperar pedidos do localStorage:', error);
  }
  return [];
}

export function saveOrdersToLocalStorage(orders: any[]) {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('Erro ao salvar pedidos no localStorage:', error);
  }
}

export function mergeOrders(apiOrders: any[], localOrders: any[]): any[] {
  if (apiOrders.length === 0) return localOrders;
  if (localOrders.length === 0) return apiOrders;
  
  const apiOrderMap = new Map(apiOrders.map(order => [order.id, order]));
  
  for (const localOrder of localOrders) {
    if (!apiOrderMap.has(localOrder.id)) {
      apiOrders.push(localOrder);
    }
  }
  
  return apiOrders.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });
}

// Funções da API
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Erro ao buscar categorias:', error);
    throw error;
  }

  return data || [];
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .eq('available', true)
    .order('name');

  if (error) {
    console.error('Erro ao buscar produtos em destaque:', error);
    throw error;
  }

  return data || [];
}

export async function getPromotionProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_promotion', true)
    .eq('available', true)
    .order('name');

  if (error) {
    console.error('Erro ao buscar produtos em promoção:', error);
    throw error;
  }

  return data || [];
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .eq('available', true)
    .order('name');

  if (error) {
    console.error(`Erro ao buscar produtos da categoria ${categoryId}:`, error);
    throw error;
  }

  return data || [];
}

export async function checkQueueReset() {
  return fetchApi('/api/queue/check-reset');
}

export async function syncQueue(data: any) {
  return fetchApi('/api/queue/sync', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function createOrder(orderData: any) {
  return fetchApi('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    console.error(`Erro ao atualizar status do pedido ${orderId}:`, error);
    throw error;
  }
}

// Funções auxiliares
export async function getOrders(): Promise<Order[]> {
  try {
    const localOrders = getOrdersFromLocalStorage();
    
    const { data: apiOrders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pedidos:', error);
      return localOrders;
    }

    const mergedOrders = mergeOrders(apiOrders || [], localOrders);
    
    if (mergedOrders.length > 0) {
      saveOrdersToLocalStorage(mergedOrders);
    }
    
    return mergedOrders;
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return getOrdersFromLocalStorage();
  }
}

// Categorias
export async function getCategoryById(id: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Erro ao buscar categoria ${id}:`, error);
    throw error;
  }

  return data;
}

export async function createCategory(category: Omit<Category, 'id'>): Promise<Category> {
  console.log('Tentando criar categoria:', category);

  const { data, error } = await supabase
    .from('categories')
    .insert([{
      name: category.name,
      description: category.description || null
    }])
    .select('*')
    .single();

  if (error) {
    console.error('Erro ao criar categoria:', error);
    throw error;
  }

  console.log('Categoria criada com sucesso:', data);
  return data;
}

export async function updateCategory(id: string, category: Partial<Category>): Promise<Category> {
  console.log(`Atualizando categoria ${id}:`, category);

  const { data, error } = await supabase
    .from('categories')
    .update(category)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Erro ao atualizar categoria ${id}:`, error);
    throw error;
  }

  console.log('Categoria atualizada com sucesso:', data);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  console.log(`Tentando excluir categoria com ID: ${id}`);

  try {
    // Método direto - sem verificações extras
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao excluir categoria ${id}:`, error);
      throw error;
    }

    console.log(`Categoria ${id} excluída com sucesso`);
  } catch (error) {
    console.error(`Erro ao excluir categoria ${id}:`, error);
    throw error;
  }
}

// Produtos
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }

  return data || [];
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Erro ao buscar produto ${id}:`, error);
    throw error;
  }

  return data;
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  console.log('Tentando criar produto:', product);

  // Converter para camelCase antes de enviar
  const productData = {
    name: product.name,
    description: product.description || '',
    price: product.price,
    oldPrice: product.old_price,
    imageUrl: product.image_url || '',
    categoryId: product.category_id,
    isFeatured: product.is_featured,
    isPromotion: product.is_promotion,
    available: product.available
  };

  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar produto:', error);
    throw error;
  }

  console.log('Produto criado com sucesso:', data);
  return data;
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  console.log(`Atualizando produto ${id}:`, product);

  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Erro ao atualizar produto ${id}:`, error);
    throw error;
  }

  console.log('Produto atualizado com sucesso:', data);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  console.log(`Tentando excluir produto com ID: ${id}`);

  try {
    // Método direto - sem verificações extras
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao excluir produto ${id}:`, error);
      throw error;
    }

    console.log(`Produto ${id} excluído com sucesso`);
  } catch (error) {
    console.error(`Erro ao excluir produto ${id}:`, error);
    throw error;
  }
}

// Pedidos
export async function getOrderById(id: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Erro ao buscar pedido ${id}:`, error);
    throw error;
  }

  return data;
}

// Função para limpar dados do sistema
export async function clearSystemData(): Promise<void> {
  try {
    console.log('Iniciando limpeza de dados do sistema...');
    
    // 1. Limpar localStorage
    localStorage.removeItem(ORDERS_STORAGE_KEY);
    localStorage.removeItem(STATS_STORAGE_KEY);
    console.log('Dados locais removidos do localStorage');
    
    // 2. Chamar API para limpar dados do servidor
    const { error } = await supabase
      .from('orders')
      .delete()
      .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());

    if (error) {
      console.error('Erro ao limpar dados no servidor:', error);
      throw error;
    }
    
    console.log('Dados do sistema limpos com sucesso');
  } catch (error) {
    console.error('Erro ao limpar dados do sistema:', error);
    throw error;
  }
}

// Variável para controlar o tempo da última sincronização
let lastSyncTime = 0;
const MIN_SYNC_INTERVAL = 3000; // Mínimo de 3 segundos entre sincronizações

// Sincronizar dados da fila com localStorage
export async function syncQueueWithLocalStorage(): Promise<void> {
  try {
    const now = Date.now();
    
    // Verificar se já foi feita uma sincronização recentemente
    if (now - lastSyncTime < MIN_SYNC_INTERVAL) {
      console.log(`Sincronização ignorada - última foi há ${(now - lastSyncTime)/1000}s`);
      return;
    }
    
    console.log('Sincronizando dados da fila com localStorage...');
    lastSyncTime = now;
    
    // 1. Obter dados atuais do localStorage
    const localOrders = getOrdersFromLocalStorage();
    
    // 2. Buscar dados atualizados da API
    const response = await fetchApi('/queue/sync');
    
    if (!response || !response.success) {
      console.error('Erro na sincronização com a API:', response);
      return;
    }
    
    console.log('Sincronização com API concluída');
    
    // 3. Executar getOrders para atualizar dados no localStorage
    await getOrders();
    
    console.log('Sincronização com localStorage concluída');
    return;
  } catch (error) {
    console.error('Erro ao sincronizar fila com localStorage:', error);
    throw error;
  }
}

// Dashboard stats
export async function getDashboardStats() {
  try {
    // Buscar os pedidos
    const orders = await getOrders();

    // Buscar produtos ativos
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('available', true);

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }

    // Calcular estatísticas
    const totalSales = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
    const productCount = products?.length || 0;

    const stats = {
      totalSales,
      productCount,
      orderCount: orders.length
    };

    // Armazenar estatísticas para uso futuro
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('Erro ao salvar estatísticas no localStorage:', e);
    }
    
    return stats;
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    
    // Tentar usar estatísticas salvas anteriormente
    try {
      const storedStats = localStorage.getItem(STATS_STORAGE_KEY);
      if (storedStats) {
        console.log('Usando estatísticas do localStorage devido a erro');
        return JSON.parse(storedStats);
      }
    } catch (e) {
      console.error('Erro ao recuperar estatísticas do localStorage:', e);
    }
    
    // Retornar valores padrão em caso de erro
    return {
      totalSales: 0,
      productCount: 0,
      orderCount: 0
    };
  }
} 