// Script para criar os bins necessários no JSONBin.io
const https = require('https');

const JSONBIN_API_KEY = '$2a$10$x1g/gJkm9BCXgqeOEyIF1exCgqGeelU6NbZBMYN0eAbXmfpDH74.y';
const binsToCreate = [
  { name: 'categories', initialData: [] },
  { name: 'products', initialData: [] },
  { name: 'featured', initialData: [] },
  { name: 'promotions', initialData: [] }
];

function createBin(name, data) {
  return new Promise((resolve, reject) => {
    console.log(`Criando bin para ${name}...`);
    
    const requestData = JSON.stringify(data);
    
    const options = {
      hostname: 'api.jsonbin.io',
      path: '/v3/b',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY,
        'X-Bin-Name': name
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const jsonData = JSON.parse(responseData);
            console.log(`Bin "${name}" criado com sucesso! ID: ${jsonData.metadata.id}`);
            resolve({
              name,
              id: jsonData.metadata.id
            });
          } catch (e) {
            console.error(`Erro ao parsear resposta para "${name}":`, e);
            reject(e);
          }
        } else {
          console.error(`Erro ao criar bin "${name}":`, responseData);
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Erro na requisição para criar "${name}":`, error);
      reject(error);
    });
    
    req.write(requestData);
    req.end();
  });
}

async function createAllBins() {
  console.log('Iniciando criação dos bins...');
  
  const results = {};
  
  for (const bin of binsToCreate) {
    try {
      const result = await createBin(bin.name, bin.initialData);
      results[bin.name] = result.id;
    } catch (error) {
      console.error(`Falha ao criar bin "${bin.name}":`, error.message);
    }
  }
  
  console.log('\n=== RESUMO DOS BINS CRIADOS ===');
  console.log('Copie e cole estas constantes no arquivo netlify/functions/api.js:');
  console.log(`const BINS = {`);
  for (const [name, id] of Object.entries(results)) {
    console.log(`  ${name}: '${id}',`);
  }
  console.log(`};`);
}

createAllBins().catch(err => {
  console.error('Erro ao criar bins:', err);
}); 