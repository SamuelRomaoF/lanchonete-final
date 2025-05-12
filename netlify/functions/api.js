// Simple serverless API for Netlify Functions
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

    // Route handling based on path and method
    if (path === '/categories' || path === '/api/categories') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          { id: 1, name: "Hambúrgueres", description: "Deliciosos hambúrgueres artesanais", imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90" },
          { id: 2, name: "Pizzas", description: "Pizzas com bordas recheadas", imageUrl: "https://images.unsplash.com/photo-1590947132387-155cc02f3212" },
          { id: 3, name: "Porções", description: "Porções para compartilhar", imageUrl: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d" },
          { id: 4, name: "Bebidas", description: "Refrigerantes e sucos", imageUrl: "https://images.unsplash.com/photo-1613564834361-9436948817d1" }
        ])
      };
    }

    if (path === '/products' || path === '/api/products') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          { id: 1, name: "X-Burguer", description: "Hambúrguer com queijo", price: 15.90, categoryId: 1, imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", available: true },
          { id: 2, name: "X-Salada", description: "Hambúrguer com queijo e salada", price: 18.90, categoryId: 1, imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349", available: true },
          { id: 3, name: "Pizza Margherita", description: "Molho de tomate, muçarela e manjericão", price: 35.90, categoryId: 2, imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3", available: true }
        ])
      };
    }

    if (path === '/products/featured' || path === '/api/products/featured') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          { id: 1, name: "X-Burguer", description: "Hambúrguer com queijo", price: 15.90, categoryId: 1, imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", isFeatured: true, available: true },
          { id: 2, name: "X-Salada", description: "Hambúrguer com queijo e salada", price: 18.90, categoryId: 1, imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349", isFeatured: true, available: true }
        ])
      };
    }

    if (path === '/products/promotions' || path === '/api/products/promotions') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          { id: 3, name: "Pizza Margherita", description: "Molho de tomate, muçarela e manjericão", price: 35.90, oldPrice: 42.90, categoryId: 2, imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3", isPromotion: true, available: true }
        ])
      };
    }

    if (path === '/queue/check-reset' || path === '/api/queue/check-reset') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, reset: false })
      };
    }

    if (path === '/queue/sync' || path === '/api/queue/sync') {
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