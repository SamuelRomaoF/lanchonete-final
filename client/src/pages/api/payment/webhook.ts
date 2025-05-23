import AbacatePay from 'abacatepay-nodejs-sdk';
import type { Request, Response } from 'express';

// Inicializar o cliente do AbacatePay com valores padrão para desenvolvimento
const API_KEY = (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_ABACATEPAY_API_KEY) 
  ? import.meta.env.VITE_ABACATEPAY_API_KEY 
  : 'test_api_key';

const abacatePay = AbacatePay(API_KEY);

export default async function handler(
  req: Request,
  res: Response
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Obter o payload do webhook
    const webhookData = req.body;
    console.log('Webhook recebido:', JSON.stringify(webhookData, null, 2));

    // Verificar o tipo de evento
    if (webhookData.event === 'billing.paid') {
      // Processar o pagamento aprovado
      const billingId = webhookData.data.id;
      
      console.log(`Pagamento ${billingId} confirmado!`);
      
      // Aqui você pode adicionar a lógica para atualizar seu banco de dados
      // ou realizar outras ações necessárias quando um pagamento é confirmado
      
      // Exemplo: atualizar o status do pedido no banco de dados
      // await db.updateOrderStatus(billingId, 'paid');
      
      return res.status(200).json({ success: true });
    } else if (webhookData.event === 'billing.expired') {
      // Processar o pagamento expirado
      const billingId = webhookData.data.id;
      
      console.log(`Pagamento ${billingId} expirado!`);
      
      // Aqui você pode adicionar a lógica para lidar com pagamentos expirados
      
      return res.status(200).json({ success: true });
    }

    // Para outros tipos de eventos, apenas confirmar o recebimento
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
} 