import fs from 'fs';
import path from 'path';
import { OrderTicket } from './queue-storage';

// Interface para pagamentos
export interface PixPayment {
  orderId: string;
  orderTicket: string;
  customerName?: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  confirmedAt?: Date;
}

// Definir caminhos para armazenamento 
const dataDir = path.resolve(process.cwd(), 'server', 'data');
const PAYMENTS_FILE = path.resolve(dataDir, 'pix-payments.json');

// Cria o diretório de dados se não existir
function ensureDataDirectory() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Diretório de dados criado em: ${dataDir}`);
  }
}

// Carregar pagamentos do arquivo
export function loadPaymentsData(): PixPayment[] {
  ensureDataDirectory();
  
  try {
    if (fs.existsSync(PAYMENTS_FILE)) {
      console.log(`Carregando dados de pagamentos do arquivo: ${PAYMENTS_FILE}`);
      const data = fs.readFileSync(PAYMENTS_FILE, 'utf-8');
      const parsedData = JSON.parse(data);
      
      // Converte as datas de string para objetos Date
      if (Array.isArray(parsedData)) {
        return parsedData.map((payment: any) => ({
          ...payment,
          createdAt: new Date(payment.createdAt),
          confirmedAt: payment.confirmedAt ? new Date(payment.confirmedAt) : undefined
        }));
      }
    } 
  } catch (error) {
    console.error('Erro ao carregar dados de pagamentos:', error);
  }
  
  // Retorna um array vazio em caso de erro ou arquivo não existente
  return [];
}

// Salvar pagamentos no arquivo
export function savePaymentsData(payments: PixPayment[]): void {
  try {
    ensureDataDirectory();
    
    console.log(`Salvando ${payments.length} pagamentos no arquivo: ${PAYMENTS_FILE}`);
    
    // Formatar os dados como JSON
    const jsonData = JSON.stringify(payments, null, 2);
    
    fs.writeFileSync(PAYMENTS_FILE, jsonData);
    
    console.log('Dados de pagamentos salvos com sucesso');
  } catch (error) {
    console.error('Erro ao salvar dados de pagamentos:', error);
  }
}

// Adicionar um novo pagamento pendente
export function addPendingPayment(order: OrderTicket): PixPayment {
  const payments = loadPaymentsData();
  
  // Verificar se o pedido já tem um pagamento
  const existingPayment = payments.find(p => p.orderId === order.id);
  if (existingPayment) {
    return existingPayment;
  }
  
  // Criar novo registro de pagamento
  const newPayment: PixPayment = {
    orderId: order.id,
    orderTicket: order.ticket,
    customerName: order.customerName,
    amount: order.total,
    status: 'pending',
    createdAt: new Date()
  };
  
  // Adicionar à lista e salvar
  payments.push(newPayment);
  savePaymentsData(payments);
  
  return newPayment;
}

// Confirmar um pagamento
export function confirmPayment(orderId: string): PixPayment | null {
  const payments = loadPaymentsData();
  
  // Encontrar o pagamento pelo ID do pedido
  const paymentIndex = payments.findIndex(p => p.orderId === orderId);
  if (paymentIndex === -1) {
    return null;
  }
  
  // Atualizar status e data de confirmação
  payments[paymentIndex].status = 'confirmed';
  payments[paymentIndex].confirmedAt = new Date();
  
  // Salvar alterações
  savePaymentsData(payments);
  
  return payments[paymentIndex];
}

// Cancelar um pagamento
export function cancelPayment(orderId: string): PixPayment | null {
  const payments = loadPaymentsData();
  
  // Encontrar o pagamento pelo ID do pedido
  const paymentIndex = payments.findIndex(p => p.orderId === orderId);
  if (paymentIndex === -1) {
    return null;
  }
  
  // Atualizar status
  payments[paymentIndex].status = 'cancelled';
  
  // Salvar alterações
  savePaymentsData(payments);
  
  return payments[paymentIndex];
}

// Obter pagamentos pendentes
export function getPendingPayments(): PixPayment[] {
  const payments = loadPaymentsData();
  return payments.filter(p => p.status === 'pending');
}

// Obter pagamentos confirmados
export function getConfirmedPayments(): PixPayment[] {
  const payments = loadPaymentsData();
  return payments.filter(p => p.status === 'confirmed');
}

// Obter pagamento por ID do pedido
export function getPaymentByOrderId(orderId: string): PixPayment | undefined {
  const payments = loadPaymentsData();
  return payments.find(p => p.orderId === orderId);
} 