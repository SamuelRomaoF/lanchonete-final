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
  type: z.enum(["cliente", "admin"]),
  address: z.string().optional(),
  phone: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(), // Alias para created_at
  updatedAt: z.string().datetime().optional() // Alias para updated_at
});

export type User = z.infer<typeof userSchema>;
export type UserProfile = Omit<User, "password">;
export type InsertUser = Omit<User, "id" | "created_at" | "updated_at" | "createdAt" | "updatedAt">;

// Tipos de categoria
export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(), // Alias para created_at
  updatedAt: z.string().datetime().optional() // Alias para updated_at
});

export type Category = z.infer<typeof categorySchema>;
export const insertCategorySchema = categorySchema.omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;

// Tipos de produto
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  imageUrl: z.string().optional(),
  categoryId: z.string(),
  available: z.boolean(),
  isFeatured: z.boolean(),
  isPromotion: z.boolean(),
  oldPrice: z.number().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(), // Alias para created_at
  updatedAt: z.string().datetime().optional() // Alias para updated_at
});

export type Product = z.infer<typeof productSchema>;
export const insertProductSchema = productSchema.omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Tipos de item do pedido
export const orderItemSchema = z.object({
  id: z.string().optional(),
  orderId: z.string().optional(),
  productId: z.string().optional(),
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
  id: z.string().optional(),
  method: z.enum(["pix", "cartao", "dinheiro"]),
  status: z.enum(["pending", "paid", "failed", "refunded"]),
  amount: z.number(),
  orderId: z.string(),
  transactionId: z.string().optional(),
  paymentDetails: z.record(z.any()).optional()
});

export type Payment = z.infer<typeof paymentSchema>;
export const insertPaymentSchema = paymentSchema.omit({ id: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Tipos de pedido
export const orderSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  status: z.enum(["recebido", "em_preparo", "pronto", "entregue", "cancelado"]),
  items: z.array(orderItemSchema),
  totalAmount: z.number(),
  total: z.number().optional(), // Alias para totalAmount
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional()
  }),
  userId: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["pix", "cartao", "dinheiro"]),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(), // Alias para created_at
  updatedAt: z.string().datetime().optional(), // Alias para updated_at
  paymentDetails: z.record(z.any()).optional()
});

export type Order = z.infer<typeof orderSchema>;
export const insertOrderSchema = orderSchema.omit({ id: true, ticketNumber: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Tipos de resposta da API
export const apiResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
  orders: z.array(orderSchema).optional()
});

export type ApiResponse = z.infer<typeof apiResponseSchema>;
