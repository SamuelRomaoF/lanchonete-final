import {
    type Category, type InsertCategory,
    type InsertOrder,
    type InsertOrderItem,
    type InsertPayment,
    type InsertProduct,
    type InsertUser,
    type Order,
    type OrderItem,
    type Payment,
    type Product,
    type User
} from "@shared/schema";
import * as bcrypt from 'bcrypt';

// Interface de armazenamento
export interface IStorage {
  // Usuários
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Categorias
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Produtos
  getProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getPromotionProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Pedidos
  getOrders(): Promise<Order[]>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderWithItems(id: number): Promise<{order: Order, items: (OrderItem & {product: Product})[]} | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Pagamentos
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByOrder(orderId: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: number, status: string): Promise<Payment | undefined>;
  
  // Dashboard
  getDashboardStats(): Promise<{
    totalOrders: number;
    totalSales: number;
    pendingOrders: number;
    productCount: number;
  }>;
}

// Função para converter tipos de dados
function convertOrder(order: any): any {
  return {
    ...order,
    id: String(order.id || ''),
    productId: order.productId ? String(order.productId) : undefined,
    orderId: order.orderId ? String(order.orderId) : undefined,
    created_at: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(),
    updated_at: order.updated_at ? new Date(order.updated_at).toISOString() : undefined,
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : undefined,
    updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : undefined,
    total: Number(order.total || order.totalAmount || 0),
    totalAmount: Number(order.totalAmount || order.total || 0),
    items: Array.isArray(order.items) ? order.items.map((item: any) => ({
      ...item,
      id: String(item.id || crypto.randomUUID()),
      orderId: String(order.id),
      productId: item.productId ? String(item.productId) : undefined,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1)
    })) : []
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
  
  private currentUserId: number;
  private currentCategoryId: number;
  private currentProductId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;
  private currentPaymentId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.payments = new Map();
    
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentProductId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    this.currentPaymentId = 1;
    
    // Inicializar com dados padrão
    this.seedData();
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
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id: id.toString(),
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
  
  // Implementação de Categorias
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id.toString());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { ...insertCategory, id: id.toString() };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id.toString());
    if (!category) return undefined;
    
    const updatedCategory: Category = { ...category, ...categoryData };
    this.categories.set(id.toString(), updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id.toString());
  }
  
  // Implementação de Produtos
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.categoryId === categoryId.toString()
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

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id.toString());
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const now = new Date();
    const product: Product = { ...insertProduct, id: id.toString(), createdAt: now.toISOString() };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id.toString());
    if (!product) return undefined;
    
    const updatedProduct: Product = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  
  // Implementação de Pedidos
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderWithItems(id: number): Promise<{order: Order, items: (OrderItem & {product: Product})[]} | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const items = Array.from(this.orderItems.values())
      .filter(item => item.orderId === id)
      .map(item => {
        const product = this.products.get(item.productId);
        return { ...item, product: product! };
      });
    
    return { order, items };
  }

  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    // Criar o pedido
    const id = this.currentOrderId++;
    const now = new Date();
    const order: Order = { 
      ...orderData, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.orders.set(id, order);
    
    // Criar os itens do pedido
    for (const item of items) {
      const itemId = this.currentOrderItemId++;
      const orderItem: OrderItem = {
        ...item,
        id: itemId,
        orderId: id
      };
      this.orderItems.set(itemId, orderItem);
    }
    
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = { 
      ...order, 
      status: status as any,
      updatedAt: new Date() 
    };
    this.orders.set(id, updatedOrder);
    
    return updatedOrder;
  }
  
  // Implementação de Pagamentos
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentByOrder(orderId: number): Promise<Payment | undefined> {
    for (const payment of this.payments.values()) {
      if (payment.orderId === orderId) {
        return payment;
      }
    }
    return undefined;
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const id = this.currentPaymentId++;
    const now = new Date();
    const payment: Payment = { ...paymentData, id, createdAt: now };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
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
    
    return {
      totalOrders: orders.length,
      totalSales: orders.reduce((sum, order) => sum + order.total, 0),
      pendingOrders: orders.filter(order => 
        ['pendente', 'confirmado', 'preparo'].includes(order.status)
      ).length,
      productCount: this.products.size
    };
  }
}

// Use apenas o MemStorage como implementação
export const storage = new MemStorage();

// Função para converter tipos de dados
function convertOrder(order: any): any {
  return {
    ...order,
    id: String(order.id || ''),
    productId: order.productId ? String(order.productId) : undefined,
    orderId: order.orderId ? String(order.orderId) : undefined,
    created_at: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(),
    updated_at: order.updated_at ? new Date(order.updated_at).toISOString() : undefined,
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : undefined,
    updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : undefined,
    total: Number(order.total || order.totalAmount || 0),
    totalAmount: Number(order.totalAmount || order.total || 0),
    items: Array.isArray(order.items) ? order.items.map((item: any) => ({
      ...item,
      id: String(item.id || crypto.randomUUID()),
      orderId: String(order.id),
      productId: item.productId ? String(item.productId) : undefined,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1)
    })) : []
  };
}
