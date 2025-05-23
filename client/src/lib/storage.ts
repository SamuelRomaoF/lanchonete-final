import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase.js';

// Bucket para armazenamento de imagens de produtos
const PRODUCT_IMAGES_BUCKET = 'product-images';

// Verificar se o bucket existe ou criar
export async function initializeStorage() {
  try {
    // Primeiro verificar se o usuário está autenticado
    const { data: sessionData } = await supabase.auth.getSession();
    const isAuthenticated = !!sessionData?.session;
    
    // Se não estiver autenticado, não tente criar o bucket
    if (!isAuthenticated) {
      console.log('Usuário não autenticado, pulando inicialização de storage');
      return;
    }
    
    // Verificar se o bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Erro ao verificar buckets:', listError);
      throw listError;
    }
    
    // Se o bucket não existir, criar
    if (!buckets?.find(bucket => bucket.name === PRODUCT_IMAGES_BUCKET)) {
      const { data, error } = await supabase.storage.createBucket(
        PRODUCT_IMAGES_BUCKET, 
        { public: true } // Tornar as imagens acessíveis publicamente
      );
      
      if (error) {
        console.error('Erro ao criar bucket de imagens:', error);
        throw error;
      }
      
      console.log('Bucket de imagens criado com sucesso:', data);
    } else {
      console.log('Bucket de imagens já existe');
    }
  } catch (error) {
    console.error('Erro ao inicializar storage:', error);
  }
}

// Função para fazer upload de imagem
export async function uploadProductImage(file: File): Promise<string> {
  try {
    // Verificar se o usuário está autenticado
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      throw new Error('Usuário não autenticado, não é possível fazer upload de imagens');
    }
    
    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    // Fazer upload do arquivo
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Erro ao fazer upload da imagem:', uploadError);
      throw uploadError;
    }
    
    // Obter URL pública da imagem
    const { data } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    throw error;
  }
}

// Função para excluir imagem
export async function deleteProductImage(imageUrl: string): Promise<void> {
  try {
    // Verificar se o usuário está autenticado
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      throw new Error('Usuário não autenticado, não é possível excluir imagens');
    }
    
    // Extrair o nome do arquivo da URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    // Verificar se a imagem é do nosso storage (pode ser uma URL externa)
    if (!imageUrl.includes(PRODUCT_IMAGES_BUCKET)) {
      console.log('URL de imagem externa, ignorando exclusão:', imageUrl);
      return;
    }
    
    // Excluir o arquivo
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([fileName]);
    
    if (error) {
      console.error('Erro ao excluir imagem:', error);
      throw error;
    }
    
    console.log('Imagem excluída com sucesso:', fileName);
  } catch (error) {
    console.error('Erro ao excluir imagem:', error);
    throw error;
  }
} 