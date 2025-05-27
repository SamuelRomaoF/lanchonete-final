import { z } from "zod";

// Enum para tipos de usuário
export type UserType = "cliente" | "admin";

// Enum para status de pedidos
export type OrderStatus = "pending" | "recebido" | "em_preparo" | "pronto" | "entregue" | "cancelado";

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
  created_at: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  old_price?: number;
  category_id?: string;
  available: boolean;
  is_featured: boolean;
  is_promotion: boolean;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Item de pedido
export interface OrderItem {
  id: number;
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
  id: string;
  customer_name: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  ticket_number: string;
  created_at: string;
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
  created_at: z.date().optional()
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  price: z.number().positive("Preço deve ser um valor positivo"),
  old_price: z.number().positive().optional(),
  category_id: z.string(),
  available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_promotion: z.boolean().default(false),
  image_url: z.string().url().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

export const orderItemSchema = z.object({
  id: z.number(),
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
  id: z.string().optional(),
  customer_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  items: z.array(orderItemSchema),
  total_amount: z.number().positive("Total deve ser um valor positivo"),
  status: z.enum(["pending", "recebido", "em_preparo", "pronto", "entregue", "cancelado"]).default("pending"),
  ticket_number: z.string(),
  created_at: z.string().optional()
});

// Schemas para inserção
export const insertUserSchema = userSchema.omit({ id: true, created_at: true });
export const insertCategorySchema = categorySchema.omit({ id: true, created_at: true, updated_at: true });
export const insertProductSchema = productSchema.omit({ id: true, created_at: true, updated_at: true });
export const insertOrderSchema = orderSchema.omit({ id: true, created_at: true });

// Tipos de Inserção
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
