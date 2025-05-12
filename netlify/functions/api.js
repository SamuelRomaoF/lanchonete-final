// Simple serverless API for Netlify Functions
// Usando JSONBin.io para armazenamento persistente
const JSONBIN_API_KEY = '$2a$10$x1g/gJkm9BCXgqeOEyIF1exCgqGeelU6NbZBMYN0eAbXmfpDH74.y'; // API key para JSONBin.io
const BINS = {
  categories: '682162cf8561e97a5012185b', // ID do bin para categorias
  products: '682162fc8960c979a597b1f3',   // ID do bin para produtos
  featured: '682162fe8960c979a597b1f7',   // ID do bin para produtos em destaque
  promotions: '682163018561e97a50121874'  // ID do bin para produtos em promoção
};

// Funções para interagir com JSONBin.io
async function fetchFromBin(binId) {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': JSONBIN_API_KEY
      }
    });
    
    if (!response.ok) {
      console.error('Erro ao buscar dados do JSONBin:', await response.text());
      return [];
    }
    
    const data = await response.json();
    return data.record || [];
  } catch (error) {
    console.error('Erro ao buscar dados do JSONBin:', error);
    return [];
  }
}

async function updateBin(binId, data) {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      console.error('Erro ao atualizar dados no JSONBin:', await response.text());
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar dados no JSONBin:', error);
    return false;
  }
}

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
        
        // Buscar categorias existentes
        const categories = await fetchFromBin(BINS.categories);
        
        // Gerar ID para nova categoria
        const newId = categories.length > 0 
          ? Math.max(...categories.map(c => c.id)) + 1 
          : 1;
        
        const newCategory = {
          id: newId,
          ...data
        };
        
        // Adicionar à lista e atualizar no JSONBin
        categories.push(newCategory);
        await updateBin(BINS.categories, categories);
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newCategory)
        };
      } catch (err) {
        console.error('Erro ao criar categoria:', err);
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
        
        // Buscar produtos existentes
        const products = await fetchFromBin(BINS.products);
        
        // Gerar ID para novo produto
        const newId = products.length > 0 
          ? Math.max(...products.map(p => p.id)) + 1 
          : 1;
        
        const newProduct = {
          id: newId,
          ...data,
          isFeatured: data.isFeatured || false,
          isPromotion: data.isPromotion || false,
          available: data.available !== false
        };
        
        // Adicionar à lista de produtos e atualizar no JSONBin
        products.push(newProduct);
        await updateBin(BINS.products, products);
        
        // Se o produto está marcado como featured, adicionar à lista de destaque
        if (newProduct.isFeatured) {
          const featuredProducts = await fetchFromBin(BINS.featured);
          featuredProducts.push(newProduct);
          await updateBin(BINS.featured, featuredProducts);
        }
        
        // Se o produto está marcado como promotion, adicionar à lista de promoções
        if (newProduct.isPromotion) {
          const promotionProducts = await fetchFromBin(BINS.promotions);
          promotionProducts.push(newProduct);
          await updateBin(BINS.promotions, promotionProducts);
        }
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newProduct)
        };
      } catch (err) {
        console.error('Erro ao criar produto:', err);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Dados inválidos', details: err.message })
        };
      }
    }

    // GET - Obter categorias
    if ((path === '/categories' || path === '/api/categories') && event.httpMethod === 'GET') {
      const categories = await fetchFromBin(BINS.categories);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(categories)
      };
    }

    // GET - Obter produtos
    if ((path === '/products' || path === '/api/products') && event.httpMethod === 'GET') {
      const products = await fetchFromBin(BINS.products);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(products)
      };
    }

    // GET - Obter produtos em destaque
    if ((path === '/products/featured' || path === '/api/products/featured') && event.httpMethod === 'GET') {
      const featuredProducts = await fetchFromBin(BINS.featured);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(featuredProducts)
      };
    }

    // GET - Obter produtos em promoção
    if ((path === '/products/promotions' || path === '/api/products/promotions') && event.httpMethod === 'GET') {
      const promotionProducts = await fetchFromBin(BINS.promotions);
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