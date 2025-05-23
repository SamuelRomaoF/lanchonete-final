const { createClient } = require('@supabase/supabase-js');

// Inicializar cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Configuração de CORS
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

exports.handler = async (event, context) => {
  // Lidar com requisições OPTIONS (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const path = event.path.replace('/.netlify/functions/categories', '');
  const segments = path.split('/').filter(Boolean);

  try {
    // GET /categories - Listar todas as categorias
    if (event.httpMethod === 'GET' && segments.length === 0) {
      const { data, error } = await supabase
        .from('categories')
        .select('*');

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    // GET /categories/:id - Buscar categoria específica
    if (event.httpMethod === 'GET' && segments.length === 1) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', segments[0])
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    // POST /categories - Criar nova categoria
    if (event.httpMethod === 'POST' && segments.length === 0) {
      const categoryData = JSON.parse(event.body);
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data)
      };
    }

    // PUT /categories/:id - Atualizar categoria
    if (event.httpMethod === 'PUT' && segments.length === 1) {
      const categoryData = JSON.parse(event.body);
      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', segments[0])
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    // DELETE /categories/:id - Excluir categoria
    if (event.httpMethod === 'DELETE' && segments.length === 1) {
      // Primeiro, verificar se existem produtos associados
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('categoryId', segments[0]);

      if (productsError) throw productsError;

      if (products && products.length > 0) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error: 'Não é possível excluir a categoria pois existem produtos associados a ela.'
          })
        };
      }

      // Se não houver produtos, prosseguir com a exclusão
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', segments[0]);

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Categoria excluída com sucesso' })
      };
    }

    // Rota não encontrada
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Rota não encontrada' })
    };

  } catch (error) {
    console.error('Erro:', error);
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Erro interno do servidor'
      })
    };
  }
}; 