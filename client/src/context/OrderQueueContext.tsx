import { checkQueueReset, syncQueue } from '@/lib/api';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Tipos
export type OrderStatus = 'recebido' | 'em_preparo' | 'pronto' | 'entregue';

export interface OrderTicket {
  id: string;         // ID único para o pedido
  ticket: string;     // Senha alfanumérica (ex: A01, B05)
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: Date;
  customerId?: string; // Opcional para manter histórico
  customerName?: string; // Nome do cliente, se fornecido
  customerPhone?: string; // Número de telefone do cliente para notificações
}

export interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface OrderQueueContextType {
  orders: OrderTicket[];
  currentPrefix: string;
  currentNumber: number;
  addOrder: (items: OrderItem[], customerName?: string, customerPhone?: string) => OrderTicket;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  getNextTicket: () => string;
  resetQueue: () => void;
  getTodayOrders: () => OrderTicket[];
  getActiveOrders: () => OrderTicket[];
  clearCompletedOrders: () => void;
  syncWithServer: () => Promise<void>;
  isSyncing: boolean;
  getOrderHistory: () => OrderTicket[];
  saveToOrderHistory: (order: OrderTicket) => void;
  clearOrderHistory: () => void;
  setOrders: React.Dispatch<React.SetStateAction<OrderTicket[]>>;
}

const OrderQueueContext = createContext<OrderQueueContextType | null>(null);

// Hook para uso do contexto
export const useOrderQueue = () => {
  const context = useContext(OrderQueueContext);
  if (!context) {
    throw new Error('useOrderQueue deve ser usado dentro de um OrderQueueProvider');
  }
  return context;
};

interface OrderQueueProviderProps {
  children: ReactNode;
}

export function OrderQueueProvider({ children }: OrderQueueProviderProps) {
  // Estado para armazenar os pedidos
  const [orders, setOrders] = useState<OrderTicket[]>([]);
  
  // Estado para controlar a geração de senhas
  const [currentPrefix, setCurrentPrefix] = useState('A');
  const [currentNumber, setCurrentNumber] = useState(1);
  
  // Estado para indicar sincronização
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Estado para o histórico de pedidos
  const [orderHistory, setOrderHistory] = useState<OrderTicket[]>([]);
  
  // Carregar histórico de pedidos do localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('orderHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory).map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt)
        }));
        setOrderHistory(parsedHistory);
      } catch (e) {
        console.error('Erro ao carregar histórico de pedidos:', e);
      }
    }
  }, []);
  
  // Salvar histórico de pedidos no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
  }, [orderHistory]);
  
  // Verificar se há um novo dia e resetar a fila se necessário
  useEffect(() => {
    const checkNewDay = async () => {
      try {
        // Verificar no servidor se é um novo dia
        const data = await checkQueueReset();
        
        if (data && data.reset) {
          // Foi resetado no servidor, resetar também localmente
          resetQueue();
        } else {
          // Carregar os dados salvos
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Erro ao verificar reset da fila:', error);
        loadFromLocalStorage();
      }
    };

    checkNewDay();
  }, []);

  // Carregar dados do localStorage
  const loadFromLocalStorage = () => {
    const savedDate = localStorage.getItem('orderQueue_date');
    const today = new Date().toDateString();
    
    // Se não for o mesmo dia, reinicie a fila
    if (savedDate !== today) {
      localStorage.setItem('orderQueue_date', today);
      localStorage.removeItem('orderQueue_orders');
      localStorage.setItem('orderQueue_prefix', 'A');
      localStorage.setItem('orderQueue_number', '1');
      setCurrentPrefix('A');
      setCurrentNumber(1);
      setOrders([]);
      syncWithServer();
    } else {
      // Carregar dados salvos
      const savedOrders = localStorage.getItem('orderQueue_orders');
      const savedPrefix = localStorage.getItem('orderQueue_prefix');
      const savedNumber = localStorage.getItem('orderQueue_number');
      
      if (savedOrders) {
        try {
          // Parse as datas de volta para objetos Date
          const parsedOrders = JSON.parse(savedOrders).map((order: any) => ({
            ...order,
            createdAt: new Date(order.createdAt)
          }));
          setOrders(parsedOrders);
        } catch (e) {
          console.error('Erro ao carregar pedidos do localStorage:', e);
        }
      }
      
      if (savedPrefix) setCurrentPrefix(savedPrefix);
      if (savedNumber) setCurrentNumber(parseInt(savedNumber, 10));
    }
  };
  
  // Sincronizar com o servidor
  const syncWithServer = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const response = await syncQueue({
        orders,
        currentPrefix: 'T',
        currentNumber: orders.length > 0 ? orders[orders.length - 1].ticket.slice(1) : '0'
      });

      if (response.success) {
        console.log('Dados sincronizados com sucesso');
      }
    } catch (error) {
      console.error('Erro ao enviar dados para o servidor:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Salvar pedidos no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('orderQueue_orders', JSON.stringify(orders));
    
    // Enviar para o servidor
    const sendToServer = async () => {
      try {
        await syncQueue({
          orders,
          currentPrefix: 'T',
          currentNumber: orders.length > 0 ? orders[orders.length - 1].ticket.slice(1) : '0'
        });
      } catch (error) {
        console.error('Erro ao enviar dados para o servidor:', error);
      }
    };
    
    // Debounce para não enviar muitas requisições seguidas
    const timeoutId = setTimeout(sendToServer, 500);
    return () => clearTimeout(timeoutId);
  }, [orders, currentPrefix, currentNumber]);
  
  // Salvar prefixo e número atual
  useEffect(() => {
    localStorage.setItem('orderQueue_prefix', currentPrefix);
    localStorage.setItem('orderQueue_number', currentNumber.toString());
  }, [currentPrefix, currentNumber]);
  
  // Gerar a próxima senha
  const getNextTicket = (): string => {
    return `${currentPrefix}${currentNumber.toString().padStart(2, '0')}`;
  };
  
  // Incrementar o contador de senhas
  const incrementTicketCounter = () => {
    // Se o número atual for 99, incrementa o prefixo
    if (currentNumber >= 99) {
      // Incrementa o prefixo de A para B, B para C, etc.
      const nextPrefix = String.fromCharCode(currentPrefix.charCodeAt(0) + 1);
      setCurrentPrefix(nextPrefix);
      setCurrentNumber(1);
    } else {
      setCurrentNumber(prev => prev + 1);
    }
  };
  
  // Adicionar um novo pedido (modificado para também salvar no histórico)
  const addOrder = (items: OrderItem[], customerName?: string, customerPhone?: string): OrderTicket => {
    const ticket = getNextTicket();
    incrementTicketCounter();
    
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Garantir que o ID é único
    const newId = Date.now().toString() + '-' + Math.floor(Math.random() * 1000).toString();
    
    const newOrder: OrderTicket = {
      id: newId,
      ticket,
      status: 'recebido',
      items,
      total,
      createdAt: new Date(),
      customerName,
      customerPhone
    };
    
    console.log("Novo pedido criado:", JSON.stringify(newOrder));
    
    // Atualizar o estado local com o novo pedido
    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    
    // Adicionar explicitamente ao histórico
    saveToOrderHistory(newOrder);
    
    // Log para depuração
    console.log("Novo pedido adicionado ao array:", updatedOrders.length);
    console.log("Histórico atual:", localStorage.getItem('orderHistory'));
    
    // Sincronizar imediatamente com o servidor
    const syncNewOrder = async () => {
      try {
        // Verificar se os dados estão completos antes de enviar
        console.log("Preparando para sincronizar pedido com o servidor:", 
          JSON.stringify({
            orders: updatedOrders,
            currentPrefix,
            currentNumber
          }, null, 2).substring(0, 500)
        );
        
        // Enviar dados atualizados para o servidor
        await syncQueue({
          orders: updatedOrders,
          currentPrefix: 'T',
          currentNumber: updatedOrders.length > 0 ? updatedOrders[updatedOrders.length - 1].ticket.slice(1) : '0'
        });
        
        console.log("Dados salvos no localStorage");
        
        // Forçar nova consulta ao servidor para confirmar que os dados foram salvos
        setTimeout(async () => {
          try {
            const checkResponse = await syncQueue({
              orders: updatedOrders,
              currentPrefix: 'T',
              currentNumber: updatedOrders.length > 0 ? updatedOrders[updatedOrders.length - 1].ticket.slice(1) : '0'
            });
            if (checkResponse.success) {
              console.log("Confirmação do servidor após sincronização:", checkResponse);
            }
          } catch (e) {
            console.error("Erro ao verificar sincronização:", e);
          }
        }, 1000);
      } catch (error) {
        console.error('Erro ao sincronizar novo pedido com servidor:', error);
      }
    };
    
    // Executar sincronização imediatamente
    syncNewOrder();
    
    return newOrder;
  };
  
  // Atualizar o status de um pedido (modificado para também atualizar no histórico)
  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => {
      const newOrders = prev.map(order => 
        order.id === id ? { ...order, status } : order
      );
      
      // Atualizar o pedido no histórico também
      const updatedOrder = newOrders.find(order => order.id === id);
      if (updatedOrder) {
        // Atualizar o histórico explicitamente
        saveToOrderHistory(updatedOrder);
      }
      
      // Log para depuração
      console.log("Pedido atualizado:", id, status);
      console.log("Pedidos atuais:", newOrders);
      
      return newOrders;
    });
    
    // Forçar a sincronização com o servidor
    const syncToServer = async () => {
      try {
        await syncQueue({
          orders: orders,
          currentPrefix: 'T',
          currentNumber: orders.length > 0 ? orders[orders.length - 1].ticket.slice(1) : '0'
        });
        console.log("Dados sincronizados com o servidor após atualização de status");
      } catch (error) {
        console.error('Erro ao sincronizar com o servidor:', error);
      }
    };
    
    // Executar sincronização após um pequeno atraso para garantir que os estados locais foram atualizados
    setTimeout(syncToServer, 200);
  };
  
  // Reiniciar a fila
  const resetQueue = () => {
    const today = new Date().toDateString();
    localStorage.setItem('orderQueue_date', today);
    localStorage.setItem('orderQueue_prefix', 'A');
    localStorage.setItem('orderQueue_number', '1');
    setCurrentPrefix('A');
    setCurrentNumber(1);
    setOrders([]);
    
    // Enviar reset para o servidor também
    try {
      syncQueue({
        orders: [],
        currentPrefix: 'T',
        currentNumber: 0
      });
    } catch (error) {
      console.error('Erro ao resetar fila no servidor:', error);
    }
  };
  
  // Obter pedidos do dia atual
  const getTodayOrders = () => {
    const today = new Date().toDateString();
    return orders.filter(order => new Date(order.createdAt).toDateString() === today);
  };
  
  // Obter pedidos ativos (não entregues)
  const getActiveOrders = () => {
    return orders.filter(order => order.status !== 'entregue');
  };
  
  // Limpar pedidos já entregues
  const clearCompletedOrders = () => {
    setOrders(prev => prev.filter(order => order.status !== 'entregue'));
  };
  
  // Obter o histórico de pedidos
  const getOrderHistory = (): OrderTicket[] => {
    return orderHistory.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };
  
  // Salvar um pedido no histórico
  const saveToOrderHistory = (order: OrderTicket) => {
    // Primeiro recupere o histórico atual do localStorage
    const savedHistory = localStorage.getItem('orderHistory');
    let currentHistory: OrderTicket[] = [];
    
    if (savedHistory) {
      try {
        currentHistory = JSON.parse(savedHistory).map((historyOrder: any) => ({
          ...historyOrder,
          createdAt: new Date(historyOrder.createdAt)
        }));
      } catch (e) {
        console.error('Erro ao carregar histórico do localStorage:', e);
      }
    }
    
    // Verificar se o pedido já existe no histórico
    const exists = currentHistory.some(historyOrder => historyOrder.id === order.id);
    
    if (exists) {
      // Atualizar o pedido existente
      currentHistory = currentHistory.map(historyOrder => 
        historyOrder.id === order.id ? order : historyOrder
      );
    } else {
      // Adicionar novo pedido no histórico
      currentHistory.push(order);
    }
    
    // Salvar o histórico atualizado no localStorage
    localStorage.setItem('orderHistory', JSON.stringify(currentHistory));
    
    // Atualizar o estado
    setOrderHistory(currentHistory);
  };
  
  // Limpar o histórico de pedidos
  const clearOrderHistory = () => {
    setOrderHistory([]);
    localStorage.removeItem('orderHistory');
  };
  
  const value = {
    orders,
    currentPrefix,
    currentNumber,
    addOrder,
    updateOrderStatus,
    getNextTicket,
    resetQueue,
    getTodayOrders,
    getActiveOrders,
    clearCompletedOrders,
    syncWithServer,
    isSyncing,
    getOrderHistory,
    saveToOrderHistory,
    clearOrderHistory,
    setOrders
  };
  
  return (
    <OrderQueueContext.Provider value={value}>
      {children}
    </OrderQueueContext.Provider>
  );
} 