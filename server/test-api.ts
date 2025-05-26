import { supabase } from './lib/supabase';

async function testApiConnection() {
  try {
    console.log('Testando conexão da API com Supabase...');
    
    // Testar conexão com categorias
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');
      
    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError.message);
    } else {
      console.log('✅ Conexão com tabela categories ok!');
      console.log('Categorias encontradas:', categories?.length || 0);
    }
    
    // Testar conexão com produtos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');
      
    if (productsError) {
      console.error('❌ Erro ao buscar produtos:', productsError.message);
    } else {
      console.log('✅ Conexão com tabela products ok!');
      console.log('Produtos encontrados:', products?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testApiConnection(); 