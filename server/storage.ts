import {
    type Category, type InsertCategory,
    type InsertOrder,
    type InsertPayment,
    type InsertProduct,
    type InsertUser,
    type Order,
    type OrderItem,
    type OrderStatus,
    type Payment,
    type PaymentMethod,
    type PaymentStatus,
    type Product,
    type User
} from "@shared/schema";
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';

// Interface de armazenamento
export interface IStorage {
  // Usuários
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Categorias
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Produtos
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getPromotionProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Pedidos
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getOrderWithItems(id: string): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order | undefined>;
  
  // Pagamentos
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByOrder(orderId: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: string, status: PaymentStatus): Promise<Payment | undefined>;
  
  // Dashboard
  getDashboardStats(): Promise<{
    totalOrders: number;
    totalSales: number;
    pendingOrders: number;
    productCount: number;
  }>;
}

// Função para converter tipos de dados
function convertOrder(order: any): Order {
  return {
    id: String(order.id || crypto.randomUUID()),
    ticketNumber: order.ticketNumber || `T${Date.now().toString().slice(-6)}`,
    status: (order.status || 'recebido') as OrderStatus,
    items: Array.isArray(order.items) ? order.items.map((item: any) => ({
      id: String(item.id || crypto.randomUUID()),
      name: item.name,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1),
      notes: item.notes
    })) : [],
    totalAmount: Number(order.totalAmount || order.total || 0),
    customer: {
      name: order.customer?.name || 'Cliente',
      email: order.customer?.email || 'cliente@example.com',
      phone: order.customer?.phone,
      address: order.customer?.address
    },
    paymentMethod: (order.paymentMethod || 'pix') as PaymentMethod,
    paymentStatus: (order.paymentStatus || 'pending') as PaymentStatus,
    created_at: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(),
    updated_at: order.updated_at ? new Date(order.updated_at).toISOString() : undefined,
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : undefined,
    updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : undefined,
    notes: order.notes,
    userId: order.userId,
    paymentDetails: order.paymentDetails
  };
}

// Implementação em memória
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<string, Category>;
  private products: Map<string, Product>;
  private orders: Map<string, Order>;
  private orderItems: Map<string, OrderItem>;
  private payments: Map<string, Payment>;
  
  private currentUserId: string;
  private currentCategoryId: string;
  private currentProductId: string;
  private currentOrderId: string;
  private currentOrderItemId: string;
  private currentPaymentId: string;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.payments = new Map();
    
    this.currentUserId = "1";
    this.currentCategoryId = "1";
    this.currentProductId = "1";
    this.currentOrderId = "1";
    this.currentOrderItemId = "1";
    this.currentPaymentId = "1";
    
    // Criar usuário admin padrão
    const adminUser: InsertUser = {
      name: "Admin",
      email: "admin@example.com",
      password: "admin123",
      type: "admin",
      address: "",
      phone: ""
    };
    this.createUser(adminUser).catch(console.error);
  }

  private async seedData() {
    // Criar usuário administrador padrão
    await this.createUser({
      name: 'Administrador',
      email: 'adm@lanchonete.com',
      password: await bcrypt.hash('admin123', 10),
      type: 'admin'
    });
    
    // Criar usuário cliente padrão
    await this.createUser({
      name: 'Cliente Teste',
      email: 'cliente@teste.com',
      password: await bcrypt.hash('cliente123', 10),
      address: 'Rua Exemplo, 123',
      phone: '(11) 98765-4321',
      type: 'cliente'
    });
    
    // Criar categorias
    const hamburgueresId = (await this.createCategory({
      name: 'Hambúrgueres',
      description: 'Deliciosos hambúrgueres artesanais',
      imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90'
    })).id;
    
    const pizzasId = (await this.createCategory({
      name: 'Pizzas',
      description: 'Pizzas com bordas recheadas',
      imageUrl: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212'
    })).id;
    
    const porcoesId = (await this.createCategory({
      name: 'Porções',
      description: 'Porções para compartilhar',
      imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d'
    })).id;
    
    const bebidasId = (await this.createCategory({
      name: 'Bebidas',
      description: 'Refrigerantes e sucos',
      imageUrl: 'https://images.unsplash.com/photo-1613564834361-9436948817d1'
    })).id;
    
    // Criar produtos
    await this.createProduct({
      name: 'Hambúrguer Duplo',
      description: 'Dois suculentos hambúrgueres, queijo cheddar, bacon crocante, cebola caramelizada e molho especial.',
      price: 24.90,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
      isFeatured: true,
      isPromotion: false,
      categoryId: hamburgueresId,
      available: true
    });
    
    await this.createProduct({
      name: 'Pizza Pepperoni',
      description: 'Deliciosa pizza de pepperoni com queijo derretido e borda recheada com catupiry.',
      price: 39.90,
      imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e',
      isFeatured: true,
      isPromotion: true,
      oldPrice: 49.90,
      categoryId: pizzasId,
      available: true
    });
    
    await this.createProduct({
      name: 'Combo Família',
      description: '4 Hambúrgueres, 2 porções grandes de batata frita, 4 refrigerantes e 2 sobremesas.',
      price: 89.90,
      imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086',
      isFeatured: true,
      isPromotion: false,
      categoryId: hamburgueresId,
      available: true
    });
    
    await this.createProduct({
      name: 'Batata Frita',
      description: 'Porção de batata frita crocante.',
      price: 12.90,
      imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d',
      isFeatured: false,
      isPromotion: false,
      categoryId: porcoesId,
      available: true
    });
    
    await this.createProduct({
      name: 'Refrigerante',
      description: 'Refrigerante de cola 500ml.',
      price: 7.90,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97',
      isFeatured: false,
      isPromotion: false,
      categoryId: bebidasId,
      available: true
    });
  }
  
  // Implementação de Usuários
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId;
    this.currentUserId = (parseInt(this.currentUserId) + 1).toString();
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id: id,
      created_at: now.toISOString(),
      createdAt: now.toISOString()
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }
  
  // Implementação de Categorias
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId;
    this.currentCategoryId = (parseInt(this.currentCategoryId) + 1).toString();
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory: Category = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }
  
  // Implementação de Produtos
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.categoryId === categoryId
    );
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.isFeatured
    );
  }

  async getPromotionProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.isPromotion
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId;
    this.currentProductId = (parseInt(this.currentProductId) + 1).toString();
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct: Product = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }
  
  // Implementação de Pedidos
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId;
    this.currentOrderId = (parseInt(this.currentOrderId) + 1).toString();
    const now = new Date();
    const order: Order = { 
      ...insertOrder, 
      id,
      ticketNumber: `T${id}`,
      status: insertOrder.status || "recebido",
      totalAmount: insertOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      created_at: now.toISOString(),
      createdAt: now.toISOString()
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, orderData: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = { ...order, ...orderData };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<boolean> {
    return this.orders.delete(id);
  }
  
  // Implementação de Pagamentos
  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentByOrder(orderId: string): Promise<Payment | undefined> {
    for (const payment of this.payments.values()) {
      if (payment.orderId === orderId) {
        return payment;
      }
    }
    return undefined;
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const id = this.currentPaymentId;
    this.currentPaymentId = (parseInt(this.currentPaymentId) + 1).toString();
    const now = new Date();
    const payment: Payment = { ...paymentData, id, createdAt: now.toISOString() };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Payment | undefined> {
    const payment = await this.getPayment(id);
    if (!payment) return undefined;
    
    const updatedPayment: Payment = { ...payment, status };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }
  
  // Dashboard
  async getDashboardStats(): Promise<{
    totalOrders: number;
    totalSales: number;
    pendingOrders: number;
    productCount: number;
  }> {
    const orders = Array.from(this.orders.values());
    
    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    return {
      totalOrders: orders.length,
      totalSales: totalSales,
      pendingOrders: orders.filter(order => 
        ['pendente', 'confirmado', 'preparo'].includes(order.status)
      ).length,
      productCount: this.products.size
    };
  }

  async saveProduct(product: Product): Promise<void> {
    this.products.set(product.id, product);
  }

  async listProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async listOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getAvailableProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.available);
  }

  async saveOrder(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }

  async getOrderWithItems(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
}

// Use apenas o MemStorage como implementação
export const storage = new MemStorage();

// Atualizar outras funções que usam números como strings
async function getOrderById(id: string): Promise<any> {
  try {
    const order = await db.get('orders').find({ id: String(id) }).value();
    return order ? convertOrder(order) : null;
  } catch (error) {
    console.error(`Erro ao buscar pedido ${id}:`, error);
    throw error;
  }
}
