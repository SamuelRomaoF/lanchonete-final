import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  products, type Product, type InsertProduct,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  payments, type Payment, type InsertPayment
} from "@shared/schema";
import * as bcrypt from 'bcrypt';
import { eq, and, desc, gte, lte, asc, like, inArray } from "drizzle-orm";

// Interface de armazenamento
export interface IStorage {
  // Usuários
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
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

// Implementação em memória
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private payments: Map<number, Payment>;
  
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
      email: 'admin@fastlanche.com.br',
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
  async getUser(id: number): Promise<User | undefined> {
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
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
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
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory: Category = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }
  
  // Implementação de Produtos
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.categoryId === categoryId
    );
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.isFeatured === true
    );
  }

  async getPromotionProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.isPromotion === true
    );
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const now = new Date();
    const product: Product = { ...insertProduct, id, createdAt: now };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
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
    return Array.from(this.orders.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
        if (!product) throw new Error(`Produto ${item.productId} não encontrado`);
        return { ...item, product };
      });
    
    return { order, items };
  }

  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const id = this.currentOrderId++;
    const now = new Date();
    const order: Order = { 
      ...orderData, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    
    this.orders.set(id, order);
    
    // Criar itens do pedido
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
    
    const now = new Date();
    const updatedOrder: Order = { 
      ...order, 
      status: status as any,
      updatedAt: now
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
    const payment: Payment = { 
      ...paymentData, 
      id, 
      createdAt: now
    };
    
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
  
  // Estatísticas para Dashboard
  async getDashboardStats(): Promise<{
    totalOrders: number;
    totalSales: number;
    pendingOrders: number;
    productCount: number;
  }> {
    const allOrders = Array.from(this.orders.values());
    const totalOrders = allOrders.length;
    
    const totalSales = allOrders.reduce((sum, order) => sum + order.total, 0);
    
    const pendingOrders = allOrders.filter(
      order => ['pendente', 'confirmado', 'preparo', 'entrega'].includes(order.status)
    ).length;
    
    const productCount = this.products.size;
    
    return {
      totalOrders,
      totalSales,
      pendingOrders,
      productCount
    };
  }
}

import { db } from "./db";
import { eq, desc, inArray, sql } from "drizzle-orm";
import { users, categories, products, orders, orderItems, payments } from "@shared/schema";

// Implementação com banco de dados PostgreSQL
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id));
    return true; // Drizzle não retorna o número de linhas afetadas por padrão
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.categoryId, categoryId));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isFeatured, true));
  }

  async getPromotionProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isPromotion, true));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    await db
      .delete(products)
      .where(eq(products.id, id));
    return true;
  }

  async getOrders(): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async getOrderWithItems(id: number): Promise<{order: Order, items: (OrderItem & {product: Product})[]} | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    const items = await db
      .select()
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));
    
    const formattedItems = items.map(({ order_items, products }) => ({
      ...order_items,
      product: products
    })) as (OrderItem & {product: Product})[];
    
    return { order, items: formattedItems };
  }

  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    // Usando uma transação para garantir que os itens só sejam inseridos se o pedido for criado
    const [order] = await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values(orderData)
        .returning();
      
      // Adicionar o orderId aos itens
      const orderItems = items.map(item => ({
        ...item,
        orderId: newOrder.id
      }));
      
      await tx
        .insert(orderItems)
        .values(orderItems);
      
      return [newOrder];
    });
    
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ 
        status: status as any,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    return payment;
  }

  async getPaymentByOrder(orderId: number): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId));
    return payment;
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(paymentData)
      .returning();
    return payment;
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set({ status })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async getDashboardStats(): Promise<{
    totalOrders: number;
    totalSales: number;
    pendingOrders: number;
    productCount: number;
  }> {
    // Obter estatísticas do dashboard
    const allOrders = await db.select().from(orders);
    const pendingOrdersCount = await db
      .select()
      .from(orders)
      .where(inArray(orders.status, ['pendente', 'confirmado', 'preparo', 'entrega']))
      .then(orders => orders.length);
    
    const productCount = await db
      .select({ count: sql`count(*)` })
      .from(products)
      .then(result => Number(result[0].count));
    
    return {
      totalOrders: allOrders.length,
      totalSales: allOrders.reduce((sum, order) => sum + order.total, 0),
      pendingOrders: pendingOrdersCount,
      productCount
    };
  }
}

// Usar a implementação com banco de dados
export const storage = new DatabaseStorage();
