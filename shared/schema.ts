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

// Schemas de validação com Zod
export const userSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  address: z.string().optional(),
  phone: z.string().optional(),
  type: z.enum(["cliente", "admin"]).default("cliente"),
  createdAt: z.date().optional()
});

export const categorySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional()
});

export const productSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  price: z.number().positive("Preço deve ser um valor positivo"),
  imageUrl: z.string().url().optional(),
  isFeatured: z.boolean().default(false),
  isPromotion: z.boolean().default(false),
  oldPrice: z.number().positive().optional(),
  categoryId: z.union([z.string(), z.number()]),
  available: z.boolean().default(true),
  createdAt: z.date().optional()
});

export const orderItemSchema = z.object({
  id: z.number().optional(),
  productId: z.number().optional(),
  name: z.string(),
  quantity: z.number().int().positive("Quantidade deve ser um valor positivo"),
  price: z.number().positive("Preço deve ser um valor positivo"),
  notes: z.string().optional()
});

export const customerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  address: z.string().optional()
});

export const paymentDetailsSchema = z.object({
  paidAt: z.string().optional(),
  transactionId: z.string().optional(),
  pixKey: z.string().optional(),
  qrCodeData: z.string().optional(),
  changeAmount: z.number().optional()
});

export const orderSchema = z.object({
  id: z.number().optional(),
  ticketNumber: z.string().optional(),
  items: z.array(orderItemSchema),
  customer: customerSchema,
  totalAmount: z.number().positive("Total deve ser um valor positivo"),
  status: z.enum(["recebido", "em_preparo", "pronto", "entregue", "cancelado"]).default("recebido"),
  paymentMethod: z.enum(["pix", "cartao", "dinheiro"]),
  paymentStatus: z.enum(["pending", "paid", "cancelled"]).default("pending"),
  paymentDetails: paymentDetailsSchema.optional(),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

// Schemas para inserção
export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
export const insertCategorySchema = categorySchema.omit({ id: true });
export const insertProductSchema = productSchema.omit({ id: true, createdAt: true });
export const insertOrderSchema = orderSchema.omit({ id: true, created_at: true, updated_at: true });

// Tipos de Inserção
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
