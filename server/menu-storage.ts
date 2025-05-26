import { createClient } from '@supabase/supabase-js';
import { Category, Product } from '../shared/schema';

// Configuração direta para debug
const supabaseUrl = 'https://jkisabfnmzrgzazlazcq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraXNhYmZubXpyZ3phemxhemNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIyNzExMiwiZXhwIjoyMDYzODAzMTEyfQ.1jOzq5yx3eEiRGHEbYb18-3F9TYtNatUzBVNQri0Uyc';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      .eq('is_featured', true)
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
      .eq('is_promotion', true)
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

// Função para fazer upload de imagem
export async function uploadImage(file: File, path: string) {
  try {
    const { data, error } = await supabase.storage
      .from('menu-images')
      .upload(path, file);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    throw error;
  }
}

// Função para excluir imagem
export async function deleteImage(path: string) {
  try {
    const { error } = await supabase.storage
      .from('menu-images')
      .remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao excluir imagem:', error);
    throw error;
  }
}

// Função para obter URL pública da imagem
export function getImageUrl(path: string) {
  const { data } = supabase.storage
    .from('menu-images')
    .getPublicUrl(path);
  
  return data.publicUrl;
} 