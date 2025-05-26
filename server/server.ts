import cors from 'cors';
import express from 'express';
import { createServer } from 'net';
import { supabase } from './supabase';

const app = express();
let currentPort = 3001;

// Função para verificar se uma porta está disponível
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// Função para encontrar a próxima porta disponível
async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    console.log(`Porta ${port} está em uso, tentando próxima...`);
    port++;
  }
  return port;
}

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.get('/api/products/featured', async (req, res) => {
  try {
    console.log('Tentando buscar produtos em destaque...');

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .eq('available', true)
      .order('name');

    if (error) {
      console.error('Erro ao buscar produtos em destaque:', error);
      throw error;
    }

    console.log('Produtos em destaque encontrados:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar produtos em destaque:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos em destaque' });
  }
});

app.get('/api/products/promotions', async (req, res) => {
  try {
    console.log('Tentando buscar produtos em promoção...');

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_promotion', true)
      .eq('available', true)
      .order('name');

    if (error) {
      console.error('Erro ao buscar produtos em promoção:', error);
      throw error;
    }

    console.log('Produtos em promoção encontrados:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar produtos em promoção:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos em promoção' });
  }
});

// Iniciar o servidor
(async () => {
  const port = await findAvailablePort(currentPort);
  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
})(); 