import { z } from "zod";

// Enum para tipos de usuário
export type UserType = "cliente" | "admin";

// Enum para status de pedidos
export type OrderStatus = "recebido" | "em_preparo" | "pronto" | "entregue" | "cancelado";

// Enum para métodos de pagamento
export type PaymentMethod = "pix" | "cartao" | "dinheiro";

// Enum para status de pagamento
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

// Tipos de usuário
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  password: z.string().optional(),
  type: z.enum(["cliente", "admin"]).default("cliente"),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export type User = z.infer<typeof userSchema>;
export type UserProfile = Omit<User, "password">;
export type InsertUser = Omit<User, "id" | "created_at" | "updated_at" | "createdAt" | "updatedAt">;

// Tipos de categoria
export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export type Category = z.infer<typeof categorySchema>;
export const insertCategorySchema = categorySchema.omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;

// Tipos de produto
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().default(""),
  price: z.number(),
  imageUrl: z.string().optional().default(""),
  categoryId: z.string(),
  available: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isPromotion: z.boolean().default(false),
  oldPrice: z.number().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export type Product = z.infer<typeof productSchema>;
export const insertProductSchema = productSchema.omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Tipos de item do pedido
export const orderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().default(1),
  notes: z.string().optional().default("")
});

export type OrderItem = z.infer<typeof orderItemSchema>;
export const insertOrderItemSchema = orderItemSchema.omit({ id: true });
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// Tipos de pedido
export const orderSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  status: z.enum(["recebido", "em_preparo", "pronto", "entregue", "cancelado"]).default("recebido"),
  items: z.array(orderItemSchema),
  totalAmount: z.number(),
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional().default(""),
    address: z.string().optional().default("")
  }),
  userId: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  paymentMethod: z.enum(["pix", "cartao", "dinheiro"]).default("pix"),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).default("pending"),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  paymentDetails: z.record(z.any()).optional().default({})
});

export type Order = z.infer<typeof orderSchema>;
export const insertOrderSchema = orderSchema.omit({ id: true, ticketNumber: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Tipos de pagamento
export const paymentSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "paid", "failed", "refunded"]).default("pending"),
  method: z.enum(["pix", "cartao", "dinheiro"]).default("pix"),
  amount: z.number(),
  orderId: z.string(),
  transactionId: z.string().optional(),
  paymentDetails: z.record(z.any()).optional().default({}),
  createdAt: z.string().datetime().optional()
});

export type Payment = z.infer<typeof paymentSchema>;

// Tipos de resposta da API
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
  orders: z.array(orderSchema).optional()
});

export type ApiResponse = z.infer<typeof apiResponseSchema>;
