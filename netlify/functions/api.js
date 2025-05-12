// Simple serverless API for Netlify Functions
// Dados em memória (serão perdidos após reset da função)
let categories = [];
let products = [];
let featuredProducts = [];
let promotionProducts = [];

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Content-Type': 'application/json'
  };

  // Log the request for debugging
  console.log('Request path:', event.path);
  console.log('Request method:', event.httpMethod);

  try {
    // Get the path without the /.netlify/functions/api prefix
    const path = event.path.replace('/.netlify/functions/api', '');
    
    // Handle OPTIONS request (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight successful' })
      };
    }
    
    // POST - Criar nova categoria
    if ((path === '/categories' || path === '/api/categories') && event.httpMethod === 'POST') {
      try {
        const data = JSON.parse(event.body);
        const newCategory = {
          id: Date.now(), // ID temporário baseado em timestamp
          ...data
        };
        
        categories.push(newCategory);
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newCategory)
        };
      } catch (err) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Dados inválidos', details: err.message })
        };
      }
    }
    
    // POST - Criar novo produto
    if ((path === '/products' || path === '/api/products') && event.httpMethod === 'POST') {
      try {
        const data = JSON.parse(event.body);
        const newProduct = {
          id: Date.now(),
          ...data
        };
        
        products.push(newProduct);
        
        // Se o produto está marcado como featured, adicionar à lista de destaque
        if (newProduct.isFeatured) {
          featuredProducts.push(newProduct);
        }
        
        // Se o produto está marcado como promotion, adicionar à lista de promoções
        if (newProduct.isPromotion) {
          promotionProducts.push(newProduct);
        }
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newProduct)
        };
      } catch (err) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Dados inválidos', details: err.message })
        };
      }
    }

    // GET - Obter categorias
    if ((path === '/categories' || path === '/api/categories') && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(categories)
      };
    }

    // GET - Obter produtos
    if ((path === '/products' || path === '/api/products') && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(products)
      };
    }

    // GET - Obter produtos em destaque
    if ((path === '/products/featured' || path === '/api/products/featured') && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(featuredProducts)
      };
    }

    // GET - Obter produtos em promoção
    if ((path === '/products/promotions' || path === '/api/products/promotions') && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(promotionProducts)
      };
    }

    if ((path === '/queue/check-reset' || path === '/api/queue/check-reset') && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, reset: false })
      };
    }

    if ((path === '/queue/sync' || path === '/api/queue/sync') && 
        (event.httpMethod === 'POST' || event.httpMethod === 'GET')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    // Default case: Path not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'Rota não encontrada',
        path: event.path,
        method: event.httpMethod,
        cleanPath: path
      })
    };
  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno do servidor', details: error.message })
    };
  }
}; 