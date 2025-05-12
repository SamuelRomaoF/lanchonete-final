// Script standalone para excluir completamente todos os itens com ID 0
const fetch = require('node-fetch');

// API key do JSONBin.io (a mesma usada no arquivo api.js)
const JSONBIN_API_KEY = '$2a$10$x1g/gJkm9BCXgqeOEyIF1exCgqGeelU6NbZBMYN0eAbXmfpDH74.y';

// IDs dos bins 
const BINS = {
  categories: '682162cf8561e97a5012185b', 
  products: '682162fc8960c979a597b1f3',
  featured: '682162fe8960c979a597b1f7',
  promotions: '682163018561e97a50121874'
};

// Função para buscar dados do bin
async function fetchFromBin(binId) {
  try {
    console.log(`Buscando dados do bin ${binId}...`);
    
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': JSONBIN_API_KEY
      }
    });
    
    if (!response.ok) {
      console.error(`Erro ao buscar dados (status ${response.status}):`, await response.text());
      return [];
    }
    
    const data = await response.json();
    return data.record || [];
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    return [];
  }
}

// Função para atualizar o bin com os dados filtrados
async function updateBin(binId, data) {
  try {
    console.log(`Atualizando bin ${binId} com ${data.length} itens...`);
    
    // Primeiro criar um bin temporário completamente novo
    const createResponse = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY,
        'X-Bin-Private': 'false',
        'X-Bin-Name': `clean_${Date.now()}`
      },
      body: JSON.stringify(data)
    });
    
    if (!createResponse.ok) {
      console.error('Erro ao criar bin temporário:', await createResponse.text());
      return false;
    }
    
    console.log('Bin temporário criado com sucesso!');
    
    // Agora atualizar o bin original com os dados filtrados
    const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY,
        'X-Bin-Versioning': 'false'
      },
      body: JSON.stringify(data)
    });
    
    if (!updateResponse.ok) {
      console.error(`Erro ao atualizar bin original (status ${updateResponse.status}):`, await updateResponse.text());
      return false;
    }
    
    console.log('Bin original atualizado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao atualizar bin:', error);
    return false;
  }
}

// Função para filtrar itens com ID 0
async function purgeZeroIdItems(binId, binName) {
  try {
    console.log(`\n=== PROCESSANDO BIN ${binName.toUpperCase()} (${binId}) ===`);
    
    // Buscar todos os itens
    const items = await fetchFromBin(binId);
    console.log(`Total de itens no bin ${binName}: ${items.length}`);
    
    if (!Array.isArray(items)) {
      console.error(`ERRO: Dados retornados não são um array!`);
      return false;
    }
    
    if (items.length === 0) {
      console.log(`Bin ${binName} está vazio. Nada para limpar.`);
      return true;
    }
    
    // Imprimir os IDs antes da filtragem
    console.log('IDs antes da filtragem:', items.map(item => item.id));
    
    // Filtrar itens com ID 0 (em qualquer formato)
    const filteredItems = items.filter(item => {
      if (item.id === 0 || item.id === '0' || String(item.id) === '0') {
        console.log(`REMOVENDO item com ID zero:`, JSON.stringify(item));
        return false;
      }
      return true;
    });
    
    console.log(`Itens após filtragem: ${filteredItems.length} (removidos: ${items.length - filteredItems.length})`);
    
    // Se realmente removeu algum item
    if (filteredItems.length < items.length) {
      console.log(`Atualizando bin ${binName} sem os itens com ID 0...`);
      const success = await updateBin(binId, filteredItems);
      
      if (success) {
        console.log(`SUCESSO: Bin ${binName} foi limpo, ${items.length - filteredItems.length} item(s) removido(s)`);
      } else {
        console.error(`FALHA: Não foi possível limpar o bin ${binName}`);
      }
      
      return success;
    } else {
      console.log(`Nenhum item com ID 0 encontrado no bin ${binName}, nada a fazer.`);
      return true;
    }
  } catch (error) {
    console.error(`Erro ao limpar bin ${binName}:`, error);
    return false;
  }
}

// Função principal para executar a limpeza em todos os bins
async function purgeAllZeroIds() {
  console.log('=========================================');
  console.log('INICIANDO LIMPEZA DE TODOS OS ITENS COM ID 0');
  console.log('=========================================\n');
  
  // Processar cada bin
  const results = {
    products: await purgeZeroIdItems(BINS.products, 'produtos'),
    categories: await purgeZeroIdItems(BINS.categories, 'categorias'),
    featured: await purgeZeroIdItems(BINS.featured, 'destaques'),
    promotions: await purgeZeroIdItems(BINS.promotions, 'promoções')
  };
  
  console.log('\n=========================================');
  console.log('RESULTADO FINAL DA LIMPEZA:');
  console.log('=========================================');
  
  let allSuccess = true;
  for (const [bin, success] of Object.entries(results)) {
    console.log(`${bin}: ${success ? 'LIMPO COM SUCESSO ✓' : 'FALHA NA LIMPEZA ✗'}`);
    allSuccess = allSuccess && success;
  }
  
  console.log('\nStatus final:', allSuccess ? 'TODOS BINS LIMPOS COM SUCESSO ✓✓✓' : 'ALGUMAS LIMPEZAS FALHARAM ✗');
  console.log('=========================================');
}

// Executar a limpeza
purgeAllZeroIds().then(() => {
  console.log('Script de limpeza finalizado!');
}).catch(error => {
  console.error('Erro fatal durante limpeza:', error);
}); 