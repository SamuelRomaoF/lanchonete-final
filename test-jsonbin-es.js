// Teste de conexão com JSONBin.io usando HTTP request nativo do Node (versão ES6)
import https from 'https';

const JSONBIN_API_KEY = '$2a$10$x1g/gJkm9BCXgqeOEyIF1exCgqGeelU6NbZBMYN0eAbXmfpDH74.y';

function testConnection() {
  console.log('Testando conexão com JSONBin.io...');
  
  const options = {
    hostname: 'api.jsonbin.io',
    path: '/v3/c', // Testar apenas a conexão geral ao invés de um bin específico
    method: 'GET',
    headers: {
      'X-Master-Key': JSONBIN_API_KEY
    }
  };

  const req = https.request(options, (res) => {
    console.log('Status da resposta:', res.statusCode);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode !== 200) {
        console.error('Erro ao conectar ao JSONBin:', data);
        return;
      }
      
      try {
        const jsonData = JSON.parse(data);
        console.log('Conexão bem-sucedida! Dados recebidos:');
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.error('Erro ao parsear JSON:', e);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Erro ao conectar com JSONBin.io:', error);
  });
  
  req.end();
}

// Executa o teste
testConnection(); 