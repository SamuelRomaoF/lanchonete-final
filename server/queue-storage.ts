import fs from 'fs';
import path from 'path';

// Definir os tipos diretamente para evitar problemas de importação
export type OrderStatus = 'recebido' | 'em_preparo' | 'pronto' | 'entregue';

export interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface OrderTicket {
  id: string;         // ID único para o pedido
  ticket: string;     // Senha alfanumérica (ex: A01, B05)
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: Date;
  customerId?: string; // Opcional para manter histórico
  customerName?: string; // Nome do cliente, se fornecido
}

// Definir caminhos para armazenamento usando caminhos absolutos
const dataDir = path.resolve(process.cwd(), 'server', 'data');
const QUEUE_FILE = path.resolve(dataDir, 'queue.json');

// Cria o diretório de dados se não existir
function ensureDataDirectory() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Diretório de dados criado em: ${dataDir}`);
  }
}

// Carregar pedidos do arquivo
export function loadQueueData(): {
  orders: OrderTicket[];
  currentPrefix: string;
  currentNumber: number;
} {
  ensureDataDirectory();
  
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      console.log(`Carregando dados da fila do arquivo: ${QUEUE_FILE}`);
      const data = fs.readFileSync(QUEUE_FILE, 'utf-8');
      const parsedData = JSON.parse(data);
      
      // Converte as datas de string para objetos Date
      if (parsedData.orders) {
        parsedData.orders = parsedData.orders.map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt)
        }));
        console.log(`Carregados ${parsedData.orders.length} pedidos do arquivo`);
      }
      
      return parsedData;
    } else {
      console.log(`Arquivo de fila não encontrado: ${QUEUE_FILE}`);
    }
  } catch (error) {
    console.error('Erro ao carregar dados da fila:', error);
  }
  
  // Retorna um objeto vazio em caso de erro ou arquivo não existente
  console.log('Criando estrutura de fila vazia');
  return {
    orders: [],
    currentPrefix: 'A',
    currentNumber: 1
  };
}

// Salvar pedidos no arquivo
export function saveQueueData(data: {
  orders: OrderTicket[];
  currentPrefix: string;
  currentNumber: number;
}): void {
  try {
    // Garantir que o diretório existe
    ensureDataDirectory();
    
    // Verificar se os dados são válidos
    if (!data || !Array.isArray(data.orders)) {
      console.error('Dados inválidos ao salvar fila:', data);
      return;
    }
    
    console.log(`Tentando salvar ${data.orders.length} pedidos no arquivo: ${QUEUE_FILE}`);
    console.log('Caminho absoluto do arquivo:', path.resolve(QUEUE_FILE));
    console.log('Diretório existe?', fs.existsSync(dataDir));
    
    // Formatar os dados como JSON
    const jsonData = JSON.stringify(data, null, 2);
    
    // Garantir permissões de escrita e salvar arquivo
    const dirMode = 0o777; // Permissões totais para todos os usuários
    fs.mkdirSync(dataDir, { recursive: true, mode: dirMode });
    fs.writeFileSync(QUEUE_FILE, jsonData, { mode: 0o666 });
    
    console.log('Dados da fila salvos com sucesso:', jsonData.substring(0, 100) + '...');
  } catch (error) {
    console.error('Erro ao salvar dados da fila:', error);
    console.error('Detalhes do erro:', JSON.stringify(error));
    
    // Tentar salvar em um caminho alternativo
    try {
      const alternativePath = path.join(process.cwd(), 'queue-backup.json');
      console.log(`Tentando salvar em caminho alternativo: ${alternativePath}`);
      fs.writeFileSync(alternativePath, JSON.stringify(data, null, 2));
      console.log('Dados salvos no backup com sucesso');
    } catch (backupError) {
      console.error('Erro ao salvar no backup:', backupError);
    }
  }
}

// Verificar se é um novo dia e resetar a fila se necessário
export function checkAndResetQueueForNewDay(): boolean {
  const queueData = loadQueueData();
  
  // Se não houver pedidos, não precisamos resetar
  if (queueData.orders.length === 0) {
    return false;
  }
  
  // Verificar a data do último pedido
  const lastOrderDate = queueData.orders
    .map(order => new Date(order.createdAt))
    .sort((a, b) => b.getTime() - a.getTime())[0]; // Ordena decrescente e pega o primeiro
    
  if (!lastOrderDate) {
    return false;
  }
  
  const today = new Date();
  const isNewDay = lastOrderDate.getDate() !== today.getDate() ||
                  lastOrderDate.getMonth() !== today.getMonth() ||
                  lastOrderDate.getFullYear() !== today.getFullYear();
  
  // Se for um novo dia, resetar a fila
  if (isNewDay) {
    saveQueueData({
      orders: [],
      currentPrefix: 'A',
      currentNumber: 1
    });
    return true;
  }
  
  return false;
} 