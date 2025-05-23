import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Category, Product } from '../shared/schema';

// Carregar env do arquivo .env.local na pasta client
const envPath = path.resolve(process.cwd(), 'client', '.env.local');
let supabaseUrl: string | undefined;
let supabaseKey: string | undefined;

try {
  // Tentar carregar de .env.local primeiro
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const envVars = envFile.split('\n')
      .filter(line => line && !line.startsWith('#'))
      .reduce((acc, line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^['"]|['"]$/g, '');
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);
    
    supabaseUrl = envVars.VITE_SUPABASE_URL;
    supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
  }
  
  // Se não encontrar em .env.local, tentar dotenv padrão
  if (!supabaseUrl || !supabaseKey) {
    dotenv.config();
    supabaseUrl = process.env.VITE_SUPABASE_URL;
    supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  }
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variáveis de ambiente do Supabase não encontradas');
  }
} catch (error) {
  console.error('Erro ao carregar configurações do Supabase:', error);
  throw new Error('Erro ao carregar configurações do Supabase');
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// --------- Funções para Categorias ---------

// Carregar categorias do banco de dados
export async function loadCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Erro ao carregar categorias:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    throw error;
  }
}

// Criar categoria
export async function createCategory(category: Omit<Category, 'id'>): Promise<Category> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    throw error;
  }
}

// Atualizar categoria
export async function updateCategory(id: string, data: Partial<Category>): Promise<Category | null> {
  try {
    const { data: updatedCategory, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erro ao atualizar categoria ${id}:`, error);
      throw error;
    }
    
    return updatedCategory;
  } catch (error) {
    console.error(`Erro ao atualizar categoria ${id}:`, error);
    throw error;
  }
}

// Excluir categoria
export async function deleteCategory(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erro ao excluir categoria ${id}:`, error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao excluir categoria ${id}:`, error);
    return false;
  }
}

// --------- Funções para Produtos ---------

// Carregar produtos do banco de dados
export async function loadProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Erro ao carregar produtos:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    throw error;
  }
}

// Criar produto
export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    throw error;
  }
}

// Atualizar produto
export async function updateProduct(id: string, data: Partial<Product>): Promise<Product | null> {
  try {
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erro ao atualizar produto ${id}:`, error);
      throw error;
    }
    
    return updatedProduct;
  } catch (error) {
    console.error(`Erro ao atualizar produto ${id}:`, error);
    throw error;
  }
}

// Excluir produto
export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erro ao excluir produto ${id}:`, error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao excluir produto ${id}:`, error);
    return false;
  }
}

// Obter produtos por categoria
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
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
  } catch (error) {
    console.error(`Erro ao buscar produtos da categoria ${categoryId}:`, error);
    return [];
  }
}

// Obter produtos em destaque
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
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
  } catch (error) {
    console.error('Erro ao buscar produtos em destaque:', error);
    return [];
  }
}

// Obter produtos em promoção
export async function getPromotionProducts(): Promise<Product[]> {
  try {
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
  } catch (error) {
    console.error('Erro ao buscar produtos em promoção:', error);
    return [];
  }
} 