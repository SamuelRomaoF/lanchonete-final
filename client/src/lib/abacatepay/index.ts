/**
 * AbacatePay SDK - Simulação para desenvolvimento
 * Este é um módulo que simula a integração com o AbacatePay
 */

// Tipos para a SDK
export interface PaymentItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePaymentParams {
  amount: number;
  description: string;
  customerName: string;
  items: PaymentItem[];
  expiresIn: number; // segundos
  callbackUrl?: string;
  notificationUrl?: string;
}

export interface Payment {
  id: string;
  amount: number;
  description: string;
  customerName: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  createdAt: Date;
  expiresAt: Date;
  qrCodeUrl: string;
  pixKey: string;
  pixCopiaECola: string;
}

export interface PaymentStatus {
  id: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  paidAt?: Date;
}

// Classe principal do AbacatePay
export class AbacatePay {
  private apiKey: string;
  private merchantId: string;
  private environment: 'production' | 'sandbox';
  
  // Mock de pagamentos para simulação
  private static payments: Record<string, Payment> = {};
  
  constructor(config: {
    apiKey: string;
    merchantId: string;
    environment: 'production' | 'sandbox';
  }) {
    this.apiKey = config.apiKey || 'test_key';
    this.merchantId = config.merchantId || 'test_merchant';
    this.environment = config.environment || 'sandbox';
    
    console.log('AbacatePay SDK inicializado em modo:', this.environment);
  }
  
  /**
   * Criar um novo pagamento
   */
  async createPayment(params: CreatePaymentParams): Promise<Payment> {
    console.log('Criando pagamento AbacatePay:', params);
    
    // Simular requisição à API
    await this.simulateApiDelay();
    
    // Gerar ID único para o pagamento
    const paymentId = `abacate-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Calcular data de expiração
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + params.expiresIn * 1000);
    
    // Criar objeto de pagamento
    const payment: Payment = {
      id: paymentId,
      amount: params.amount,
      description: params.description,
      customerName: params.customerName,
      status: 'PENDING',
      createdAt,
      expiresAt,
      qrCodeUrl: `https://api.abacatepay.com.br/payments/${paymentId}/qrcode`,
      pixKey: '00020126330014BR.GOV.BCB.PIX01111234567890',
      pixCopiaECola: `00020126330014BR.GOV.BCB.PIX01111234567890520489995303986540${params.amount}5802BR5913AbacatePay6008Sao Paulo62090505${paymentId}6304E2CA`
    };
    
    // Armazenar pagamento na memória
    AbacatePay.payments[paymentId] = payment;
    
    // Iniciar temporizador para expiração do pagamento
    this.startExpirationTimer(paymentId, params.expiresIn);
    
    return payment;
  }
  
  /**
   * Obter status do pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    console.log('Verificando status do pagamento:', paymentId);
    
    // Simular requisição à API
    await this.simulateApiDelay();
    
    const payment = AbacatePay.payments[paymentId];
    if (!payment) {
      throw new Error(`Pagamento não encontrado: ${paymentId}`);
    }
    
    return {
      id: payment.id,
      status: payment.status,
      paidAt: payment.status === 'PAID' ? new Date() : undefined
    };
  }
  
  /**
   * Simular aprovação de um pagamento (para testes)
   * Em um ambiente real, isso seria feito pelo servidor quando o pagamento é confirmado
   */
  async simulatePaymentApproval(paymentId: string): Promise<PaymentStatus> {
    console.log('Simulando aprovação do pagamento:', paymentId);
    
    const payment = AbacatePay.payments[paymentId];
    if (!payment) {
      throw new Error(`Pagamento não encontrado: ${paymentId}`);
    }
    
    payment.status = 'PAID';
    
    return {
      id: payment.id,
      status: payment.status,
      paidAt: new Date()
    };
  }
  
  /**
   * Validar assinatura do webhook (simulação)
   */
  validateWebhookSignature(signature: string, payload: string, secret: string): boolean {
    // Em produção, isso faria uma validação criptográfica real
    return true;
  }
  
  /**
   * Métodos privados para simulação
   */
  private startExpirationTimer(paymentId: string, expiresIn: number): void {
    // Em ambiente de sandbox, vamos simular um pagamento bem-sucedido após 10 segundos
    if (this.environment === 'sandbox') {
      setTimeout(() => {
        const payment = AbacatePay.payments[paymentId];
        if (payment && payment.status === 'PENDING') {
          payment.status = 'PAID';
          console.log('Pagamento simulado aprovado:', paymentId);
        }
      }, 10000); // 10 segundos
    }
    
    // Configurar expiração
    setTimeout(() => {
      const payment = AbacatePay.payments[paymentId];
      if (payment && payment.status === 'PENDING') {
        payment.status = 'EXPIRED';
        console.log('Pagamento expirado:', paymentId);
      }
    }, expiresIn * 1000);
  }
  
  private async simulateApiDelay(): Promise<void> {
    // Simular delay de API de 300 a 800ms
    const delay = Math.floor(Math.random() * 500) + 300;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
} 