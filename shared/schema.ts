import { z } from "zod";

// Enum para tipos de usuário
export type UserType = "cliente" | "admin";

// Enum para status de pedidos
export type OrderStatus = "recebido" | "em_preparo" | "pronto" | "entregue" | "cancelado";

// Enum para métodos de pagamento
export type PaymentMethod = "pix" | "cartao" | "dinheiro";

// Enum para status de pagamento
export type PaymentStatus = "pending" | "paid" | "cancelled";

// Tipos de entidades
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  address?: string;
  phone?: string;
  type: UserType;
  createdAt: Date;
}

export interface Category {
  id: string | number;  // Aceita tanto string (formato do Supabase) quanto number
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface Product {
  id: string | number;  // Aceita tanto string (formato do Supabase) quanto number
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isFeatured: boolean;
  isPromotion: boolean;
  oldPrice?: number;
  categoryId: string | number;  // Aceita tanto string (formato do Supabase) quanto number
  available: boolean;
  createdAt?: Date;
}

// Item de pedido
export interface OrderItem {
  id?: number;
  productId?: number;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

// Cliente do pedido
export interface Customer {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Detalhes de pagamento
export interface PaymentDetails {
  paidAt?: string;
  transactionId?: string;
  pixKey?: string;
  qrCodeData?: string;
  changeAmount?: number;
}

// Pedido
export interface Order {
  id: number;
  ticketNumber?: string;
  items: OrderItem[];
  customer: Customer;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails?: PaymentDetails;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// Tipos de usuário
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  type: z.enum(['admin', 'customer']),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export type User = z.infer<typeof userSchema>;
export type UserProfile = Omit<User, 'password'>;

// Tipos de categoria
export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export type Category = z.infer<typeof categorySchema>;
export const insertCategorySchema = categorySchema.omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;

// Tipos de produto
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  imageUrl: z.string(),
  categoryId: z.string(),
  available: z.boolean(),
  isFeatured: z.boolean(),
  isPromotion: z.boolean(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export type Product = z.infer<typeof productSchema>;
export const insertProductSchema = productSchema.omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Tipos de item do pedido
export const orderItemSchema = z.object({
  id: z.number().optional(),
  productId: z.number().optional(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  notes: z.string().optional()
});

export type OrderItem = z.infer<typeof orderItemSchema>;
export const insertOrderItemSchema = orderItemSchema.omit({ id: true });
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// Tipos de pagamento
export const paymentSchema = z.object({
  method: z.enum(['pix', 'credit_card', 'debit_card', 'cash']),
  status: z.enum(['pending', 'paid', 'failed', 'refunded']),
  amount: z.number(),
  transactionId: z.string().optional(),
  paymentDetails: z.record(z.any()).optional()
});

export type Payment = z.infer<typeof paymentSchema>;
export const insertPaymentSchema = paymentSchema;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Tipos de pedido
export const orderSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  status: z.enum(['recebido', 'em_preparo', 'pronto', 'entregue', 'cancelado']),
  items: z.array(orderItemSchema),
  totalAmount: z.number(),
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional()
  }),
  paymentMethod: z.enum(['pix', 'credit_card', 'debit_card', 'cash']),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  paymentDetails: z.record(z.any()).optional()
});

export type Order = z.infer<typeof orderSchema>;
export const insertOrderSchema = orderSchema.omit({ id: true, ticketNumber: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Tipos de resposta da API
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional()
});

export type ApiResponse = z.infer<typeof apiResponseSchema>;
