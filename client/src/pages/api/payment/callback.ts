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
    // Extrair parâmetros de consulta (normalmente o ID do pagamento)
    const { id, status } = req.query;
  
    console.log('Callback recebido:', { id, status });
    
    if (status === 'success') {
      // Redirecionar para a página de sucesso
      res.redirect(307, `/pedidos?payment_success=true`);
    } else {
      // Redirecionar para a página de falha
      res.redirect(307, `/checkout?payment_failed=true`);
    }
  } catch (error) {
    console.error('Erro ao processar callback:', error);
    res.redirect(307, `/checkout?error=true`);
  }
} 