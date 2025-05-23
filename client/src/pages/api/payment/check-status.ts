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
  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID de pagamento não fornecido' });
    }
    
    // Obter informações do pagamento utilizando a API do AbacatePay
    const billings = await abacatePay.billing.list();
    
    // Encontrar o pagamento específico pelo ID
    const payment = billings.data?.find((bill: any) => bill.id === id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }
    
    // Retornar o status do pagamento
    return res.status(200).json({
      id: payment.id,
      status: payment.status,
    });
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    return res.status(500).json({ error: 'Erro ao verificar status do pagamento' });
  }
} 