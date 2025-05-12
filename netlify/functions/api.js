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

// Helper para extrair e validar IDs de produtos/categorias
function extractAndValidateId(path) {
  const parts = path.split('/');
  const idStr = parts[parts.length - 1];
  const id = parseInt(idStr, 10);
  
  const result = {
    idStr,
    id,
    isValid: !isNaN(id)
  };
  
  console.log(`Extraindo ID da rota ${path}: ${JSON.stringify(result)}`);
  
  return result;
}

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
      try {
        console.log('Buscando todas as categorias');
        
        const categories = await fetchFromBin(BINS.categories);
        console.log('Categorias encontradas:', categories.length);
        
        // Se não houver categorias, retornar array vazio em vez de null
        if (!categories || !Array.isArray(categories)) {
          console.log('Nenhuma categoria encontrada ou formato inválido, retornando array vazio');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify([])
          };
        }
        
        // Garantir que todas as categorias tenham campos obrigatórios
        const validatedCategories = categories.map(category => {
          return {
            id: typeof category.id === 'number' ? category.id : 0,
            name: category.name || 'Sem nome',
            description: category.description || '',
            imageUrl: category.imageUrl || '',
          };
        });
        
        console.log('Categorias validadas:', validatedCategories.length);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(validatedCategories)
        };
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Erro ao buscar categorias' })
        };
      }
    }

    // GET - Obter produtos
    if ((path === '/products' || path === '/api/products') && event.httpMethod === 'GET') {
      try {
        const products = await fetchFromBin(BINS.products);
        
        // Garantir que todos os produtos tenham campos obrigatórios
        const validatedProducts = products.map(product => {
          return {
            id: product.id || 0,
            name: product.name || 'Sem nome',
            description: product.description || '',
            price: product.price || 0,
            categoryId: product.categoryId || 0,
            imageUrl: product.imageUrl || '',
            available: product.available !== false,
            isFeatured: product.isFeatured || false,
            isPromotion: product.isPromotion || false,
            oldPrice: product.oldPrice || null
          };
        });
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(validatedProducts)
        };
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Erro ao buscar produtos' })
        };
      }
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
      
      // Responder com formato esperado pelo frontend
      const responseData = {
        success: true,
        reset: false,
        timestamp: new Date().toISOString()
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(responseData)
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

    // Implementação da rota de admin dashboard
    if ((path === '/admin/dashboard' || path === '/api/admin/dashboard') && event.httpMethod === 'GET') {
      console.log('Processando requisição para dashboard do admin');
      
      try {
        // Contar produtos 
        const products = await fetchFromBin(BINS.products);
        
        // Criar estatísticas de dashboard
        const dashboardStats = {
          totalOrders: 0,
          totalSales: 0,
          pendingOrders: 0,
          productCount: products.length,
          recentOrders: [],
          popularProducts: []
        };
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(dashboardStats)
        };
      } catch (error) {
        console.error('Erro ao gerar estatísticas do dashboard:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Erro ao gerar estatísticas' })
        };
      }
    }

    // Buscar produto pelo ID
    if ((path.match(/^\/products\/\d+$/) || path.match(/^\/api\/products\/\d+$/)) && event.httpMethod === 'GET') {
      try {
        console.log('Buscando produto por ID:', path);
        
        // Extrair e validar ID usando o helper
        const idInfo = extractAndValidateId(path);
        
        if (!idInfo.isValid) {
          console.log('ID do produto inválido:', idInfo.idStr);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID de produto inválido' })
          };
        }
        
        const productId = idInfo.id; // Usar o ID já convertido para número
        console.log('ID do produto a buscar:', productId, 'tipo:', typeof productId);
        
        const products = await fetchFromBin(BINS.products);
        console.log('Total de produtos:', products.length);
        console.log('IDs de produtos disponíveis:', products.map(p => p.id));
        
        // Verificar explicitamente se o produto existe usando comparação estrita
        const product = products.find(p => p.id === productId);
        
        if (!product) {
          console.log(`Produto não encontrado com ID: ${productId} (tipo: ${typeof productId})`);
          
          // Verificação adicional para depuração
          const productIdsExatos = products.map(p => `${p.id} (tipo: ${typeof p.id})`);
          console.log('IDs de produtos com tipo:', productIdsExatos);
          
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Produto não encontrado' })
          };
        }
        
        console.log('Produto encontrado:', product);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(product)
        };
      } catch (error) {
        console.error('Erro ao buscar produto por ID:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Erro ao buscar produto', details: error.message })
        };
      }
    }

    // PUT - Atualizar categoria existente
    if ((path.match(/^\/categories\/\d+$/) || path.match(/^\/api\/categories\/\d+$/)) && event.httpMethod === 'PUT') {
      try {
        console.log('Tentando atualizar categoria com caminho:', path);
        
        // Extrair e validar ID usando o helper
        const idInfo = extractAndValidateId(path);
        
        if (!idInfo.isValid) {
          console.log('ID da categoria inválido:', idInfo.idStr);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID de categoria inválido' })
          };
        }
        
        const categoryId = idInfo.id; // Usar o ID já convertido para número
        console.log('ID da categoria a atualizar:', categoryId, 'tipo:', typeof categoryId);
        
        const updateData = JSON.parse(event.body);
        console.log('Dados para atualização:', updateData);
        
        // Buscar categorias existentes
        const categories = await fetchFromBin(BINS.categories);
        console.log('IDs de categorias disponíveis:', categories.map(c => c.id));
        
        // Encontrar o índice da categoria a ser atualizada usando comparação estrita
        const categoryIndex = categories.findIndex(c => c.id === categoryId);
        
        if (categoryIndex === -1) {
          console.log(`Categoria não encontrada com ID: ${categoryId} (tipo: ${typeof categoryId})`);
          
          // Verificação adicional para depuração
          const categoryIdsExatos = categories.map(c => `${c.id} (tipo: ${typeof c.id})`);
          console.log('IDs de categorias com tipo:', categoryIdsExatos);
          
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Categoria não encontrada' })
          };
        }
        
        console.log('Categoria original:', categories[categoryIndex]);
        
        // Atualizar a categoria
        const updatedCategory = {
          ...categories[categoryIndex],
          ...updateData,
          id: categoryId // Garantir que o ID não mude
        };
        
        console.log('Categoria atualizada:', updatedCategory);
        
        categories[categoryIndex] = updatedCategory;
        
        // Salvar as alterações
        const success = await updateBin(BINS.categories, categories);
        
        if (!success) {
          console.error('Falha ao atualizar categoria no bin');
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Falha ao atualizar categoria' })
          };
        }
        
        console.log('Categoria atualizada com sucesso, ID:', categoryId);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updatedCategory)
        };
      } catch (err) {
        console.error('Erro ao atualizar categoria:', err);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Dados inválidos', details: err.message })
        };
      }
    }

    // DELETE - Excluir produto
    if ((path.match(/^\/products\/\d+$/) || path.match(/^\/api\/products\/\d+$/)) && event.httpMethod === 'DELETE') {
      try {
        console.log('Tentando excluir produto com caminho:', path);
        
        // Extrair e validar ID usando o helper
        const idInfo = extractAndValidateId(path);
        
        if (!idInfo.isValid) {
          console.log('ID do produto inválido:', idInfo.idStr);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID de produto inválido' })
          };
        }
        
        const productId = idInfo.id; // Usar o ID já convertido para número
        console.log('ID do produto a excluir:', productId, 'tipo:', typeof productId);
        
        // Buscar produtos existentes
        const products = await fetchFromBin(BINS.products);
        console.log('Produtos existentes:', products.length);
        
        // Listar IDs de produtos para debug
        console.log('IDs de produtos existentes:', products.map(p => p.id));
        
        // Verificar explicitamente se o produto existe usando uma comparação estrita
        const productToDelete = products.find(p => p.id === productId);
        
        if (!productToDelete) {
          console.log(`Produto não encontrado com ID: ${productId} (tipo: ${typeof productId})`);
          
          // Verificação adicional para depuração
          const productIdsExatos = products.map(p => `${p.id} (tipo: ${typeof p.id})`);
          console.log('IDs de produtos com tipo:', productIdsExatos);
          
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Produto não encontrado' })
          };
        }
        
        console.log('Produto a ser excluído:', productToDelete);
        
        // Filtrar o produto a ser removido com comparação estrita
        const filteredProducts = products.filter(p => p.id !== productId);
        console.log('Quantidade de produtos após a remoção:', filteredProducts.length);
        
        // Salvar as alterações
        const success = await updateBin(BINS.products, filteredProducts);
        
        if (!success) {
          console.error('Falha ao atualizar bin após excluir produto');
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Falha ao excluir produto' })
          };
        }
        
        console.log('Verificando remoção das listas especiais');
        
        // Remover também das listas especiais, se presente
        if (productToDelete.isFeatured) {
          const featuredProducts = await fetchFromBin(BINS.featured);
          const filteredFeatured = featuredProducts.filter(p => p.id !== productId);
          await updateBin(BINS.featured, filteredFeatured);
          console.log('Produto removido da lista de destacados');
        }
        
        if (productToDelete.isPromotion) {
          const promotionProducts = await fetchFromBin(BINS.promotions);
          const filteredPromotions = promotionProducts.filter(p => p.id !== productId);
          await updateBin(BINS.promotions, filteredPromotions);
          console.log('Produto removido da lista de promoções');
        }
        
        console.log('Produto excluído com sucesso, ID:', productId);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Produto excluído com sucesso' })
        };
      } catch (err) {
        console.error('Erro ao excluir produto:', err);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Erro ao excluir produto', details: err.message })
        };
      }
    }

    // DELETE - Excluir categoria
    if ((path.match(/^\/categories\/\d+$/) || path.match(/^\/api\/categories\/\d+$/)) && event.httpMethod === 'DELETE') {
      try {
        console.log('Tentando excluir categoria com caminho:', path);
        
        // Extrair e validar ID usando o helper
        const idInfo = extractAndValidateId(path);
        
        if (!idInfo.isValid) {
          console.log('ID da categoria inválido:', idInfo.idStr);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID de categoria inválido' })
          };
        }
        
        const categoryId = idInfo.id; // Usar o ID já convertido para número
        console.log('ID da categoria a excluir:', categoryId, 'tipo:', typeof categoryId);
        
        // Buscar categorias existentes
        const categories = await fetchFromBin(BINS.categories);
        console.log('Categorias existentes:', categories.length);
        console.log('IDs de categorias existentes:', categories.map(c => c.id));
        
        // Verificar se a categoria existe antes de remover usando comparação estrita
        const categoryToDelete = categories.find(c => c.id === categoryId);
        
        if (!categoryToDelete) {
          console.log(`Categoria não encontrada com ID: ${categoryId} (tipo: ${typeof categoryId})`);
          
          // Verificação adicional para depuração
          const categoryIdsExatos = categories.map(c => `${c.id} (tipo: ${typeof c.id})`);
          console.log('IDs de categorias com tipo:', categoryIdsExatos);
          
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Categoria não encontrada' })
          };
        }
        
        // Filtrar a categoria a ser removida usando comparação estrita
        const filteredCategories = categories.filter(c => c.id !== categoryId);
        console.log('Categorias após a remoção:', filteredCategories.length);
        
        // Salvar as alterações
        const success = await updateBin(BINS.categories, filteredCategories);
        
        if (!success) {
          console.error('Falha ao atualizar bin após excluir categoria');
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Falha ao excluir categoria' })
          };
        }
        
        console.log('Categoria excluída com sucesso, ID:', categoryId);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Categoria excluída com sucesso' })
        };
      } catch (err) {
        console.error('Erro ao excluir categoria:', err);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Erro ao excluir categoria', details: err.message })
        };
      }
    }

    // PUT - Atualizar produto existente
    if ((path.match(/^\/products\/\d+$/) || path.match(/^\/api\/products\/\d+$/)) && event.httpMethod === 'PUT') {
      try {
        console.log('Tentando atualizar produto com caminho:', path);
        
        // Extrair e validar ID usando o helper
        const idInfo = extractAndValidateId(path);
        
        if (!idInfo.isValid) {
          console.log('ID do produto inválido:', idInfo.idStr);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID de produto inválido' })
          };
        }
        
        const productId = idInfo.id; // Usar o ID já convertido para número
        console.log('ID do produto a atualizar:', productId, 'tipo:', typeof productId);
        
        const updateData = JSON.parse(event.body);
        console.log('Dados para atualização:', updateData);
        
        // Buscar produtos existentes
        const products = await fetchFromBin(BINS.products);
        console.log('IDs de produtos disponíveis:', products.map(p => p.id));
        
        // Encontrar o índice do produto a ser atualizado usando comparação estrita
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
          console.log(`Produto não encontrado com ID: ${productId} (tipo: ${typeof productId})`);
          
          // Verificação adicional para depuração
          const productIdsExatos = products.map(p => `${p.id} (tipo: ${typeof p.id})`);
          console.log('IDs de produtos com tipo:', productIdsExatos);
          
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Produto não encontrado' })
          };
        }
        
        console.log('Produto original:', products[productIndex]);
        
        // Verificar status anterior de featured e promotion
        const wasFeatureBefore = products[productIndex].isFeatured;
        const wasPromotionBefore = products[productIndex].isPromotion;
        
        // Atualizar o produto
        const updatedProduct = {
          ...products[productIndex],
          ...updateData,
          id: productId // Garantir que o ID não mude
        };
        
        console.log('Produto atualizado:', updatedProduct);
        
        products[productIndex] = updatedProduct;
        
        // Salvar as alterações na lista de produtos
        const success = await updateBin(BINS.products, products);
        
        if (!success) {
          console.error('Falha ao atualizar produto no bin');
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Falha ao atualizar produto' })
          };
        }
        
        console.log('Produto atualizado na lista principal');
        
        // Atualizar lista de featured se necessário
        if (updatedProduct.isFeatured !== wasFeatureBefore) {
          console.log('Status de featured alterado, atualizando lista...');
          
          const featuredProducts = await fetchFromBin(BINS.featured);
          
          if (updatedProduct.isFeatured) {
            // Adicionar aos destaques
            console.log('Adicionando produto aos destaques');
            featuredProducts.push(updatedProduct);
            await updateBin(BINS.featured, featuredProducts);
          } else {
            // Remover dos destaques
            console.log('Removendo produto dos destaques');
            const filteredFeatured = featuredProducts.filter(p => p.id !== productId);
            await updateBin(BINS.featured, filteredFeatured);
          }
        }
        
        // Atualizar lista de promotions se necessário
        if (updatedProduct.isPromotion !== wasPromotionBefore) {
          console.log('Status de promoção alterado, atualizando lista...');
          
          const promotionProducts = await fetchFromBin(BINS.promotions);
          
          if (updatedProduct.isPromotion) {
            // Adicionar às promoções
            console.log('Adicionando produto às promoções');
            promotionProducts.push(updatedProduct);
            await updateBin(BINS.promotions, promotionProducts);
          } else {
            // Remover das promoções
            console.log('Removendo produto das promoções');
            const filteredPromotions = promotionProducts.filter(p => p.id !== productId);
            await updateBin(BINS.promotions, filteredPromotions);
          }
        }
        
        console.log('Produto atualizado com sucesso, ID:', productId);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updatedProduct)
        };
      } catch (err) {
        console.error('Erro ao atualizar produto:', err);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Dados inválidos', details: err.message })
        };
      }
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