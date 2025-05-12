// Simple serverless API for Netlify Functions
// Usando JSONBin.io para armazenamento persistente
const JSONBIN_API_KEY = '$2a$10$x1g/gJkm9BCXgqeOEyIF1exCgqGeelU6NbZBMYN0eAbXmfpDH74.y'; // API key para JSONBin.io
const BINS = {
  categories: '682162cf8561e97a5012185b', // ID do bin para categorias
  products: '682162fc8960c979a597b1f3',   // ID do bin para produtos
  featured: '682162fe8960c979a597b1f7',   // ID do bin para produtos em destaque
  promotions: '682163018561e97a50121874',  // ID do bin para produtos em promoção
  users: '682164e48a456b79669bf1ef'  // ID do bin para usuários
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

// Funções para manipulação de usuários
async function getUserByEmail(email) {
  try {
    const users = await fetchFromBin(BINS.users);
    return users.find(user => user.email === email);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}

// Função para verificar se o bin de usuários já existe e criar um admin se necessário
async function initializeUsersBin() {
  try {
    // Se o bin de usuários não está configurado, não podemos fazer nada ainda
    if (!BINS.users) {
      console.log('Bin de usuários não configurado!');
      return;
    }

    console.log('Inicializando bin de usuários...');
    console.log('ID do bin de usuários:', BINS.users);

    // Tenta buscar os usuários
    let users;
    try {
      users = await fetchFromBin(BINS.users);
      console.log('Usuários encontrados no bin:', users);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return;
    }
    
    // Se não existem usuários ainda, cria o usuário admin
    if (!users || users.length === 0) {
      console.log('Nenhum usuário encontrado. Criando usuário admin inicial...');
      
      const adminUser = {
        id: 1,
        name: 'Administrador',
        email: 'adm@lanchonete.com',
        // Esta não é uma maneira segura de armazenar senhas, mas é simples para uma demonstração
        password: 'admin123',
        type: 'admin',
        createdAt: new Date().toISOString()
      };
      
      users = [adminUser];
      
      try {
        const success = await updateBin(BINS.users, users);
        if (success) {
          console.log('Usuário admin criado com sucesso!');
        } else {
          console.error('Falha ao criar usuário admin.');
        }
      } catch (error) {
        console.error('Erro ao atualizar bin de usuários:', error);
      }
    } else {
      console.log('Usuários já existem no bin. Verificando se existe usuário admin...');
      
      // Verificar se existe um usuário admin
      const adminExists = users.some(user => user.type === 'admin');
      
      if (!adminExists) {
        console.log('Nenhum usuário admin encontrado. Criando...');
        
        const adminUser = {
          id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
          name: 'Administrador',
          email: 'adm@lanchonete.com',
          password: 'admin123',
          type: 'admin',
          createdAt: new Date().toISOString()
        };
        
        users.push(adminUser);
        
        try {
          const success = await updateBin(BINS.users, users);
          if (success) {
            console.log('Usuário admin criado com sucesso!');
          } else {
            console.error('Falha ao criar usuário admin.');
          }
        } catch (error) {
          console.error('Erro ao atualizar bin de usuários:', error);
        }
      } else {
        console.log('Usuário admin já existe.');
      }
    }
  } catch (error) {
    console.error('Erro ao inicializar bin de usuários:', error);
  }
}

// Gerenciamento de sessões simplificado
const activeSessions = new Map();

function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Inicializar o bin de usuários quando a função é carregada
initializeUsersBin();

// Função para verificar se temos um valor JSON válido
function isValidJSON(json) {
  try {
    if (typeof json === 'string') {
      JSON.parse(json);
    }
    return true;
  } catch (e) {
    return false;
  }
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    
    // Extrair token de autenticação, se presente
    let authToken = null;
    if (event.headers && event.headers.authorization) {
      const parts = event.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        authToken = parts[1];
      }
    }
    
    // GET - Verificar usuário atual
    if ((path === '/auth/me' || path === '/api/auth/me') && event.httpMethod === 'GET') {
      // Se não há token, usuário não está autenticado
      if (!authToken || !activeSessions.has(authToken)) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Não autenticado' })
        };
      }
      
      // Retorna os dados do usuário da sessão
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user: activeSessions.get(authToken) })
      };
    }
    
    // POST - Login de usuários
    if ((path === '/auth/login' || path === '/api/auth/login') && event.httpMethod === 'POST') {
      try {
        console.log('Requisição de login recebida');
        
        let requestData;
        try {
          requestData = JSON.parse(event.body);
          console.log('Dados de requisição parseados com sucesso');
        } catch (e) {
          console.error('Erro ao parsear corpo da requisição:', e);
          console.log('Corpo bruto da requisição:', event.body);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Formato de dados inválido' })
          };
        }
        
        const { email, password } = requestData;
        
        console.log('Dados de login recebidos:', { email, password: '***' });
        
        if (!email || !password) {
          console.log('Email ou senha ausentes');
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Email e senha são obrigatórios' })
          };
        }
        
        console.log('Buscando usuário com email:', email);
        
        // Buscar usuários
        const users = await fetchFromBin(BINS.users);
        console.log('Usuários encontrados:', users);
        
        // Buscar usuário pelo email
        const user = users.find(u => u.email === email);
        
        if (!user) {
          console.log(`Usuário não encontrado: ${email}`);
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Email ou senha inválidos' })
          };
        }
        
        console.log(`Usuário encontrado: ${user.email}, tipo: ${user.type}`);
        console.log(`Verificando senha para: ${email}`);
        
        // Para simplificar, estamos fazendo uma comparação direta aqui
        // Em um ambiente real, você usaria bcrypt ou similar
        if (user.password !== password) {
          console.log('Senha incorreta');
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Email ou senha inválidos' })
          };
        }
        
        console.log('Senha correta, gerando token de sessão');
        
        // Remover a senha antes de armazenar na sessão
        const { password: _, ...userWithoutPassword } = user;
        
        // Gerar token de sessão
        const token = generateToken();
        activeSessions.set(token, userWithoutPassword);
        
        console.log(`Login bem-sucedido para: ${user.email}, tipo: ${user.type}, token: ${token}`);
        
        // Retornar usuário e token
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            user: userWithoutPassword,
            token
          })
        };
      } catch (err) {
        console.error('Erro ao fazer login:', err);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Erro interno do servidor', details: err.message })
        };
      }
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

    // Implementação da rota de check-reset
    if ((path === '/queue/check-reset' || path === '/api/queue/check-reset') && event.httpMethod === 'GET') {
      console.log('Processando requisição para check-reset');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, reset: false })
      };
    }

    // Implementação da rota de sync
    if ((path === '/queue/sync' || path === '/api/queue/sync') && 
        (event.httpMethod === 'POST' || event.httpMethod === 'GET')) {
      console.log('Processando requisição para queue/sync');
      const responseData = { success: true };
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(responseData)
      };
    }

    // Rota para o sistema de fila
    if ((path === '/queue' || path === '/api/queue') && event.httpMethod === 'GET') {
      console.log('Processando requisição para /queue');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ tickets: [] })
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