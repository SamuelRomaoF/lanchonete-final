import axios from 'axios';
import dotenv from 'dotenv';
import { OrderTicket } from './queue-storage';

// Carregar variáveis de ambiente
dotenv.config();

// Configurações da API do WhatsApp Business
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || '';

// Interface para recipientes de mensagens
interface WhatsAppRecipient {
  phoneNumber: string;
  name?: string;
}

// Configurações de notificação
const config = {
  // Administradores que receberão notificações de novos pedidos
  adminRecipients: [] as WhatsAppRecipient[],
  
  // Template para mensagem de novo pedido
  orderTemplate: (order: OrderTicket): string => {
    const items = order.items.map(item => 
      `- ${item.quantity}x ${item.name}: ${formatCurrency(item.price * item.quantity)}`
    ).join('\n');
    
    return `🛎️ *Novo Pedido #${order.ticket}*\n\n` +
      `*Cliente:* ${order.customerName || 'Cliente não identificado'}\n` +
      `*Data:* ${formatDatetime(order.createdAt)}\n\n` +
      `*Itens:*\n${items}\n\n` +
      `*Total:* ${formatCurrency(order.total)}\n\n` +
      `Para atualizar o status deste pedido, acesse o painel administrativo.`;
  },
  
  // Template para mensagem de atualização de status
  statusUpdateTemplate: (order: OrderTicket): string => {
    const statusMap: Record<string, string> = {
      'recebido': '✅ Recebido',
      'em_preparo': '👨‍🍳 Em Preparo',
      'pronto': '🔔 Pronto para Retirada',
      'entregue': '🎉 Entregue'
    };
    
    return `🔄 *Atualização do Pedido #${order.ticket}*\n\n` +
      `*Status:* ${statusMap[order.status] || order.status}\n` +
      `*Atualizado em:* ${formatDatetime(new Date())}\n\n` +
      `Seu pedido ${getStatusMessage(order.status)}`;
  },
  
  // Formato para mensagem de cliente
  customerConfirmationTemplate: (order: OrderTicket): string => {
    return `🍔 *Pedido Confirmado #${order.ticket}*\n\n` +
      `Obrigado pelo seu pedido! Acompanhe o status pelo código: *${order.ticket}*\n\n` +
      `*Resumo do Pedido:*\n` +
      order.items.map(item => `- ${item.quantity}x ${item.name}`).join('\n') + 
      `\n\n*Total:* ${formatCurrency(order.total)}\n\n` +
      `Avisaremos quando estiver pronto!`;
  }
};

// Funções auxiliares
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
}

function formatDatetime(date: Date): string {
  return date.toLocaleString('pt-BR', { 
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'recebido':
      return 'foi recebido e está na fila de preparo.';
    case 'em_preparo':
      return 'está sendo preparado.';
    case 'pronto':
      return 'está pronto para retirada!';
    case 'entregue':
      return 'foi entregue. Bom apetite!';
    default:
      return 'foi atualizado.';
  }
}

// Função para enviar mensagem via WhatsApp
async function sendWhatsAppMessage(
  to: string, 
  message: string
): Promise<boolean> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.error('Configurações do WhatsApp não encontradas nas variáveis de ambiente');
    return false;
  }

  try {
    const response = await axios({
      method: 'POST',
      url: `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      }
    });

    console.log('Mensagem WhatsApp enviada com sucesso:', response.data);
    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    return false;
  }
}

// Função para adicionar administrador que receberá notificações
export function addAdminRecipient(phoneNumber: string, name?: string): void {
  // Formatar número do telefone (remover caracteres não numéricos)
  const formattedNumber = phoneNumber.replace(/\D/g, '');
  
  if (!formattedNumber.startsWith('55')) {
    // Adicionar código do país (Brasil) se não estiver presente
    config.adminRecipients.push({
      phoneNumber: `55${formattedNumber}`,
      name
    });
  } else {
    config.adminRecipients.push({
      phoneNumber: formattedNumber,
      name
    });
  }
}

// Inicialização: Adicionar números de telefone dos administradores
const adminPhones = process.env.ADMIN_PHONE_NUMBERS?.split(',') || [];
adminPhones.forEach(phone => {
  addAdminRecipient(phone.trim());
});

// Função para notificar administradores sobre novo pedido
export async function notifyAdminsAboutNewOrder(order: OrderTicket): Promise<void> {
  const message = config.orderTemplate(order);
  
  // Enviar para todos os administradores cadastrados
  for (const admin of config.adminRecipients) {
    await sendWhatsAppMessage(admin.phoneNumber, message);
  }
}

// Notificar cliente sobre confirmação do pedido
export async function notifyCustomerAboutOrder(
  order: OrderTicket, 
  customerPhone: string
): Promise<boolean> {
  const message = config.customerConfirmationTemplate(order);
  
  // Formatar número do telefone
  const formattedPhone = customerPhone.replace(/\D/g, '');
  const phoneToUse = formattedPhone.startsWith('55') 
    ? formattedPhone 
    : `55${formattedPhone}`;
  
  return await sendWhatsAppMessage(phoneToUse, message);
}

// Notificar cliente sobre atualização de status
export async function notifyCustomerAboutStatusUpdate(
  order: OrderTicket,
  customerPhone: string
): Promise<boolean> {
  const message = config.statusUpdateTemplate(order);
  
  // Formatar número do telefone
  const formattedPhone = customerPhone.replace(/\D/g, '');
  const phoneToUse = formattedPhone.startsWith('55') 
    ? formattedPhone 
    : `55${formattedPhone}`;
  
  return await sendWhatsAppMessage(phoneToUse, message);
}

// Webhook para receber mensagens do WhatsApp
export async function processWhatsAppWebhook(
  data: any
): Promise<{ success: boolean, orderId?: string }> {
  try {
    // Verificar se é uma mensagem válida
    if (!data.entry || !data.entry[0]?.changes || !data.entry[0]?.changes[0]?.value?.messages) {
      return { success: false };
    }

    const messages = data.entry[0].changes[0].value.messages;
    
    // Processar apenas a primeira mensagem
    if (messages && messages.length > 0) {
      const message = messages[0];
      const from = message.from; // Número do remetente
      const text = message.text?.body;

      console.log(`Mensagem recebida de ${from}: ${text}`);
      
      // Aqui poderia ter um parser para extrair dados de pedidos
      // Por enquanto apenas retornamos sucesso
      return { 
        success: true,
        // Se implementar extração de pedidos, retornaria o ID do pedido criado
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Erro ao processar webhook do WhatsApp:', error);
    return { success: false };
  }
}

// Exportar o módulo
export default {
  notifyAdminsAboutNewOrder,
  notifyCustomerAboutOrder,
  notifyCustomerAboutStatusUpdate,
  processWhatsAppWebhook,
  addAdminRecipient
}; 