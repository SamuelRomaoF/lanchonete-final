import { ApiResponse, insertOrderSchema, Order, OrderItem, OrderStatus, Payment, PaymentMethod, PaymentStatus, Product } from "@shared/schema";
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import type { Express, Request, Response } from "express";
import { z } from "zod";
import emailService from './email-service';
import * as menuStorage from './menu-storage';
import { checkAndResetQueueForNewDay, loadQueueData, saveQueueData } from './queue-storage';
import { storage } from "./storage";
import whatsappService from './whatsapp-service';

// Função para lidar com erros do Zod
function handleZodError(error: z.ZodError) {
  return { 
    message: "Erro de validação", 
    errors: error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message
    }))
  };
}

// Middleware para verificar autenticação
const authMiddleware = (req: Request, res: Response, next: Function) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  next();
};

// Middleware para verificar se é admin
const adminMiddleware = (req: Request, res: Response, next: Function) => {
  if (!req.session.user || req.session.user.type !== 'admin') {
    return res.status(403).json({ message: "Acesso restrito a administradores" });
  }
  
  next();
};

// Função para converter tipos de dados
function convertOrder(order: any): any {
  return {
    ...order,
    id: String(order.id || ''),
    items: Array.isArray(order.items) ? order.items.map((item: any) => ({
      ...item,
      id: String(item.id || crypto.randomUUID()),
      orderId: String(order.id),
      productId: item.productId ? String(item.productId) : undefined,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1)
    })) : [],
    totalAmount: Number(order.totalAmount || order.total || 0),
    total: Number(order.total || order.totalAmount || 0),
    created_at: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(),
    updated_at: order.updated_at ? new Date(order.updated_at).toISOString() : undefined,
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : undefined,
    updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : undefined
  };
}

// Atualizar funções que lidam com IDs
async function getProductById(id: string): Promise<Product | null> {
  try {
    if (!id) return null;
    const product = await storage.getProduct(String(id));
    return product ? {
      ...product,
      id: String(product.id),
      categoryId: String(product.categoryId)
    } : null;
  } catch (error) {
    console.error(`Erro ao buscar produto ${id}:`, error);
    throw error;
  }
}

// Atualizar função de criação de pedido
async function createOrder(orderData: Partial<Order>): Promise<Order> {
  try {
    const now = new Date().toISOString();
    const totalAmount = Number(orderData.totalAmount || 0);
    
    const order: Order = {
      id: crypto.randomUUID(),
      ticketNumber: `T${Date.now().toString().slice(-6)}`,
      status: (orderData.status || 'recebido') as OrderStatus,
      items: (orderData.items || []).map((item: Partial<OrderItem>) => ({
        id: crypto.randomUUID(),
        name: item.name || '',
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        notes: item.notes || ''
      })),
      totalAmount,
      customer: {
        name: orderData.customer?.name || 'Cliente',
        email: orderData.customer?.email || 'cliente@example.com',
        phone: orderData.customer?.phone || '',
        address: orderData.customer?.address || ''
      },
      paymentMethod: (orderData.paymentMethod || 'pix') as PaymentMethod,
      paymentStatus: (orderData.paymentStatus || 'pending') as PaymentStatus,
      created_at: now,
      updated_at: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      notes: orderData.notes || '',
      userId: orderData.userId || '',
      paymentDetails: orderData.paymentDetails || {}
    };

    await storage.saveOrder(order);
    return order;
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    throw error;
  }
}

// Atualizar função de atualização de pedido
async function updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
  try {
    const existingOrder = await storage.getOrder(id);
    if (!existingOrder) {
      throw new Error(`Pedido ${id} não encontrado`);
    }

    const now = new Date().toISOString();

    const updatedOrder: Order = {
      ...existingOrder,
      ...orderData,
      id: id,
      items: orderData.items?.map((item: Partial<OrderItem>) => ({
        id: item.id || crypto.randomUUID(),
        name: item.name || '',
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        notes: item.notes || ''
      })) || existingOrder.items,
      customer: {
        ...existingOrder.customer,
        ...orderData.customer,
        phone: orderData.customer?.phone || existingOrder.customer.phone || '',
        address: orderData.customer?.address || existingOrder.customer.address || ''
      },
      status: (orderData.status || existingOrder.status) as OrderStatus,
      paymentMethod: (orderData.paymentMethod || existingOrder.paymentMethod) as PaymentMethod,
      paymentStatus: (orderData.paymentStatus || existingOrder.paymentStatus) as PaymentStatus,
      updated_at: now,
      totalAmount: Number(orderData.totalAmount || existingOrder.totalAmount),
      notes: orderData.notes || existingOrder.notes || '',
      userId: orderData.userId || existingOrder.userId || '',
      paymentDetails: orderData.paymentDetails || existingOrder.paymentDetails || {}
    };

    await storage.saveOrder(updatedOrder);
    return updatedOrder;
  } catch (error) {
    console.error(`Erro ao atualizar pedido ${id}:`, error);
    throw error;
  }
}

// Atualizar função de processamento de pagamento
async function processPayment(orderId: string, paymentData: any): Promise<Payment> {
  try {
    const order = await storage.getOrder(orderId);
    if (!order) {
      throw new Error(`Pedido ${orderId} não encontrado`);
    }

    // Simular processamento de pagamento
    const payment: Payment = {
      id: crypto.randomUUID(),
      status: "paid" as const,
      method: order.paymentMethod,
      amount: order.totalAmount,
      orderId: String(order.id),
      transactionId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      paymentDetails: {},
      createdAt: new Date().toISOString()
    };

    // Atualizar status do pedido
    await updateOrder(orderId, {
      paymentStatus: payment.status,
      paymentDetails: payment.paymentDetails
    });

    return payment;
  } catch (error) {
    console.error(`Erro ao processar pagamento do pedido ${orderId}:`, error);
    throw error;
  }
}

// Atualizar função de listagem de produtos
async function listProducts(): Promise<Product[]> {
  const products = await storage.listProducts();
  return products;
}

// Atualizar função de listagem de produtos por categoria
async function listProductsByCategory(categoryId: string): Promise<Product[]> {
  const products = await storage.getProductsByCategory(categoryId);
  return products;
}

// Atualizar função de listagem de produtos em destaque
async function listFeaturedProducts(): Promise<Product[]> {
  const products = await storage.getFeaturedProducts();
  return products;
}

// Atualizar função de listagem de produtos em promoção
async function listPromotionProducts(): Promise<Product[]> {
  const products = await storage.getPromotionProducts();
  return products;
}

export async function registerRoutes(app: Express): Promise<void> {
  // ==== Rotas de autenticação ====
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      // Salvar sessão
      if (req.session) {
        req.session.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type
        };
      }
      
      // Responder sem a senha
      const { password: _, ...userWithoutPassword } = user;
      return res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: "Logout realizado com sucesso" });
    });
  });
  
  app.get('/api/auth/me', (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    return res.status(200).json({ user: req.session.user });
  });
  
  // ==== Rotas de categorias ====
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await menuStorage.loadCategories();
      res.json(categories);
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      res.status(500).json({ error: 'Erro ao listar categorias' });
    }
  });
  
  app.get('/api/categories/:id', async (req, res) => {
    try {
      const id = req.params.id;
      
      if (!id) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const categories = await menuStorage.loadCategories();
      const category = categories.find(c => c.id === id);
      
      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
      
      return res.status(200).json(category);
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      return res.status(500).json({ message: "Erro ao buscar categoria" });
    }
  });
  
  app.post('/api/categories', adminMiddleware, async (req, res) => {
    try {
      const newCategory = await menuStorage.createCategory(req.body);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      res.status(500).json({ error: 'Erro ao criar categoria' });
    }
  });
  
  app.put('/api/categories/:id', adminMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const updatedCategory = await menuStorage.updateCategory(id, req.body);
      
      if (!updatedCategory) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
  });
  
  app.delete('/api/categories/:id', adminMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const success = await menuStorage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }
      
      res.json({ message: 'Categoria excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      res.status(500).json({ error: 'Erro ao excluir categoria' });
    }
  });
  
  // ==== Rotas de produtos ====
  app.get('/api/products', async (req, res) => {
    try {
      const products = await listProducts();
      const response: ApiResponse = {
        success: true,
        data: products
      };
      res.json(response);
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro ao listar produtos'
      };
      res.status(500).json(response);
    }
  });
  
  app.get('/api/products/category/:id', async (req, res) => {
    try {
      const products = await listProductsByCategory(req.params.id);
      const response: ApiResponse = {
        success: true,
        data: products
      };
      res.json(response);
    } catch (error) {
      console.error('Erro ao listar produtos por categoria:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro ao listar produtos por categoria'
      };
      res.status(500).json(response);
    }
  });
  
  app.get('/api/products/featured', async (req, res) => {
    try {
      const products = await listFeaturedProducts();
      const response: ApiResponse = {
        success: true,
        data: products
      };
      res.json(response);
    } catch (error) {
      console.error('Erro ao listar produtos em destaque:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro ao listar produtos em destaque'
      };
      res.status(500).json(response);
    }
  });
  
  app.get('/api/products/promotions', async (req, res) => {
    try {
      const products = await listPromotionProducts();
      const response: ApiResponse = {
        success: true,
        data: products
      };
      res.json(response);
    } catch (error) {
      console.error('Erro ao listar produtos em promoção:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro ao listar produtos em promoção'
      };
      res.status(500).json(response);
    }
  });
  
  app.get('/api/products/:id', async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "ID inválido" });
      }
      const products = await menuStorage.loadProducts();
      const product = products.find(p => p.id === id);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      return res.status(200).json(product);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return res.status(500).json({ message: "Erro ao buscar produto" });
    }
  });
  
  app.post('/api/products', adminMiddleware, async (req, res) => {
    try {
      const newProduct = await menuStorage.createProduct(req.body);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      res.status(500).json({ error: 'Erro ao criar produto' });
    }
  });
  
  app.put('/api/products/:id', adminMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const updatedProduct = await menuStorage.updateProduct(id, req.body);
      
      if (!updatedProduct) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  });
  
  app.delete('/api/products/:id', adminMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const success = await menuStorage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      
      res.json({ message: 'Produto excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      res.status(500).json({ error: 'Erro ao excluir produto' });
    }
  });
  
  // ==== Rotas de pedidos ====
  app.get('/api/orders', adminMiddleware, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      return res.status(200).json(orders);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      return res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
  });
  
  app.get('/api/users/:userId/orders', authMiddleware, async (req, res) => {
    try {
      const userId = req.params.userId;
      const sessionUser = (req as any).session.user;
      
      if (!userId) {
        return res.status(400).json({ message: "ID de usuário inválido" });
      }
      
      // Verificar se o usuário está buscando seus próprios pedidos ou é um admin
      if (sessionUser.id !== userId && sessionUser.type !== 'admin') {
        return res.status(403).json({ message: "Não autorizado a ver pedidos de outro usuário" });
      }
      
      const orders = await storage.getOrdersByUser(userId);
      return res.status(200).json(orders);
    } catch (error) {
      console.error('Erro ao buscar pedidos do usuário:', error);
      return res.status(500).json({ message: "Erro ao buscar pedidos do usuário" });
    }
  });
  
  app.get('/api/orders/:id', authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const sessionUser = (req as any).session.user;
      
      if (!id) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const orderDetails = await storage.getOrderWithItems(id);
      
      if (!orderDetails) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      
      // Verificar se o usuário está buscando seu próprio pedido ou é um admin
      if (sessionUser.id !== orderDetails.userId && sessionUser.type !== 'admin') {
        return res.status(403).json({ message: "Não autorizado a ver este pedido" });
      }
      
      return res.status(200).json(orderDetails);
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
      return res.status(500).json({ message: "Erro ao buscar detalhes do pedido" });
    }
  });
  
  app.post('/api/orders', async (req, res) => {
    try {
      const { orderData, items } = req.body;
      
      // Validar dados do pedido
      const orderResult = insertOrderSchema.safeParse(orderData);
      
      if (!orderResult.success) {
        return res.status(400).json(handleZodError(orderResult.error));
      }
      
      // Verificar se items é um array válido
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          message: "Erro de validação",
          errors: [{ path: "items", message: "Itens do pedido são obrigatórios" }]
        });
      }
      
      // Criar o pedido com os dados validados
      const newOrder = await storage.createOrder(orderResult.data, items);
      
      return res.status(201).json({
        message: "Pedido criado com sucesso",
        order: newOrder
      });
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      return res.status(500).json({ message: "Erro ao criar pedido" });
    }
  });
  
  app.patch('/api/orders/:id/status', adminMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const { status } = req.body;
      
      if (!id) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      if (!status || !['recebido', 'em_preparo', 'pronto', 'entregue', 'cancelado'].includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(id, status);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      
      return res.status(200).json({
        message: "Status do pedido atualizado com sucesso",
        order: updatedOrder
      });
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      return res.status(500).json({ message: "Erro ao atualizar status do pedido" });
    }
  });
  
  // ==== Rotas de pagamentos ====
  app.post('/api/payments', authMiddleware, async (req, res) => {
    try {
      const result = insertOrderSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json(handleZodError(result.error));
      }
      
      const { orderId } = result.data;
      
      // Verificar se o pedido existe
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      
      // Verificar se já existe pagamento para este pedido
      const existingPayment = await storage.getPaymentByOrder(orderId);
      
      if (existingPayment) {
        return res.status(400).json({ message: "Já existe um pagamento para este pedido" });
      }
      
      // Criar pagamento
      const payment = {
        method: 'pix',
        status: 'paid' as PaymentStatus,
        paymentDetails: {},
        amount: order.totalAmount,
        orderId: order.id,
        createdAt: new Date().toISOString(),
        transactionId: `${Date.now()}-${Math.random().toString(36).slice(2)}`
      };

      // Atualizar status do pedido
      await updateOrder(orderId, {
        paymentStatus: payment.status,
        paymentDetails: payment.paymentDetails
      });

      return res.status(201).json({
        message: "Pagamento registrado com sucesso",
        payment: payment
      });
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      return res.status(500).json({ message: "Erro ao registrar pagamento" });
    }
  });
  
  app.get('/api/payments/:id', authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "ID inválido" });
      }
      const payment = await storage.getPayment(id);
      if (!payment) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }
      return res.status(200).json(payment);
    } catch (error) {
      console.error('Erro ao buscar pagamento:', error);
      return res.status(500).json({ message: "Erro ao buscar pagamento" });
    }
  });
  
  app.get('/api/orders/:orderId/payment', authMiddleware, async (req, res) => {
    try {
      const orderId = req.params.orderId;
      if (!orderId) {
        return res.status(400).json({ message: "ID de pedido inválido" });
      }
      const payment = await storage.getPaymentByOrder(orderId);
      if (!payment) {
        return res.status(404).json({ message: "Pagamento não encontrado para este pedido" });
      }
      return res.status(200).json(payment);
    } catch (error) {
      console.error('Erro ao buscar pagamento do pedido:', error);
      return res.status(500).json({ message: "Erro ao buscar pagamento do pedido" });
    }
  });
  
  app.patch('/api/payments/:id/status', adminMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const { status } = req.body;
      if (!id) {
        return res.status(400).json({ message: "ID inválido" });
      }
      if (!status || !['pending', 'paid', 'failed', 'refunded'].includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }
      const updatedPayment = await storage.updatePaymentStatus(id, status);
      if (!updatedPayment) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }
      // Se o pagamento for aprovado, atualizar status do pedido para em_preparo
      if (status === 'paid') {
        await storage.updateOrderStatus(updatedPayment.orderId, 'em_preparo');
      }
      // Se o pagamento for recusado, atualizar status do pedido para cancelado
      if (status === 'failed') {
        await storage.updateOrderStatus(updatedPayment.orderId, 'cancelado');
      }
      return res.status(200).json({
        message: "Status do pagamento atualizado com sucesso",
        payment: updatedPayment
      });
    } catch (error) {
      console.error('Erro ao atualizar status do pagamento:', error);
      return res.status(500).json({ message: "Erro ao atualizar status do pagamento" });
    }
  });
  
  // ==== Rota de dashboard para admin ====
  app.get('/api/admin/dashboard', adminMiddleware, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      console.log(categories.length);
      const products = await storage.getProducts();
      console.log(products.length);
      const orders = await storage.getOrders();
      const stats = {
        totalCategories: categories.length,
        totalProducts: products.length,
        totalOrders: orders.length,
        recentOrders: orders.slice(-5)
      };
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      return res.status(500).json({ message: "Erro ao buscar estatísticas do dashboard" });
    }
  });

  // ==== Rotas para sistema de senhas ====
  
  // Verificar e resetar a fila se for um novo dia
  app.get('/api/queue/check-reset', (req, res) => {
    const wasReset = checkAndResetQueueForNewDay();
    res.json({ reset: wasReset });
  });
  
  // Sincronizar dados da API com o arquivo local
  app.post('/api/queue/sync', async (req, res) => {
    try {
      console.log('Recebida solicitação para sincronizar fila');
      
      const { orders, currentPrefix, currentNumber } = req.body;
      
      // Verificação detalhada dos dados recebidos
      if (!orders) {
        console.error('Dados inválidos: orders não definido');
        return res.status(400).json({ message: "Dados inválidos: orders não definido" });
      }
      
      if (!Array.isArray(orders)) {
        console.error('Dados inválidos: orders não é um array', typeof orders);
        return res.status(400).json({ message: "Dados inválidos: orders deve ser um array" });
      }
      
      if (!currentPrefix) {
        console.error('Dados inválidos: currentPrefix não definido');
        return res.status(400).json({ message: "Dados inválidos: currentPrefix não definido" });
      }
      
      if (!currentNumber) {
        console.error('Dados inválidos: currentNumber não definido');
        return res.status(400).json({ message: "Dados inválidos: currentNumber não definido" });
      }
      
      console.log(`Processando ${orders.length} pedidos para sincronização`);
      
      // Carregar dados atuais para comparar
      const currentData = loadQueueData();
      const currentOrderIds = currentData.orders.map((o: any) => o.id);
      
      // Verificar se há pedidos novos para notificar
      const newOrders = orders.filter((order: any) => !currentOrderIds.includes(order.id));
      
      if (newOrders.length > 0) {
        console.log(`Detectados ${newOrders.length} pedidos novos para notificação`);
        
        // Usamos Promise.all para evitar envios duplicados e garantir que esperamos as notificações
        await Promise.all(newOrders.map(async (order: any) => {
          try {
            // Não enviamos e-mail aqui, para evitar duplicidade
            console.log('Pedido sincronizado:', order.id);
            return true;
          } catch (emailError) {
            console.error('Erro ao processar pedido:', order.id, emailError);
            return null;
          }
        }));
      }
      
      if (orders.length > 0) {
        console.log('Amostra de pedido:', JSON.stringify(orders[0]).substring(0, 200));
      }
      
      // Converter as datas de string para objeto Date
      const processedOrders = orders.map((order: any) => {
        if (!order.createdAt) {
          console.warn('Pedido sem data de criação:', order.id);
          order.createdAt = new Date();
        }
        
        return {
          ...order,
          createdAt: new Date(order.createdAt)
        };
      });
      
      console.log(`Processados ${processedOrders.length} pedidos`);
      
      // Salvar no arquivo
      saveQueueData({
        orders: processedOrders,
        currentPrefix,
        currentNumber
      });
      
      console.log('Sincronização concluída com sucesso');
      return res.json({ 
        success: true,
        message: "Dados sincronizados com sucesso",
        orderCount: processedOrders.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao sincronizar fila:", error);
      return res.status(500).json({ 
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Obter dados do servidor
  app.get('/api/queue', (req, res) => {
    try {
      console.log('Solicitação para obter dados da fila');
      
      const queueData = loadQueueData();
      
      console.log(`Enviando ${queueData.orders.length} pedidos para o cliente`);
      
      if (queueData.orders.length > 0) {
        console.log('Amostra de pedido:', JSON.stringify(queueData.orders[0]).substring(0, 200));
      }
      
      res.json(queueData);
    } catch (error) {
      console.error("Erro ao carregar dados da fila:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // === Nova rota para adicionar pedido e enviar notificação pelo WhatsApp ===
  app.post('/api/queue/add-and-notify', async (req, res) => {
    try {
      const { order, customerPhone } = req.body;
      
      if (!order) {
        return res.status(400).json({ message: "Dados do pedido não fornecidos" });
      }
      
      console.log('=== NOVO PEDIDO RECEBIDO PARA NOTIFICAÇÕES ===');
      console.log('Detalhes do pedido:', JSON.stringify(order, null, 2));
      
      // Carregar dados atuais
      const queueData = loadQueueData();
      
      // Verificar se o pedido já existe (evita duplicação)
      const pedidoExistente = queueData.orders.find(existingOrder => existingOrder.id === order.id);
      if (pedidoExistente) {
        console.log(`Pedido com ID ${order.id} já existe na fila. Evitando duplicação.`);
        return res.status(200).json({
          success: true,
          message: "Pedido já registrado anteriormente"
        });
      }
      
      // Adicionar pedido
      queueData.orders.push(order);
      
      // Salvar dados atualizados
      saveQueueData(queueData);
      
      
      // Marcador para controlar se o email já foi enviado
      let emailJaEnviado = false;
      
      // Tentativas de notificação em paralelo
      const notificationPromises = [];
      
      // Enviar notificação por e-mail para o estabelecimento
      console.log('Tentando enviar notificação por e-mail...');
      notificationPromises.push(
        emailService.sendNewOrderNotification(order)
          .then(result => {
            emailJaEnviado = true;
            console.log('E-mail de notificação enviado:', result);
            return result;
          })
          .catch(emailError => {
            console.error('Erro ao enviar notificação de e-mail:', emailError);
            // Não propagar o erro
            return null;
          })
      );
      
      // Enviar notificação WhatsApp para administradores
      notificationPromises.push(
        whatsappService.notifyAdminsAboutNewOrder(order)
          .catch(whatsappError => {
            console.error('Erro ao enviar notificação WhatsApp para admin:', whatsappError);
            // Não propagar o erro
            return null;
          })
      );
      
      // Se houver número de telefone do cliente, enviar confirmação
      if (customerPhone) {
        notificationPromises.push(
          whatsappService.notifyCustomerAboutOrder(order, customerPhone)
            .catch(customerError => {
              console.error('Erro ao enviar notificação WhatsApp para cliente:', customerError);
              // Não propagar o erro
              return null;
            })
        );
      }
      
      // Aguardar todas as tentativas de notificação, independentemente de sucesso ou falha
      const results = await Promise.allSettled(notificationPromises);
      console.log('Resultados das notificações:', JSON.stringify(results, null, 2));
      
      return res.status(201).json({
        success: true,
        message: "Pedido adicionado e notificações enviadas"
      });
    } catch (error) {
      console.error("Erro ao adicionar pedido e enviar notificação:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // === Nova rota para atualizar status e notificar cliente ===
  app.post('/api/queue/update-status', async (req, res) => {
    try {
      const { orderId, status, customerPhone } = req.body;
      
      if (!orderId || !status) {
        return res.status(400).json({ message: "ID do pedido e status são obrigatórios" });
      }
      
      // Carregar dados atuais
      const queueData = loadQueueData();
      
      // Encontrar pedido
      const orderIndex = queueData.orders.findIndex(order => order.id === orderId);
      
      if (orderIndex === -1) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      
      // Atualizar status
      queueData.orders[orderIndex].status = status;
      
      // Salvar dados atualizados
      saveQueueData(queueData);
      
      // Se houver número de telefone do cliente, enviar notificação
      if (customerPhone) {
        await whatsappService.notifyCustomerAboutStatusUpdate(
          queueData.orders[orderIndex],
          customerPhone
        );
      }
      
      return res.status(200).json({
        success: true,
        message: "Status atualizado e cliente notificado"
      });
    } catch (error) {
      console.error("Erro ao atualizar status e notificar cliente:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // === Rotas do Webhook do WhatsApp ===
  
  // Rota para verificação do webhook do WhatsApp (exigido pela API)
  app.get('/api/webhook/whatsapp', (req, res) => {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      
      // Verificar token definido no .env
      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'falecomigo_whatsapp_token';
      
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('Webhook do WhatsApp verificado com sucesso');
        return res.status(200).send(challenge);
      } else {
        console.error('Falha na verificação do webhook do WhatsApp');
        return res.sendStatus(403);
      }
    } catch (error) {
      console.error('Erro na verificação do webhook:', error);
      return res.sendStatus(500);
    }
  });
  
  // Rota para receber mensagens do WhatsApp
  app.post('/api/webhook/whatsapp', async (req, res) => {
    try {
      console.log('Webhook do WhatsApp recebido:', JSON.stringify(req.body).substring(0, 200));
      
      // Processar mensagem
      const result = await whatsappService.processWhatsAppWebhook(req.body);
      
      if (result.success) {
        console.log('Mensagem do WhatsApp processada com sucesso');
      } else {
        console.log('Mensagem do WhatsApp não pôde ser processada');
      }
      
      // Sempre responder com 200 para a API do WhatsApp
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erro ao processar webhook do WhatsApp:', error);
      
      // Mesmo com erro, enviamos 200 para o WhatsApp não retentar
      return res.status(200).json({ success: false });
    }
  });
  
  // === Novas rotas para gerenciamento de configurações de WhatsApp ===
  
  // Adicionar telefone de administrador para notificações
  app.post('/api/admin/whatsapp/recipients', adminMiddleware, (req, res) => {
    try {
      const { phoneNumber, name } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: "Número de telefone obrigatório" });
      }
      
      whatsappService.addAdminRecipient(phoneNumber, name);
      
      return res.status(200).json({
        success: true,
        message: "Receptor de notificações adicionado com sucesso"
      });
    } catch (error) {
      console.error("Erro ao adicionar receptor de notificações:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // === Rota para importar pedidos recebidos pelo WhatsApp ===
  app.get('/api/admin/whatsapp/pending-orders', adminMiddleware, (req, res) => {
    try {
      // Implementação futura: retornar pedidos recebidos pelo WhatsApp pendentes de importação
      // Por enquanto retornamos uma lista vazia
      return res.status(200).json({ pendingOrders: [] });
    } catch (error) {
      console.error("Erro ao buscar pedidos pendentes do WhatsApp:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ==== Rotas de Email ====
  app.get('/api/admin/email/recipients', adminMiddleware, (req, res) => {
    try {
      const emails = emailService.getEstablishmentEmails();
      return res.status(200).json({ emails });
    } catch (error) {
      console.error('Erro ao buscar destinatários de e-mail:', error);
      return res.status(500).json({ message: "Erro ao buscar e-mails" });
    }
  });

  app.post('/api/admin/email/recipients', adminMiddleware, (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "E-mail inválido" });
      }
      
      // Validação simples de e-mail
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Formato de e-mail inválido" });
      }
      
      const added = emailService.addEstablishmentEmail(email);
      
      if (added) {
        return res.status(201).json({ message: "E-mail adicionado com sucesso" });
      } else {
        return res.status(409).json({ message: "E-mail já está cadastrado" });
      }
    } catch (error) {
      console.error('Erro ao adicionar e-mail:', error);
      return res.status(500).json({ message: "Erro ao adicionar e-mail" });
    }
  });

  app.delete('/api/admin/email/recipients', adminMiddleware, (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "E-mail inválido" });
      }
      
      const removed = emailService.removeEstablishmentEmail(email);
      
      if (removed) {
        return res.status(200).json({ message: "E-mail removido com sucesso" });
      } else {
        return res.status(404).json({ message: "E-mail não encontrado" });
      }
    } catch (error) {
      console.error('Erro ao remover e-mail:', error);
      return res.status(500).json({ message: "Erro ao remover e-mail" });
    }
  });

  app.post('/api/admin/email/test', adminMiddleware, async (req, res) => {
    try {
      // Verificar se há e-mails cadastrados
      const emails = emailService.getEstablishmentEmails();
      
      if (emails.length === 0) {
        return res.status(400).json({ message: "Nenhum e-mail cadastrado para receber notificações" });
      }
      
      // Criar um pedido de teste
      const testOrder = {
        id: "test-order",
        ticket: "TESTE",
        status: "recebido",
        items: [
          { id: 1, name: "Item de teste 1", quantity: 2, price: 10.5 },
          { id: 2, name: "Item de teste 2", quantity: 1, price: 15.0 }
        ],
        total: 36.0,
        createdAt: new Date(),
        customerName: "Cliente Teste",
        customerPhone: "(00) 00000-0000"
      };
      
      // Verificar conexão com servidor de e-mail
      const isConnected = await emailService.testConnection();
      
      if (!isConnected) {
        return res.status(500).json({ 
          message: "Não foi possível conectar ao servidor de e-mail. Verifique as configurações." 
        });
      }
      
      // Enviar e-mail de teste
      const sent = await emailService.sendNewOrderNotification(testOrder);
      
      if (sent) {
        return res.status(200).json({ message: "E-mail de teste enviado com sucesso" });
      } else {
        return res.status(500).json({ message: "Não foi possível enviar o e-mail de teste" });
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail de teste:', error);
      return res.status(500).json({ message: "Erro ao enviar e-mail de teste" });
    }
  });

  // Rota para notificar sobre novo pedido via email
  app.post('/api/email/notify', async (req, res) => {
    try {
      const { order } = req.body;
      
      if (!order) {
        return res.status(400).json({ message: "Dados do pedido ausentes" });
      }
      
      // Verificar se há e-mails cadastrados
      const emails = emailService.getEstablishmentEmails();
      
      if (emails.length === 0) {
        console.warn("Nenhum e-mail cadastrado para receber notificações");
        return res.status(200).json({ message: "Nenhum e-mail para notificar" });
      }
      
      // Tentar enviar o e-mail
      const sent = await emailService.sendNewOrderNotification(order);
      
      if (sent) {
        return res.status(200).json({ message: "E-mail de notificação enviado com sucesso" });
      } else {
        return res.status(500).json({ message: "Falha ao enviar e-mail de notificação" });
      }
    } catch (error) {
      console.error("Erro ao enviar notificação por e-mail:", error);
      return res.status(500).json({ message: "Erro ao enviar notificação por e-mail" });
    }
  });
  
  // Rota para notificar sobre atualização de status de pedido via email
  app.post('/api/email/status-update', async (req, res) => {
    try {
      const { order, newStatus } = req.body;
      
      if (!order || !newStatus) {
        return res.status(400).json({ message: "Dados incompletos" });
      }
      
      // Apenas log e resposta de sucesso
      console.log("Atualização de status do pedido:", order.id, "para", newStatus);
      
      return res.status(200).json({ message: "Status atualizado com sucesso" });
    } catch (error) {
      console.error("Erro ao processar atualização de status:", error);
      return res.status(500).json({ message: "Erro ao processar atualização de status" });
    }
  });

  // Rota para verificar o sistema de armazenamento JSON
  app.get('/api/admin/storage-status', adminMiddleware, (req, res) => {
    try {
      // Forçar carregamento dos dados para garantir que os arquivos são criados
      const categories = menuStorage.loadCategories();
      const products = menuStorage.loadProducts();
      
      // Verificar os arquivos de dados
      const fs = require('fs');
      const path = require('path');
      
      const dataDir = path.resolve(process.cwd(), 'server', 'data');
      const CATEGORIES_FILE = path.resolve(dataDir, 'categories.json');
      const PRODUCTS_FILE = path.resolve(dataDir, 'products.json');
      
      const status = {
        dataDirectory: {
          exists: fs.existsSync(dataDir),
          path: dataDir
        },
        categoriesFile: {
          exists: fs.existsSync(CATEGORIES_FILE),
          path: CATEGORIES_FILE,
          count: categories.length
        },
        productsFile: {
          exists: fs.existsSync(PRODUCTS_FILE),
          path: PRODUCTS_FILE,
          count: products.length
        }
      };
      
      return res.status(200).json({
        message: "Sistema de armazenamento JSON verificado",
        status
      });
    } catch (error) {
      console.error('Erro ao verificar sistema de armazenamento:', error);
      return res.status(500).json({ 
        message: "Erro ao verificar sistema de armazenamento",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint para enviar e-mail personalizado
  app.post('/api/email/send', async (req, res) => {
    try {
      const { to, subject, message } = req.body;
      
      if (!to || !subject || !message) {
        return res.status(400).json({ 
          success: false,
          message: "Dados incompletos: to, subject e message são obrigatórios" 
        });
      }
      
      console.log('=== ENVIANDO E-MAIL PERSONALIZADO ===');
      console.log(`Para: ${to}`);
      console.log(`Assunto: ${subject}`);
      
      const mailOptions = {
        from: emailService.getConfig().from,
        to: to,
        subject: subject,
        html: message
      };
      
      // Testar conexão antes de enviar
      const connectionTest = await emailService.testConnection();
      if (!connectionTest) {
        console.error('Erro na conexão com servidor de e-mail. Não será possível enviar.');
        return res.status(500).json({ 
          success: false,
          message: "Erro na conexão com o servidor de e-mail" 
        });
      }
      
      // Enviar o e-mail
      const info = await emailService.getTransporter().sendMail(mailOptions);
      console.log('E-mail personalizado enviado com sucesso:', info.messageId);
      
      return res.status(200).json({
        success: true,
        message: "E-mail enviado com sucesso",
        messageId: info.messageId
      });
    } catch (error) {
      console.error("Erro ao enviar e-mail personalizado:", error);
      return res.status(500).json({ 
        success: false,
        message: "Erro ao enviar e-mail",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Função para criar um novo pedido
  app.post('/api/orders', async (req, res) => {
    try {
      const { orderData, items } = req.body;
      
      // Validar dados do pedido
      const orderResult = insertOrderSchema.safeParse(orderData);
      
      if (!orderResult.success) {
        return res.status(400).json(handleZodError(orderResult.error));
      }
      
      // Verificar se items é um array válido
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          message: "Erro de validação",
          errors: [{ path: "items", message: "Itens do pedido são obrigatórios" }]
        });
      }
      
      // Criar o pedido com os dados validados
      const newOrder = await storage.createOrder(orderResult.data, items);
      
      return res.status(201).json({
        message: "Pedido criado com sucesso",
        order: newOrder
      });
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      return res.status(500).json({ message: "Erro ao criar pedido" });
    }
  });

  // Não criar servidor HTTP, pois isso é gerenciado pelo serverless-http
}
