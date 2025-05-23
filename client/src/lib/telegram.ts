/**
 * Serviço para enviar notificações para o bot do Telegram
 */

// Variáveis que você precisará configurar no seu arquivo .env ou no Netlify
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderNotification {
  ticketNumber: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: Date | string;
}

/**
 * Envia uma notificação de novo pedido para o Telegram
 */
export async function sendOrderNotification(order: OrderNotification): Promise<boolean> {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Configuração do Telegram incompleta. Verifique as variáveis de ambiente.');
      return false;
    }
    
    // Formatar a mensagem com Markdown
    const itemsList = order.items
      .map(item => `• ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`)
      .join('\n');
      
    const message = `
🔔 *NOVO PEDIDO* 🔔
───────────────
*Ticket:* #${order.ticketNumber}
*Cliente:* ${order.customerName}

*ITENS:*
${itemsList}

*Total:* R$ ${order.totalAmount.toFixed(2)}
───────────────
📅 ${new Date(order.createdAt).toLocaleString('pt-BR')}
    `;
    
    // Enviar mensagem para o Telegram
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    
    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error('Erro ao enviar notificação para o Telegram:', error);
    return false;
  }
} 