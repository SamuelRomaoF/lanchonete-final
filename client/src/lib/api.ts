import { Category, Order, Product } from '@shared/schema';
import { supabase } from './supabase';

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
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`Erro ao chamar API ${endpoint}:`, error);
    throw error;
  }
}

// Categorias
export async function getCategories(): Promise<Category[]> {
  return fetchFromApi<Category[]>('/categories');
}

export async function getCategoryById(id: string): Promise<Category | null> {
  return fetchFromApi<Category>(`/categories/${id}`);
}

export async function createCategory(category: Partial<Category>): Promise<Category> {
  return fetchFromApi<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  });
}

export async function updateCategory(id: string, category: Partial<Category>): Promise<Category> {
  console.log(`Atualizando categoria ${id}:`, category);
  return fetchFromApi<Category>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  });
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

  return data || [];
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

  return data || [];
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

  return data || [];
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
export async function createOrder(order: Omit<Order, 'id' | 'ticketNumber'>): Promise<Order> {
  // Gerar número de ticket baseado na data/hora
  const timestamp = new Date().getTime();
  const ticketNumber = `T${timestamp.toString().slice(-6)}`;

  const orderWithTicket = {
    ...order,
    ticketNumber
  };

  const { data, error } = await supabase
    .from('orders')
    .insert([orderWithTicket])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar pedido:', error);
    throw error;
  }

  return data;
}

// Chave para armazenar pedidos no localStorage
const ORDERS_STORAGE_KEY = 'falecomigo-admin-orders';

// Função para salvar pedidos no localStorage
function saveOrdersToLocalStorage(orders: any[]) {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    console.log(`${orders.length} pedidos salvos em localStorage`);
  } catch (error) {
    console.error('Erro ao salvar pedidos no localStorage:', error);
  }
}

// Função para recuperar pedidos do localStorage
function getOrdersFromLocalStorage(): any[] {
  try {
    const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
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

// Função para mesclar pedidos locais com pedidos da API para evitar perda de dados
function mergeOrders(apiOrders: any[], localOrders: any[]): any[] {
  if (apiOrders.length === 0) return localOrders;
  if (localOrders.length === 0) return apiOrders;
  
  // Criar mapa de IDs de pedidos da API
  const apiOrderMap = new Map(apiOrders.map(order => [order.id, order]));
  
  // Adicionar pedidos locais que não estão na resposta da API
  for (const localOrder of localOrders) {
    if (!apiOrderMap.has(localOrder.id)) {
      apiOrders.push(localOrder);
    }
  }
  
  // Ordenar por data de criação (mais recentes primeiro)
  return apiOrders.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.created_at).getTime();
    const dateB = new Date(b.createdAt || b.created_at).getTime();
    return dateB - dateA;
  });
}

export async function getOrders(): Promise<Order[]> {
  try {
    // Obter pedidos do localStorage como backup
    const localOrders = getOrdersFromLocalStorage();
    
    // Tentar obter dados da API
    const response = await fetchFromApi<{ success?: boolean; orders?: Order[] }>('/queue');
    
    if (!response || !response.orders || !Array.isArray(response.orders)) {
      console.error('Estrutura de resposta inválida da API de fila:', response);
      console.log('Usando dados do localStorage como fallback');
      return localOrders;
    }
    
    console.log('Dados obtidos da fila de pedidos:', response);
    
    // Converter do formato da fila para o formato esperado pelo admin
    const apiOrders = response.orders.map((order: any) => ({
      id: order.id,
      ticketNumber: order.ticket,
      status: order.status || 'recebido',
      createdAt: order.createdAt,
      created_at: order.createdAt, // Duplicar para compatibilidade
      totalAmount: order.total,
      items: order.items.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes
      })),
      customer: {
        name: order.customerName || 'Cliente',
        email: order.customerEmail || `${order.customerName?.replace(/\s+/g, '-').toLowerCase() || 'cliente'}@example.com`,
        phone: order.customerPhone || ''
      },
      paymentMethod: 'pix',
      paymentStatus: 'paid'
    }));
    
    // Verificar se a API retornou pedidos e decidir o que fazer
    if (apiOrders.length === 0 && localOrders.length > 0) {
      console.log(`API retornou lista vazia, mantendo ${localOrders.length} pedidos do localStorage`);
      return localOrders;
    }
    
    // Mesclar pedidos da API com os pedidos locais para evitar perda de dados
    const mergedOrders = mergeOrders(apiOrders, localOrders);
    
    // Salvar os dados mesclados no localStorage para uso futuro
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
    // Em caso de erro, retornar dados do localStorage
    const localOrders = getOrdersFromLocalStorage();
    console.log(`Usando ${localOrders.length} pedidos do localStorage devido a erro na API`);
    return localOrders;
  }
}

const STATS_STORAGE_KEY = 'falecomigo-admin-stats';

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
    const response = await fetchFromApi('/queue/sync');
    
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

// Modificar o método getDashboardStats para usar a função de sincronização
export async function getDashboardStats() {
  try {
    // Sincronizar dados da fila primeiro
    await syncQueueWithLocalStorage();
    
    // Buscar os pedidos usando a mesma função que busca da fila
    const orders = await getOrders();
    
    // Buscar produtos ativos ou usar dados em cache
    let products: any[] = [];
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');
      
      if (error) throw error;
      products = data || [];
      
    } catch (prodError) {
      console.error('Erro ao buscar produtos:', prodError);
      // Tentar usar último valor conhecido
      try {
        const storedStats = localStorage.getItem(STATS_STORAGE_KEY);
        if (storedStats) {
          const stats = JSON.parse(storedStats);
          products = new Array(stats.productCount).fill({});
        }
      } catch (e) {
        console.error('Erro ao recuperar estatísticas do localStorage:', e);
      }
    }

    // Calcular estatísticas
    const totalSales = orders?.reduce((sum, order) => sum + order.totalAmount, 0) || 0;
    const productCount = products?.length || 0;
    
    const stats = {
      totalSales,
      productCount,
      orderCount: orders.length
    };

    console.log('Dashboard stats calculado:', stats);
    
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
    
    // Retornar valores padrão em caso de erro para evitar quebra do dashboard
    return {
      totalSales: 0,
      productCount: 0,
      orderCount: 0
    };
  }
}

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

export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Erro ao atualizar status do pedido ${id}:`, error);
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
    const response = await fetchFromApi('/queue/clear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ confirm: true })
    });
    
    if (!response || !response.success) {
      console.error('Erro ao limpar dados no servidor:', response);
      throw new Error('Não foi possível limpar os dados no servidor');
    }
    
    console.log('Dados do sistema limpos com sucesso:', response);
    return;
  } catch (error) {
    console.error('Erro ao limpar dados do sistema:', error);
    throw error;
  }
} 