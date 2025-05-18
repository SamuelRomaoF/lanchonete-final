// Simple serverless API for Netlify Functions
// Usando JSONBin.io para armazenamento persistente
const JSONBIN_API_KEY = '$2a$10$x1g/gJkm9BCXgqeOEyIF1exCgqGeelU6NbZBMYN0eAbXmfpDH74.y'; // API key para JSONBin.io
const BINS = {
  categories: '6829ec088561e97a50169220', // ID do bin para categorias
  products: '6829ec088a456b7966a06ca8',   // ID do bin para produtos
  featured: '6829ec098a456b7966a06caa',   // ID do bin para produtos em destaque
  promotions: '6829ec098a456b7966a06cac',  // ID do bin para produtos em promoção
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
    isValid: !isNaN(id) // ID 0 é válido, então usamos !isNaN em vez de verificar se é truthy
  };
  
  console.log(`Extraindo ID da rota ${path}: ${JSON.stringify(result)}`);
  console.log(`ID extraído: ${id} (tipo: ${typeof id}), isValid: ${result.isValid}, string original: '${idStr}'`);
  
  return result;
}

// Função para forçar a reescrita de um bin usando criação de nova versão
async function forceRewriteBin(binId, data) {
  try {
    console.log(`Forçando a reescrita completa do bin ${binId} com ${data.length} itens`);
    
    // Primeiro, vamos tentar a atualização normal
    let success = await updateBin(binId, data);
    
    if (!success) {
      console.log('Falha na atualização normal, tentando forçar com método alternativo...');
      
      // Tentativa alternativa: criar uma nova versão do bin
      const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_API_KEY,
          'X-Bin-Versioning': 'true'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        console.error('Falha também no segundo método de atualização:', await response.text());
        return false;
      }
      
      console.log('Reescrita forçada bem-sucedida!');
      return true;
    }
    
    return success;
  } catch (error) {
    console.error('Erro ao forçar reescrita do bin:', error);
    return false;
  }
}

// Funções para interagir com JSONBin.io
async function fetchFromBin(binId) {
  try {
    console.log(`NETLIFY DEBUG: Buscando dados do bin ${binId}`);
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': JSONBIN_API_KEY
      }
    });
    
    if (!response.ok) {
      console.error('NETLIFY DEBUG: Erro ao buscar dados do JSONBin:', await response.text());
      return [];
    }
    
    const data = await response.json();
    console.log(`NETLIFY DEBUG: Dados recebidos do bin ${binId} com sucesso`);
    return data.record || [];
  } catch (error) {
    console.error('NETLIFY DEBUG: Erro ao buscar dados do JSONBin:', error);
    return [];
  }
}

async function updateBin(binId, data) {
  try {
    console.log(`NETLIFY DEBUG: Atualizando bin ${binId} com ${data.length} itens`);
    console.log('NETLIFY DEBUG: Primeiro item da coleção (amostra):', data.length > 0 ? JSON.stringify(data[0]).substring(0, 100) : 'Sem itens');
    
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`NETLIFY DEBUG: Erro ao atualizar dados no JSONBin (status ${response.status}):`, errorText);
      return false;
    }
    
    const result = await response.json();
    console.log('NETLIFY DEBUG: Resposta do JSONBin após atualização:', JSON.stringify(result.metadata));
    return true;
  } catch (error) {
    console.error('NETLIFY DEBUG: Erro ao atualizar dados no JSONBin:', error);
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

// Função ainda mais radical para garantir que a exclusão funcione
async function recreateBinIfNeeded(binId, data, itemId) {
  try {
    console.log(`SOLUÇÃO RADICAL: Tentando recriar bin ${binId} para forçar a exclusão do item ${itemId}`);
    
    // Primeiro, tentamos a abordagem normal
    let success = await forceRewriteBin(binId, data);
    if (success) {
      console.log(`Sucesso com forceRewriteBin para item ${itemId}!`);
      return true;
    }

    console.log(`forceRewriteBin falhou para item ${itemId}, tentando método DRÁSTICO...`);
    
    // Se falhou, vamos fazer uma abordagem extrema: criar uma nova versão com um novo nome
    // Isso garante que o JSONBin.io trate como uma operação completamente nova
    const timestamp = new Date().getTime();
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY,
        'X-Bin-Name': `${binId}_fixed_${timestamp}`, // Forçar novo nome para garantir atualização
        'X-Bin-Versioning': 'false'  // Desativar versionamento para garantir substituição completa
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      console.error('Método drástico também falhou:', await response.text());
      return false;
    }
    
    console.log('SUCESSO com método drástico!');
    return true;
  } catch (error) {
    console.error('Erro ao tentar método radical de exclusão:', error);
    return false;
  }
}

// Função super radical para recriar completamente o bin
async function recreateBin(binId, data) {
  try {
    console.log(`SOLUÇÃO SUPER RADICAL: Recriando completamente o bin ${binId}`);
    console.log('Dados a serem salvos:', JSON.stringify(data).substring(0, 100) + '...');
    
    // Primeiro cria um novo bin temporário
    const createResponse = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY,
        'X-Bin-Private': 'false',
        'X-Bin-Name': `temp_${Date.now()}`
      },
      body: JSON.stringify(data)
    });
    
    if (!createResponse.ok) {
      console.error('Erro ao criar bin temporário:', await createResponse.text());
      return false;
    }
    
    const createResult = await createResponse.json();
    const tempBinId = createResult.metadata.id;
    console.log(`Bin temporário criado com ID: ${tempBinId}`);
    
    // Agora vamos copiar os dados para o bin original
    const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY
      },
      body: JSON.stringify(data)
    });
    
    if (!updateResponse.ok) {
      console.error('Erro ao atualizar bin original com dados do temporário:', await updateResponse.text());
      
      // Última tentativa: criar um novo bin com o nome exato do original
      console.log('Tentativa final: criar novo bin com nome do original');
      
      const finalResponse = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_API_KEY,
          'X-Bin-Private': 'false',
          'X-Bin-Name': binId // Usar o ID original como nome
        },
        body: JSON.stringify(data)
      });
      
      if (!finalResponse.ok) {
        console.error('Tentativa final falhou:', await finalResponse.text());
        return false;
      }
      
      console.log('Sucesso na tentativa final!');
      return true;
    }
    
    console.log('Bin original atualizado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro fatal ao recriar bin:', error);
    return false;
  }
}

// Função especial para forçar exclusão de ID 0
async function forceRemoveItemWithZeroId(binId) {
  try {
    console.log(`SOLUÇÃO EXTREMA: Forçando exclusão de item com ID 0 no bin ${binId}`);
    
    // Buscar todos os itens
    const items = await fetchFromBin(binId);
    console.log(`Total de itens antes: ${items.length}`);
    
    // Filtrar TODOS os itens com ID 0, independente do formato do ID (number ou string)
    const filteredItems = items.filter(item => {
      const isZero = item.id === 0 || item.id === '0' || String(item.id) === '0';
      if (isZero) {
        console.log(`Removendo item com ID zero: ${JSON.stringify(item)}`);
      }
      return !isZero;
    });
    
    console.log(`Total de itens após filtro: ${filteredItems.length}`);
    
    // Se realmente removeu algum item
    if (filteredItems.length < items.length) {
      console.log(`${items.length - filteredItems.length} itens com ID 0 foram encontrados e removidos`);
      
      // Criar um bin temporário completamente novo para garantir
      const createResponse = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_API_KEY,
          'X-Bin-Private': 'false',
          'X-Bin-Name': `clean_${Date.now()}`
        },
        body: JSON.stringify(filteredItems)
      });
      
      if (!createResponse.ok) {
        console.error('Erro ao criar bin temporário para limpeza:', await createResponse.text());
        return false;
      }
      
      // Obter ID do bin temporário
      const createResult = await createResponse.json();
      const tempBinId = createResult.metadata.id;
      console.log(`Bin temporário limpo criado com ID: ${tempBinId}`);
      
      // Agora vamos copiar os dados filtrados para o bin original
      const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_API_KEY,
          'X-Bin-Versioning': 'false' // Desativar versionamento para substituição completa
        },
        body: JSON.stringify(filteredItems)
      });
      
      if (!updateResponse.ok) {
        console.error('Erro ao atualizar bin original com dados limpos:', await updateResponse.text());
        return false;
      }
      
      console.log('Itens com ID 0 removidos com sucesso!');
      return true;
    } else {
      console.log('Nenhum item com ID 0 encontrado para remover');
      return true;
    }
  } catch (error) {
    console.error('Erro ao forçar remoção de item com ID 0:', error);
    return false;
  }
}

// Função específica para alternar a disponibilidade de um produto
async function toggleProductAvailability(productId, newAvailability = null) {
  try {
    console.log(`Alterando disponibilidade do produto ${productId} para ${newAvailability === null ? 'inverso do atual' : newAvailability}`);
    
    // Buscar todos os produtos
    const products = await fetchFromBin(BINS.products);
    
    // Encontrar o produto pelo ID
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      console.error(`Produto com ID ${productId} não encontrado`);
      return {
        success: false,
        message: 'Produto não encontrado'
      };
    }
    
    // Obter o produto
    const product = products[productIndex];
    
    // Se newAvailability não for especificado, inverter o valor atual
    const updatedAvailability = newAvailability !== null 
      ? newAvailability 
      : !product.available;
    
    console.log(`Alterando disponibilidade do produto "${product.name}" de ${product.available} para ${updatedAvailability}`);
    
    // Atualizar a disponibilidade
    products[productIndex] = {
      ...product,
      available: updatedAvailability
    };
    
    // Salvar de volta no bin
    const success = await updateBin(BINS.products, products);
    
    if (!success) {
      console.error('Falha ao atualizar disponibilidade do produto');
      return {
        success: false,
        message: 'Falha ao atualizar disponibilidade'
      };
    }
    
    // Também precisamos atualizar o produto em outros bins se ele estiver lá
    
    // Verificar se o produto está em destaque
    if (product.isFeatured) {
      const featuredProducts = await fetchFromBin(BINS.featured);
      const featuredIndex = featuredProducts.findIndex(p => p.id === productId);
      
      if (featuredIndex !== -1) {
        featuredProducts[featuredIndex].available = updatedAvailability;
        await updateBin(BINS.featured, featuredProducts);
      }
    }
    
    // Verificar se o produto está em promoção
    if (product.isPromotion) {
      const promotionProducts = await fetchFromBin(BINS.promotions);
      const promotionIndex = promotionProducts.findIndex(p => p.id === productId);
      
      if (promotionIndex !== -1) {
        promotionProducts[promotionIndex].available = updatedAvailability;
        await updateBin(BINS.promotions, promotionProducts);
      }
    }
    
    return {
      success: true,
      product: products[productIndex],
      message: `Produto ${updatedAvailability ? 'ativado' : 'desativado'} com sucesso`
    };
  } catch (error) {
    console.error('Erro ao alternar disponibilidade do produto:', error);
    return {
      success: false,
      message: 'Erro ao processar a solicitação'
    };
  }
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
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
        
        // Adicionar à lista e atualizar no JSONBin usando forceRewriteBin
        categories.push(newCategory);
        const success = await forceRewriteBin(BINS.categories, categories);
        
        if (!success) {
          console.error('Falha ao criar categoria no bin');
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Falha ao criar categoria' })
          };
        }
        
        console.log('Categoria criada com sucesso, ID:', newId);
        
        return {
          statusCode: 201,
          headers: {
            ...headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
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
        
        // Garantir que todos os campos obrigatórios estejam preenchidos
        const newProduct = {
          id: newId,
          name: data.name || 'Produto sem nome',
          description: data.description || '',
          price: typeof data.price === 'number' ? data.price : 0,
          categoryId: typeof data.categoryId === 'number' ? data.categoryId : null,
          imageUrl: data.imageUrl || '',
          isFeatured: data.isFeatured === true,
          isPromotion: data.isPromotion === true,
          available: data.available !== false,
          createdAt: new Date().toISOString(),
          oldPrice: data.oldPrice || null
        };
        
        console.log('Produto a ser criado:', JSON.stringify(newProduct));
        
        // Adicionar à lista de produtos e atualizar no JSONBin
        products.push(newProduct);
        const success = await forceRewriteBin(BINS.products, products);
        
        if (!success) {
          console.error('Falha ao criar produto no bin');
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Falha ao criar produto' })
          };
        }
        
        console.log('Produto adicionado à lista principal, ID:', newId);
        
        // Se o produto está marcado como featured, adicionar à lista de destaque
        if (newProduct.isFeatured) {
          const featuredProducts = await fetchFromBin(BINS.featured);
          featuredProducts.push(newProduct);
          
          // Garantir que a lista de produtos em destaque não esteja vazia
          if (!featuredProducts || !Array.isArray(featuredProducts) || featuredProducts.length === 0) {
            console.log('Lista de destaques vazia ou inválida, criando nova lista com o produto atual');
            await forceRewriteBin(BINS.featured, [newProduct]);
          } else {
            await forceRewriteBin(BINS.featured, featuredProducts);
          }
          
          console.log('Produto adicionado aos destaques');
        }
        
        // Se o produto está marcado como promotion, adicionar à lista de promoções
        if (newProduct.isPromotion) {
          const promotionProducts = await fetchFromBin(BINS.promotions);
          
          // Garantir que a lista de produtos em promoção não esteja vazia
          if (!promotionProducts || !Array.isArray(promotionProducts) || promotionProducts.length === 0) {
            console.log('Lista de promoções vazia ou inválida, criando nova lista com o produto atual');
            await forceRewriteBin(BINS.promotions, [newProduct]);
          } else {
            promotionProducts.push(newProduct);
            await forceRewriteBin(BINS.promotions, promotionProducts);
          }
          
          console.log('Produto adicionado às promoções');
        }
        
        console.log('Produto criado com sucesso, ID:', newId);
        
        return {
          statusCode: 201,
          headers: {
            ...headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
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
            headers: {
              ...headers,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            body: JSON.stringify([])
          };
        }
        
        // Filtrar categorias placeholder (id zero) antes de retornar para o frontend
        const visibleCategories = categories.filter(cat => cat.id !== 0 && cat.name !== "Categoria Placeholder");
        
        // Garantir que todas as categorias tenham campos obrigatórios
        const validatedCategories = visibleCategories.map(category => {
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
          headers: {
            ...headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
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
        
        // Filtrar produtos placeholder (id zero) antes de retornar para o frontend
        const visibleProducts = products.filter(prod => prod.id !== 0 && prod.name !== "Placeholder");
        
        // Garantir que todos os produtos tenham campos obrigatórios
        const validatedProducts = visibleProducts.map(product => {
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
          headers: {
            ...headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
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
      try {
        const featuredProducts = await fetchFromBin(BINS.featured);
        
        // Filtrar produtos placeholder
        const visibleFeatured = featuredProducts.filter(prod => prod.id !== 0 && prod.name !== "Placeholder");
        
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify(visibleFeatured)
        };
      } catch (error) {
        console.error('Erro ao buscar produtos em destaque:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Erro ao buscar produtos em destaque' })
        };
      }
    }

    // GET - Obter produtos em promoção
    if ((path === '/products/promotions' || path === '/api/products/promotions') && event.httpMethod === 'GET') {
      try {
        const promotionProducts = await fetchFromBin(BINS.promotions);
        
        // Filtrar produtos placeholder
        const visiblePromotions = promotionProducts.filter(prod => prod.id !== 0 && prod.name !== "Placeholder");
        
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify(visiblePromotions)
        };
      } catch (error) {
        console.error('Erro ao buscar produtos em promoção:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Erro ao buscar produtos em promoção' })
        };
      }
    }

    // Implementação da rota de check-reset
    if ((path === '/queue/check-reset' || path === '/api/queue/check-reset') && event.httpMethod === 'GET') {
      console.log('NETLIFY DEBUG: Processando requisição para check-reset');
      
      try {
        // Garantir que enviamos um JSON válido
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
      } catch (err) {
        console.error('NETLIFY DEBUG: Erro no endpoint check-reset:', err);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            reset: false,
            error: err.message,
            timestamp: new Date().toISOString()
          })
        };
      }
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
        
        // Tratamento especial para ID 0 se não encontrar - retorna um produto simulado
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
          
          // Para ID 0, retornar um produto simulado vazio caso não exista
          if (productId === 0) {
            console.log('ID 0 detectado - retornando produto simulado');
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                id: 0,
                name: 'Produto temporário',
                description: 'Este é um produto simulado para o ID 0',
                price: 0,
                categoryId: 0,
                imageUrl: '',
                available: false,
                isFeatured: false,
                isPromotion: false
              })
            };
          }
          
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
        
        // Salvar as alterações usando forceRewriteBin para garantir a atualização
        const success = await forceRewriteBin(BINS.categories, categories);
        
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

    // DELETE - Excluir categoria (ABORDAGEM DIRETA)
    if ((path.match(/^\/categories\/\d+$/) || path.match(/^\/api\/categories\/\d+$/)) && event.httpMethod === 'DELETE') {
      try {
        console.log('NETLIFY DEBUG [EXCLUSÃO REAL]: Iniciando exclusão de categoria');
        
        // Extrair ID da URL
        const parts = path.split('/');
        const idStr = parts[parts.length - 1];
        const categoryId = parseInt(idStr, 10);
        
        console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: ID da categoria a excluir: ${categoryId}`);
        
        // Processo passo a passo para depuração completa
        
        // 1. Buscar dados atuais
        console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Buscando dados da categoria do bin: ${BINS.categories}`);
        
        let fetchResponse;
        try {
          fetchResponse = await fetch(`https://api.jsonbin.io/v3/b/${BINS.categories}/latest`, {
            method: 'GET',
            headers: {
              'X-Master-Key': JSONBIN_API_KEY
            }
          });
          
          console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Status da resposta de busca: ${fetchResponse.status}`);
          
          if (!fetchResponse.ok) {
            const errorText = await fetchResponse.text();
            console.error(`NETLIFY DEBUG [EXCLUSÃO REAL]: Erro na resposta: ${errorText}`);
            throw new Error(`Falha ao buscar categorias: ${fetchResponse.status} - ${errorText}`);
          }
        } catch (fetchError) {
          console.error(`NETLIFY DEBUG [EXCLUSÃO REAL]: Erro na requisição fetch: ${fetchError.message}`);
          throw new Error(`Erro de rede ao buscar categorias: ${fetchError.message}`);
        }
        
        // 2. Parsear resposta
        let responseData;
        let categories;
        try {
          responseData = await fetchResponse.json();
          console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Dados recebidos, metadata: ${JSON.stringify(responseData.metadata)}`);
          categories = responseData.record || [];
          console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Total de categorias encontradas: ${categories.length}`);
        } catch (parseError) {
          console.error(`NETLIFY DEBUG [EXCLUSÃO REAL]: Erro ao parsear resposta: ${parseError.message}`);
          throw new Error(`Erro ao processar dados: ${parseError.message}`);
        }
        
        // 3. Filtrar categorias
        const filteredCategories = categories.filter(c => c.id !== categoryId);
        console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Categorias após filtro: ${filteredCategories.length} (removidas: ${categories.length - filteredCategories.length})`);
        
        // Verificar se a lista ficaria vazia após a exclusão
        if (filteredCategories.length === 0) {
          console.log('NETLIFY DEBUG [EXCLUSÃO REAL]: Lista de categorias ficaria vazia, adicionando placeholder');
          // JSONBin não aceita arrays vazios, então vamos adicionar uma categoria placeholder
          filteredCategories.push({
            id: 0,
            name: "Categoria Placeholder",
            description: "Esta é uma categoria placeholder que pode ser excluída",
            imageUrl: ""
          });
          console.log('NETLIFY DEBUG [EXCLUSÃO REAL]: Adicionada categoria placeholder para evitar bin vazio');
        }
        
        // 4. Atualizar dados
        let updateResponse;
        try {
          console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Atualizando bin com ${filteredCategories.length} categorias`);
          console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Exemplo de dados a enviar: ${JSON.stringify(filteredCategories.slice(0, 1))}`);
          
          updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${BINS.categories}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(filteredCategories)
          });
          
          console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Status da resposta de atualização: ${updateResponse.status}`);
          
          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error(`NETLIFY DEBUG [EXCLUSÃO REAL]: Erro na atualização: ${errorText}`);
            throw new Error(`Falha ao atualizar categorias: ${updateResponse.status} - ${errorText}`);
          }
          
          // Verificar resposta da atualização
          const updateResult = await updateResponse.json();
          console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Atualização bem-sucedida: ${JSON.stringify(updateResult.metadata)}`);
        } catch (updateError) {
          console.error(`NETLIFY DEBUG [EXCLUSÃO REAL]: Erro ao atualizar dados: ${updateError.message}`);
          throw new Error(`Falha na atualização: ${updateError.message}`);
        }
        
        // 5. Retornar sucesso
        console.log('NETLIFY DEBUG [EXCLUSÃO REAL]: Categoria realmente excluída com sucesso!');
        
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify({ 
            success: true, 
            message: 'Categoria excluída com sucesso',
            timestamp: Date.now()
          })
        };
      } catch (err) {
        console.error(`NETLIFY DEBUG [EXCLUSÃO REAL]: Erro fatal na exclusão: ${err.message}`);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Erro ao excluir categoria', 
            details: err.message 
          })
        };
      }
    }

    // DELETE - Excluir produto (ABORDAGEM DIRETA)
    if ((path.match(/^\/products\/\d+$/) || path.match(/^\/api\/products\/\d+$/)) && event.httpMethod === 'DELETE') {
      try {
        console.log('NETLIFY DEBUG [EXCLUSÃO REAL]: Iniciando exclusão de produto');
        
        // Extrair ID da URL
        const parts = path.split('/');
        const idStr = parts[parts.length - 1];
        const productId = parseInt(idStr, 10);
        
        console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: ID do produto a excluir: ${productId}`);
        
        // Processo passo a passo para depuração completa
        
        // 1. Buscar dados atuais
        console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Buscando dados do produto do bin: ${BINS.products}`);
        
        let fetchResponse;
        try {
          fetchResponse = await fetch(`https://api.jsonbin.io/v3/b/${BINS.products}/latest`, {
            method: 'GET',
            headers: {
              'X-Master-Key': JSONBIN_API_KEY
            }
          });
          
          console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Status da resposta de busca: ${fetchResponse.status}`);
          
          if (!fetchResponse.ok) {
            const errorText = await fetchResponse.text();
            console.error(`NETLIFY DEBUG [EXCLUSÃO REAL]: Erro na resposta: ${errorText}`);
            throw new Error(`Falha ao buscar produtos: ${fetchResponse.status} - ${errorText}`);
          }
        } catch (fetchError) {
          console.error(`NETLIFY DEBUG [EXCLUSÃO REAL]: Erro na requisição fetch: ${fetchError.message}`);
          throw new Error(`Erro de rede ao buscar produtos: ${fetchError.message}`);
        }
        
        // 2. Parsear resposta
        let responseData;
        let products;
        try {
          responseData = await fetchResponse.json();
          console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Dados recebidos, metadata: ${JSON.stringify(responseData.metadata)}`);
          products = responseData.record || [];
          console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Total de produtos encontrados: ${products.length}`);
        } catch (parseError) {
          console.error(`NETLIFY DEBUG [EXCLUSÃO REAL]: Erro ao parsear resposta: ${parseError.message}`);
          throw new Error(`Erro ao processar dados: ${parseError.message}`);
        }
        
        // 3. Filtrar produtos
        const filteredProducts = products.filter(p => p.id !== productId);
        console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Produtos após filtro: ${filteredProducts.length} (removidos: ${products.length - filteredProducts.length})`);
        
        // Verificar se há produtos após a filtragem
        if (filteredProducts.length === 0) {
          console.log('NETLIFY DEBUG [EXCLUSÃO REAL]: Atenção - Lista de produtos ficaria vazia após exclusão');
          // JSONBin não aceita arrays vazios, então vamos adicionar um produto vazio como placeholder
          filteredProducts.push({
            id: 0,
            name: "Placeholder",
            description: "Este é um produto placeholder que pode ser excluído",
            price: 0,
            imageUrl: "",
            categoryId: null,
            available: false,
            isFeatured: false,
            isPromotion: false,
            createdAt: new Date().toISOString()
          });
          console.log('NETLIFY DEBUG [EXCLUSÃO REAL]: Adicionado produto placeholder para evitar bin vazio');
        }
        
        // 4. Atualizar dados
        let updateResponse;
        try {
          console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Atualizando bin com ${filteredProducts.length} produtos`);
          console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Exemplo de dados a enviar: ${JSON.stringify(filteredProducts.slice(0, 1))}`);
          
          updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${BINS.products}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(filteredProducts)
          });
          
          console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Status da resposta de atualização: ${updateResponse.status}`);
          
          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error(`NETLIFY DEBUG [EXCLUSÃO REAL]: Erro na atualização: ${errorText}`);
            throw new Error(`Falha ao atualizar produtos: ${updateResponse.status} - ${errorText}`);
          }
          
          // Verificar resposta da atualização
          const updateResult = await updateResponse.json();
          console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Atualização bem-sucedida: ${JSON.stringify(updateResult.metadata)}`);
          
          // 5. Também atualizar listas especiais
          // Atualizar featured
          try {
            const featuredResponse = await fetch(`https://api.jsonbin.io/v3/b/${BINS.featured}/latest`, { 
              headers: { 'X-Master-Key': JSONBIN_API_KEY } 
            });
            
            if (featuredResponse.ok) {
              const featuredData = await featuredResponse.json();
              const featuredProducts = featuredData.record || [];
              const filteredFeatured = featuredProducts.filter(p => p.id !== productId);
              
              // Também verificar se a lista de destaques ficaria vazia
              if (filteredFeatured.length === 0) {
                console.log('NETLIFY DEBUG [EXCLUSÃO REAL]: Lista de destaques ficaria vazia, adicionando placeholder');
                filteredFeatured.push({
                  id: 0,
                  name: "Placeholder",
                  description: "Este é um produto placeholder que pode ser excluído",
                  price: 0,
                  imageUrl: "",
                  categoryId: null,
                  available: false,
                  isFeatured: true,
                  isPromotion: false,
                  createdAt: new Date().toISOString()
                });
              }
              
              if (filteredFeatured.length !== featuredProducts.length || featuredProducts.length === 0) {
                console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Atualizando produto na lista de destaques`);
                
                await fetch(`https://api.jsonbin.io/v3/b/${BINS.featured}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_API_KEY
                  },
                  body: JSON.stringify(filteredFeatured)
                });
                
                console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Produto removido dos destaques`);
              }
            }
          } catch (featuredError) {
            // Apenas log, não falhar a operação principal
            console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Erro ao atualizar destaques: ${featuredError.message}`);
          }
        
          // Atualizar promotions
          try {
            const promotionsResponse = await fetch(`https://api.jsonbin.io/v3/b/${BINS.promotions}/latest`, { 
              headers: { 'X-Master-Key': JSONBIN_API_KEY } 
            });
            
            if (promotionsResponse.ok) {
              const promotionsData = await promotionsResponse.json();
              const promotionProducts = promotionsData.record || [];
              const filteredPromotions = promotionProducts.filter(p => p.id !== productId);
              
              // Também verificar se a lista de promoções ficaria vazia
              if (filteredPromotions.length === 0) {
                console.log('NETLIFY DEBUG [EXCLUSÃO REAL]: Lista de promoções ficaria vazia, adicionando placeholder');
                filteredPromotions.push({
                  id: 0,
                  name: "Placeholder",
                  description: "Este é um produto placeholder que pode ser excluído",
                  price: 0,
                  imageUrl: "",
                  categoryId: null,
                  available: false,
                  isFeatured: false,
                  isPromotion: true,
                  createdAt: new Date().toISOString()
                });
              }
              
              if (filteredPromotions.length !== promotionProducts.length || promotionProducts.length === 0) {
                console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Atualizando produto na lista de promoções`);
                
                await fetch(`https://api.jsonbin.io/v3/b/${BINS.promotions}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_API_KEY
                  },
                  body: JSON.stringify(filteredPromotions)
                });
                
                console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Produto removido das promoções`);
              }
            }
          } catch (promotionsError) {
            // Apenas log, não falhar a operação principal
            console.log(`NETLIFY DEBUG [EXCLUSÃO REAL]: Erro ao atualizar promoções: ${promotionsError.message}`);
          }
        } catch (updateError) {
          console.error(`NETLIFY DEBUG [EXCLUSÃO REAL]: Erro ao atualizar dados: ${updateError.message}`);
          throw new Error(`Falha na atualização: ${updateError.message}`);
        }
        
        // 6. Retornar sucesso
        console.log('NETLIFY DEBUG [EXCLUSÃO REAL]: Produto realmente excluído com sucesso!');
        
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify({ 
            success: true, 
            message: 'Produto excluído com sucesso',
            timestamp: Date.now()
          })
        };
      } catch (err) {
        console.error(`NETLIFY DEBUG [EXCLUSÃO REAL]: Erro fatal na exclusão: ${err.message}`);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Erro ao excluir produto', 
            details: err.message 
          })
        };
      }
    }

    // PUT - Atualizar produto existente
    if ((path.match(/^\/products\/\d+$/) || path.match(/^\/api\/products\/\d+$/)) && event.httpMethod === 'PUT') {
      try {
        const data = JSON.parse(event.body);
        
        // Extrair ID do produto
        const parts = path.split('/');
        const idStr = parts[parts.length - 1];
        const productId = parseInt(idStr, 10);
        
        console.log(`NETLIFY DEBUG [ATUALIZAÇÃO]: Atualizando produto ID ${productId}`);
        
        // Buscar produtos existentes
        const products = await fetchFromBin(BINS.products);
        
        // Encontrar o produto
        const index = products.findIndex(p => p.id === productId);
        
        if (index === -1) {
          console.log(`NETLIFY DEBUG [ATUALIZAÇÃO]: Produto não encontrado com ID ${productId}`);
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Produto não encontrado' })
          };
        }
        
        // Garantir que todos os campos necessários sejam mantidos ou atualizados
        const updatedProduct = {
          ...products[index],
          name: data.name !== undefined ? data.name : products[index].name,
          description: data.description !== undefined ? data.description : (products[index].description || ''),
          price: data.price !== undefined ? data.price : products[index].price,
          categoryId: data.categoryId !== undefined ? data.categoryId : products[index].categoryId,
          imageUrl: data.imageUrl !== undefined ? data.imageUrl : (products[index].imageUrl || ''),
          isFeatured: data.isFeatured !== undefined ? data.isFeatured : (products[index].isFeatured || false),
          isPromotion: data.isPromotion !== undefined ? data.isPromotion : (products[index].isPromotion || false),
          available: data.available !== undefined ? data.available : (products[index].available !== false),
          oldPrice: data.oldPrice !== undefined ? data.oldPrice : products[index].oldPrice
        };
        
        // Verificar mudanças em featured/promotion status para atualização das listas especiais
        const wasInFeatured = products[index].isFeatured;
        const isNowInFeatured = updatedProduct.isFeatured;
        
        const wasInPromotion = products[index].isPromotion;
        const isNowInPromotion = updatedProduct.isPromotion;
        
        console.log(`NETLIFY DEBUG [ATUALIZAÇÃO]: Status de destaque: ${wasInFeatured} -> ${isNowInFeatured}`);
        console.log(`NETLIFY DEBUG [ATUALIZAÇÃO]: Status de promoção: ${wasInPromotion} -> ${isNowInPromotion}`);
        
        // Atualizar o produto na lista geral
        products[index] = updatedProduct;
        await updateBin(BINS.products, products);
        
        // Atualizar listas especiais se necessário
        // Lista de destaques - verificar se entrou ou saiu da lista
        try {
          if (wasInFeatured !== isNowInFeatured || isNowInFeatured) {
            const featuredProducts = await fetchFromBin(BINS.featured);
            
            // Verificação de segurança para garantir que featuredProducts seja um array
            const validFeaturedProducts = Array.isArray(featuredProducts) ? featuredProducts : [];
            
            if (isNowInFeatured) {
              // Adicionar ou atualizar na lista de destaques
              const featureIndex = validFeaturedProducts.findIndex(p => p.id === productId);
              
              if (featureIndex >= 0) {
                // Atualizar produto existente
                validFeaturedProducts[featureIndex] = updatedProduct;
              } else {
                // Adicionar novo produto
                validFeaturedProducts.push(updatedProduct);
              }
            } else if (wasInFeatured) {
              // Remover da lista de destaques
              const filteredFeatured = validFeaturedProducts.filter(p => p.id !== productId);
              
              // Verificar se a lista ficaria vazia e adicionar um placeholder se necessário
              if (filteredFeatured.length === 0) {
                filteredFeatured.push({
                  id: 0,
                  name: "Placeholder",
                  description: "Este é um produto placeholder que pode ser excluído",
                  price: 0,
                  imageUrl: "",
                  categoryId: null,
                  available: false,
                  isFeatured: true,
                  isPromotion: false,
                  createdAt: new Date().toISOString()
                });
              }
              
              await updateBin(BINS.featured, filteredFeatured);
            } else {
              // Apenas atualizar a lista de destaques
              await updateBin(BINS.featured, validFeaturedProducts);
            }
          }
        } catch (featuredError) {
          console.error('NETLIFY DEBUG [ATUALIZAÇÃO]: Erro ao atualizar lista de destaques', featuredError);
          // Continuar mesmo com erro
        }
        
        // Lista de promoções - verificar se entrou ou saiu da lista
        try {
          if (wasInPromotion !== isNowInPromotion || isNowInPromotion) {
            const promotionProducts = await fetchFromBin(BINS.promotions);
            
            // Verificação de segurança para garantir que promotionProducts seja um array
            const validPromotionProducts = Array.isArray(promotionProducts) ? promotionProducts : [];
            
            if (isNowInPromotion) {
              // Adicionar ou atualizar na lista de promoções
              const promoIndex = validPromotionProducts.findIndex(p => p.id === productId);
              
              if (promoIndex >= 0) {
                // Atualizar produto existente
                validPromotionProducts[promoIndex] = updatedProduct;
              } else {
                // Adicionar novo produto
                validPromotionProducts.push(updatedProduct);
              }
            } else if (wasInPromotion) {
              // Remover da lista de promoções
              const filteredPromotions = validPromotionProducts.filter(p => p.id !== productId);
              
              // Verificar se a lista ficaria vazia e adicionar um placeholder se necessário
              if (filteredPromotions.length === 0) {
                filteredPromotions.push({
                  id: 0,
                  name: "Placeholder",
                  description: "Este é um produto placeholder que pode ser excluído",
                  price: 0,
                  imageUrl: "",
                  categoryId: null,
                  available: false,
                  isFeatured: false,
                  isPromotion: true,
                  createdAt: new Date().toISOString()
                });
              }
              
              await updateBin(BINS.promotions, filteredPromotions);
            } else {
              // Apenas atualizar a lista de promoções
              await updateBin(BINS.promotions, validPromotionProducts);
            }
          }
        } catch (promotionError) {
          console.error('NETLIFY DEBUG [ATUALIZAÇÃO]: Erro ao atualizar lista de promoções', promotionError);
          // Continuar mesmo com erro
        }
        
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify(updatedProduct)
        };
      } catch (err) {
        console.error('Erro ao atualizar produto:', err);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Dados inválidos' })
        };
      }
    }

    // Endpoint para gerenciar disponibilidade de produtos
    if (path.match(/^\/api\/products\/\d+\/availability$/)) {
      // Este endpoint alterna a disponibilidade de um produto
      
      // Verificar se o método é PATCH
      if (event.httpMethod !== 'PATCH') {
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ message: 'Método não permitido' })
        };
      }
      
      // Extrair ID do produto
      const idInfo = extractAndValidateId(path);
      
      if (!idInfo.isValid) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'ID de produto inválido' })
        };
      }
      
      // Parse do corpo da requisição
      let newAvailability = null;
      try {
        const body = JSON.parse(event.body || '{}');
        if (body.available !== undefined) {
          newAvailability = !!body.available;
        }
      } catch (error) {
        console.error('Erro ao parsear corpo da requisição:', error);
      }
      
      // Alternar disponibilidade
      const result = await toggleProductAvailability(idInfo.id, newAvailability);
      
      if (!result.success) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: result.message })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
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