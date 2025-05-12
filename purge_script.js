// Script para remover itens com ID 0 - Execute direto no console do navegador
// COPIE TODO ESSE CÓDIGO E COLE NO CONSOLE DO NAVEGADOR

(async function() {
  // API key do JSONBin.io
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
      console.log(`%cBuscando dados do bin ${binId}...`, "color: blue; font-weight: bold;");
      
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
      console.log(`%cAtualizando bin ${binId} com ${data.length} itens...`, "color: blue; font-weight: bold;");
      
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
      
      console.log('%cBin temporário criado com sucesso!', "color: green;");
      
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
      
      console.log('%cBin original atualizado com sucesso!', "color: green;");
      return true;
    } catch (error) {
      console.error('Erro ao atualizar bin:', error);
      return false;
    }
  }

  // Função para filtrar itens com ID 0
  async function purgeZeroIdItems(binId, binName) {
    try {
      console.log(`\n%c=== PROCESSANDO BIN ${binName.toUpperCase()} (${binId}) ===`, "background: #3498db; color: white; font-size: 14px; padding: 5px;");
      
      // Buscar todos os itens
      const items = await fetchFromBin(binId);
      console.log(`%cTotal de itens no bin ${binName}: ${items.length}`, "color: blue;");
      
      if (!Array.isArray(items)) {
        console.error(`%cERRO: Dados retornados não são um array!`, "color: red; font-weight: bold;");
        return false;
      }
      
      if (items.length === 0) {
        console.log(`%cBin ${binName} está vazio. Nada para limpar.`, "color: gray;");
        return true;
      }
      
      // Imprimir os IDs antes da filtragem
      console.log('%cIDs antes da filtragem:', "color: blue;", items.map(item => item.id));
      
      // Filtrar itens com ID 0 (em qualquer formato)
      const filteredItems = items.filter(item => {
        if (item.id === 0 || item.id === '0' || String(item.id) === '0') {
          console.log(`%cREMOVENDO item com ID zero:`, "color: red; font-weight: bold;", JSON.stringify(item));
          return false;
        }
        return true;
      });
      
      console.log(`%cItens após filtragem: ${filteredItems.length} (removidos: ${items.length - filteredItems.length})`, "color: purple;");
      
      // Se realmente removeu algum item
      if (filteredItems.length < items.length) {
        console.log(`%cAtualizando bin ${binName} sem os itens com ID 0...`, "color: blue;");
        const success = await updateBin(binId, filteredItems);
        
        if (success) {
          console.log(`%cSUCESSO: Bin ${binName} foi limpo, ${items.length - filteredItems.length} item(s) removido(s)`, "color: green; font-weight: bold;");
        } else {
          console.error(`%cFALHA: Não foi possível limpar o bin ${binName}`, "color: red; font-weight: bold;");
        }
        
        return success;
      } else {
        console.log(`%cNenhum item com ID 0 encontrado no bin ${binName}, nada a fazer.`, "color: gray;");
        return true;
      }
    } catch (error) {
      console.error(`%cErro ao limpar bin ${binName}:`, "color: red; font-weight: bold;", error);
      return false;
    }
  }

  // Função principal para executar a limpeza em todos os bins
  async function purgeAllZeroIds() {
    console.log('%c=========================================', "color: #2ecc71; font-weight: bold;");
    console.log('%cINICIANDO LIMPEZA DE TODOS OS ITENS COM ID 0', "background: #2ecc71; color: white; font-size: 16px; padding: 5px;");
    console.log('%c=========================================', "color: #2ecc71; font-weight: bold;");
    
    // Processar cada bin
    const results = {
      products: await purgeZeroIdItems(BINS.products, 'produtos'),
      categories: await purgeZeroIdItems(BINS.categories, 'categorias'),
      featured: await purgeZeroIdItems(BINS.featured, 'destaques'),
      promotions: await purgeZeroIdItems(BINS.promotions, 'promoções')
    };
    
    console.log('\n%c=========================================', "color: #f39c12; font-weight: bold;");
    console.log('%cRESULTADO FINAL DA LIMPEZA:', "background: #f39c12; color: white; font-size: 16px; padding: 5px;");
    console.log('%c=========================================', "color: #f39c12; font-weight: bold;");
    
    let allSuccess = true;
    for (const [bin, success] of Object.entries(results)) {
      console.log(`%c${bin}: ${success ? '✓ LIMPO COM SUCESSO' : '✗ FALHA NA LIMPEZA'}`, 
        success ? "color: green; font-weight: bold;" : "color: red; font-weight: bold;");
      allSuccess = allSuccess && success;
    }
    
    console.log('\n%cStatus final: %c%s', 
      "font-weight: bold;", 
      allSuccess ? "color: green; font-weight: bold;" : "color: red; font-weight: bold;",
      allSuccess ? "TODOS BINS LIMPOS COM SUCESSO ✓✓✓" : "ALGUMAS LIMPEZAS FALHARAM ✗");
    console.log('%c=========================================', "color: #f39c12; font-weight: bold;");
    
    return allSuccess;
  }

  try {
    // Iniciar o processo de limpeza
    alert("INICIANDO A LIMPEZA RADICAL!\n\nVocê verá os resultados no console (F12)");
    const success = await purgeAllZeroIds();
    
    if (success) {
      alert("✅ SUCESSO! Todos os itens com ID 0 foram completamente removidos!\nRecarregue a página para ver os resultados.");
    } else {
      alert("⚠️ Algumas operações de limpeza falharam. Verifique o console para mais detalhes.");
    }
    
    console.log('%cScript de limpeza finalizado!', "background: #2ecc71; color: white; font-size: 16px; padding: 5px;");
  } catch (error) {
    console.error('%cErro fatal durante limpeza:', "color: red; font-weight: bold;", error);
    alert("❌ ERRO! Houve um problema durante a limpeza. Verifique o console para mais detalhes.");
  }
})(); 