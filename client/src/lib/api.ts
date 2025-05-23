import { ApiResponse, Category, Order, OrderStatus, PaymentMethod, PaymentStatus, Product } from "@shared/schema";
import { supabase } from './supabase.js';

// API URL base, será substituída em produção pelo Netlify
const API_BASE_URL = import.meta.env.PROD 
  ? '/.netlify/functions'
  : '/api';

// Função auxiliar para fazer requisições à API
export async function fetchFromApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('Fazendo requisição para:', url);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return (data.data || data) as T;
  } catch (error) {
    console.error(`Erro ao chamar API ${endpoint}:`, error);
    throw error;
  }
}

// Categorias
export async function getCategories(): Promise<Category[]> {
  const response = await fetchFromApi<ApiResponse>('/categories');
  return (response.data || []) as Category[];
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const response = await fetchFromApi<ApiResponse>(`/categories/${id}`);
  return (response.data || null) as Category | null;
}

export async function createCategory(category: Omit<Category, 'id'>): Promise<Category> {
  const response = await fetchFromApi<ApiResponse>('/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  });
  return response.data as Category;
}

export async function updateCategory(id: string, category: Partial<Category>): Promise<Category> {
  console.log(`Atualizando categoria ${id}:`, category);
  const response = await fetchFromApi<ApiResponse>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  });
  return response.data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  console.log(`Tentando excluir categoria com ID: ${id}`);
  await fetchFromApi(`/categories/${id}`, {
    method: 'DELETE',
  });
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

  return data?.map(product => ({
    ...product,
    id: String(product.id),
    categoryId: String(product.categoryId),
    available: product.available ?? true,
    isFeatured: product.isFeatured ?? false,
    isPromotion: product.isPromotion ?? false,
    description: product.description || '',
    imageUrl: product.imageUrl || ''
  })) || [];
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('categoryId', categoryId)
    .order('name');

  if (error) {
    console.error(`Erro ao buscar produtos da categoria ${categoryId}:`, error);
    throw error;
  }

  return data?.map(product => ({
    ...product,
    id: String(product.id),
    categoryId: String(product.categoryId),
    available: product.available ?? true,
    isFeatured: product.isFeatured ?? false,
    isPromotion: product.isPromotion ?? false,
    description: product.description || '',
    imageUrl: product.imageUrl || ''
  })) || [];
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('isFeatured', true)
    .order('name');

  if (error) {
    console.error('Erro ao buscar produtos em destaque:', error);
    throw error;
  }

  return data?.map(product => ({
    ...product,
    id: String(product.id),
    categoryId: String(product.categoryId),
    available: product.available ?? true,
    isFeatured: true,
    isPromotion: product.isPromotion ?? false,
    description: product.description || '',
    imageUrl: product.imageUrl || ''
  })) || [];
}

export async function getPromotionProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('isPromotion', true)
    .order('name');

  if (error) {
    console.error('Erro ao buscar produtos em promoção:', error);
    throw error;
  }

  return data?.map(product => ({
    ...product,
    id: String(product.id),
    categoryId: String(product.categoryId),
    available: product.available ?? true,
    isFeatured: product.isFeatured ?? false,
    isPromotion: true,
    description: product.description || '',
    imageUrl: product.imageUrl || ''
  })) || [];
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

  return data ? {
    ...data,
    id: String(data.id),
    categoryId: String(data.categoryId),
    available: data.available ?? true,
    isFeatured: data.isFeatured ?? false,
    isPromotion: data.isPromotion ?? false,
    description: data.description || '',
    imageUrl: data.imageUrl || ''
  } : null;
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  console.log('Tentando criar produto:', product);

  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar produto:', error);
    throw error;
  }

  console.log('Produto criado com sucesso:', data);
  return {
    ...data,
    id: String(data.id),
    categoryId: String(data.categoryId),
    available: data.available ?? true,
    isFeatured: data.isFeatured ?? false,
    isPromotion: data.isPromotion ?? false,
    description: data.description || '',
    imageUrl: data.imageUrl || ''
  };
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
  return {
    ...data,
    id: String(data.id),
    categoryId: String(data.categoryId),
    available: data.available ?? true,
    isFeatured: data.isFeatured ?? false,
    isPromotion: data.isPromotion ?? false,
    description: data.description || '',
    imageUrl: data.imageUrl || ''
  };
}

export async function deleteProduct(id: string): Promise<void> {
  console.log(`Tentando excluir produto com ID: ${id}`);

  try {
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
export async function createOrder(order: Omit<Order, 'id' | 'ticketNumber'>): Promise<Order> {
  const response = await fetchFromApi<ApiResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });

  return response.data as Order;
}

// Função para salvar pedidos no localStorage
function saveOrdersToLocalStorage(orders: Order[]) {
  try {
    localStorage.setItem('falecomigo-admin-orders', JSON.stringify(orders));
    console.log(`${orders.length} pedidos salvos em localStorage`);
  } catch (error) {
    console.error('Erro ao salvar pedidos no localStorage:', error);
  }
}

// Função para recuperar pedidos do localStorage
function getOrdersFromLocalStorage(): Order[] {
  try {
    const storedOrders = localStorage.getItem('falecomigo-admin-orders');
    if (storedOrders) {
      const orders = JSON.parse(storedOrders);
      console.log(`${orders.length} pedidos recuperados de localStorage`);
      return orders;
    }
  } catch (error) {
    console.error('Erro ao recuperar pedidos do localStorage:', error);
  }
  return [];
}

// Função para mesclar pedidos locais com pedidos da API
function mergeOrders(apiOrders: Order[], localOrders: Order[]): Order[] {
  if (apiOrders.length === 0) return localOrders;
  if (localOrders.length === 0) return apiOrders;
  
  const apiOrderMap = new Map(apiOrders.map(order => [order.id, order]));
  
  for (const localOrder of localOrders) {
    if (!apiOrderMap.has(localOrder.id)) {
      apiOrders.push(localOrder);
    }
  }
  
  return apiOrders.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.created_at || '').getTime();
    const dateB = new Date(b.createdAt || b.created_at || '').getTime();
    return dateB - dateA;
  });
}

export async function getOrders(): Promise<Order[]> {
  try {
    const localOrders = getOrdersFromLocalStorage();
    const response = await fetchFromApi<ApiResponse>('/queue');
    
    if (!response || !response.orders || !Array.isArray(response.orders)) {
      console.error('Estrutura de resposta inválida da API de fila:', response);
      console.log('Usando dados do localStorage como fallback');
      return localOrders;
    }
    
    console.log('Dados obtidos da fila de pedidos:', response);
    
    const apiOrders = response.orders.map((order: any) => ({
      id: String(order.id),
      ticketNumber: order.ticket || `T${Date.now().toString().slice(-6)}`,
      status: (order.status || 'recebido') as OrderStatus,
      items: (order.items || []).map((item: any) => ({
        id: String(item.id || crypto.randomUUID()),
        name: item.name || '',
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
        notes: item.notes || ''
      })),
      totalAmount: Number(order.total || 0),
      customer: {
        name: order.customerName || 'Cliente',
        email: order.customerEmail || `${order.customerName?.replace(/\s+/g, '-').toLowerCase() || 'cliente'}@example.com`,
        phone: order.customerPhone || '',
        address: ''
      },
      paymentMethod: 'pix' as PaymentMethod,
      paymentStatus: 'paid' as PaymentStatus,
      created_at: order.createdAt || new Date().toISOString(),
      userId: '',
      notes: '',
      paymentDetails: {}
    }));
    
    if (apiOrders.length === 0 && localOrders.length > 0) {
      console.log(`API retornou lista vazia, mantendo ${localOrders.length} pedidos do localStorage`);
      return localOrders;
    }
    
    const mergedOrders = mergeOrders(apiOrders, localOrders);
    
    if (mergedOrders.length > 0) {
      saveOrdersToLocalStorage(mergedOrders);
      console.log(`Retornando ${mergedOrders.length} pedidos (mesclados)`);
      return mergedOrders;
    } else {
      console.log(`Sem pedidos para exibir após mesclagem`);
      return [];
    }
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    const localOrders = getOrdersFromLocalStorage();
    console.log(`Usando ${localOrders.length} pedidos do localStorage devido a erro na API`);
    return localOrders;
  }
}

export async function getDashboardStats() {
  try {
    await syncQueueWithLocalStorage();
    const orders = await getOrders();
    
    let products: Product[] = [];
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');
      
      if (error) throw error;
      products = data?.map(product => ({
        ...product,
        id: String(product.id),
        categoryId: String(product.categoryId),
        available: product.available ?? true,
        isFeatured: product.isFeatured ?? false,
        isPromotion: product.isPromotion ?? false,
        description: product.description || '',
        imageUrl: product.imageUrl || ''
      })) || [];
      
    } catch (prodError) {
      console.error('Erro ao buscar produtos:', prodError);
      const storedStats = localStorage.getItem('falecomigo-admin-stats');
      if (storedStats) {
        const stats = JSON.parse(storedStats);
        products = new Array(stats.productCount).fill({});
      }
    }

    const stats = {
      totalSales: orders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0,
      productCount: products?.length || 0,
      orderCount: orders?.length || 0
    };

    console.log('Dashboard stats calculado:', stats);
    localStorage.setItem('falecomigo-admin-stats', JSON.stringify(stats));
    return stats;
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    try {
      const storedStats = localStorage.getItem('falecomigo-admin-stats');
      if (storedStats) {
        console.log('Usando estatísticas do localStorage devido a erro');
        return JSON.parse(storedStats);
      }
    } catch (e) {
      console.error('Erro ao recuperar estatísticas do localStorage:', e);
    }
    
    return {
      totalSales: 0,
      productCount: 0,
      orderCount: 0
    };
  }
}

let lastSyncTime = 0;
const MIN_SYNC_INTERVAL = 3000;

export async function syncQueueWithLocalStorage(): Promise<void> {
  try {
    const now = Date.now();
    
    if (now - lastSyncTime < MIN_SYNC_INTERVAL) {
      console.log(`Sincronização ignorada - última foi há ${(now - lastSyncTime)/1000}s`);
      return;
    }
    
    console.log('Sincronizando dados da fila com localStorage...');
    lastSyncTime = now;
    
    const response = await fetchFromApi<ApiResponse>('/queue/sync');
    
    if (!response?.success) {
      console.error('Erro na sincronização com a API:', response);
      return;
    }
    
    console.log('Sincronização com API concluída');
    await getOrders();
    console.log('Sincronização com localStorage concluída');
  } catch (error) {
    console.error('Erro ao sincronizar fila com localStorage:', error);
    throw error;
  }
}

export async function clearSystemData(): Promise<void> {
  try {
    console.log('Iniciando limpeza de dados do sistema...');
    
    localStorage.removeItem('falecomigo-admin-orders');
    localStorage.removeItem('falecomigo-admin-stats');
    console.log('Dados locais removidos do localStorage');
    
    const response = await fetchFromApi<ApiResponse>('/queue/clear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ confirm: true })
    });
    
    if (!response?.success) {
      console.error('Erro ao limpar dados no servidor:', response);
      throw new Error('Não foi possível limpar os dados no servidor');
    }
    
    console.log('Dados do sistema limpos com sucesso:', response);
  } catch (error) {
    console.error('Erro ao limpar dados do sistema:', error);
    throw error;
  }
} 