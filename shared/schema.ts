import { z } from "zod";

// Enum para tipos de usuário
export type UserType = "cliente" | "admin";

// Enum para status de pedidos
export type OrderStatus = "pendente" | "confirmado" | "preparo" | "entrega" | "concluido" | "cancelado";

// Enum para métodos de pagamento
export type PaymentMethod = "pix" | "cartao";

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
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isFeatured: boolean;
  isPromotion: boolean;
  oldPrice?: number;
  categoryId: number;
  available: boolean;
  createdAt: Date;
}

export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  total: number;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Payment {
  id: number;
  orderId: number;
  method: PaymentMethod;
  status: string;
  externalId?: string;
  amount: number;
  createdAt: Date;
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
  id: z.number().optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional()
});

export const productSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  price: z.number().positive("Preço deve ser um valor positivo"),
  imageUrl: z.string().url().optional(),
  isFeatured: z.boolean().default(false),
  isPromotion: z.boolean().default(false),
  oldPrice: z.number().positive().optional(),
  categoryId: z.number().int().positive(),
  available: z.boolean().default(true),
  createdAt: z.date().optional()
});

export const orderSchema = z.object({
  id: z.number().optional(),
  userId: z.number().int().positive(),
  status: z.enum(["pendente", "confirmado", "preparo", "entrega", "concluido", "cancelado"]).default("pendente"),
  total: z.number().positive("Total deve ser um valor positivo"),
  address: z.string().min(5, "Endereço deve ser informado"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const orderItemSchema = z.object({
  id: z.number().optional(),
  orderId: z.number().int().positive(),
  productId: z.number().int().positive(),
  quantity: z.number().int().positive("Quantidade deve ser um valor positivo"),
  price: z.number().positive("Preço deve ser um valor positivo"),
  subtotal: z.number().positive("Subtotal deve ser um valor positivo")
});

export const paymentSchema = z.object({
  id: z.number().optional(),
  orderId: z.number().int().positive(),
  method: z.enum(["pix", "cartao"]),
  status: z.string().default("pendente"),
  externalId: z.string().optional(),
  amount: z.number().positive("Valor deve ser positivo"),
  createdAt: z.date().optional()
});

// Schemas para inserção
export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
export const insertCategorySchema = categorySchema.omit({ id: true });
export const insertProductSchema = productSchema.omit({ id: true, createdAt: true });
export const insertOrderSchema = orderSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = orderItemSchema.omit({ id: true });
export const insertPaymentSchema = paymentSchema.omit({ id: true, createdAt: true });

// Tipos de Inserção
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
