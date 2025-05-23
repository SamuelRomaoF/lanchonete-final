export type OrderStatus = 'recebido' | 'em_preparo' | 'pronto' | 'entregue';

export interface OrderItem {
  id: string;
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