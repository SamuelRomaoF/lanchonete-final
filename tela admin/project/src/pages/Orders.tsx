import { useState, useEffect } from 'react';
import { useSupabase } from '../lib/supabase-provider';
import { RefreshCwIcon, EyeIcon, SearchIcon, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  customer_name: string;
  customer_email: string | null;
  status: string;
  total: number;
  created_at: string;
  items?: OrderItem[];
}

export default function Orders() {
  const { supabase } = useSupabase();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Order details modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchOrders();
  }, [supabase]);

  async function fetchOrders() {
    setLoading(true);
    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (ordersError) throw ordersError;
      
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }

  async function viewOrderDetails(order: Order) {
    try {
      // Fetch order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          product_id,
          quantity,
          price,
          products (name)
        `)
        .eq('order_id', order.id);
        
      if (itemsError) throw itemsError;
      
      // Format items with product names
      const formattedItems = orderItems?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products?.name || 'Produto não encontrado',
        quantity: item.quantity,
        price: item.price
      }));
      
      // Set the selected order with items
      setSelectedOrder({
        ...order,
        items: formattedItems
      });
      
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Erro ao carregar detalhes do pedido');
    }
  }

  async function updateOrderStatus(orderId: number, newStatus: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
        
      if (error) throw error;
      
      // Update orders list
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      // Update selected order if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
      toast.success('Status atualizado com sucesso');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Erro ao atualizar status do pedido');
    }
  }

  function formatDate(dateString: string) {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedOrder(null);
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'pending':
        return { text: 'Pendente', classes: 'bg-yellow-900 text-yellow-200' };
      case 'processing':
        return { text: 'Processando', classes: 'bg-blue-900 text-blue-200' };
      case 'completed':
        return { text: 'Concluído', classes: 'bg-green-900 text-green-200' };
      case 'cancelled':
        return { text: 'Cancelado', classes: 'bg-red-900 text-red-200' };
      default:
        return { text: status, classes: 'bg-gray-900 text-gray-200' };
    }
  }

  const filteredOrders = orders.filter(order => {
    // Filter by search term (order ID or customer name)
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by status
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    // Filter by date range
    let matchesDateRange = true;
    if (startDate) {
      const orderDate = new Date(order.created_at);
      const filterStartDate = new Date(startDate);
      filterStartDate.setHours(0, 0, 0, 0);
      matchesDateRange = orderDate >= filterStartDate;
    }
    if (endDate && matchesDateRange) {
      const orderDate = new Date(order.created_at);
      const filterEndDate = new Date(endDate);
      filterEndDate.setHours(23, 59, 59, 999);
      matchesDateRange = orderDate <= filterEndDate;
    }
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Histórico de Pedidos</h1>
        <button 
          onClick={fetchOrders}
          className="flex items-center gap-2 bg-[#46342e] hover:bg-[#5a443c] text-white px-3 py-1.5 rounded transition-colors"
        >
          <RefreshCwIcon size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por ID ou cliente..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        
        <div className="relative">
          <select
            className="select pl-10 appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="processing">Processando</option>
            <option value="completed">Concluído</option>
            <option value="cancelled">Cancelado</option>
          </select>
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="date"
              className="input pl-10"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <CalendarIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <span className="self-center text-gray-400">até</span>
          <div className="relative flex-1">
            <input
              type="date"
              className="input pl-10"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <CalendarIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCwIcon size={24} className="animate-spin text-[#e67e22]" />
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="bg-[#46342e] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#5a443c]">
                  <th className="py-3 px-4 text-left font-medium">Pedido</th>
                  <th className="py-3 px-4 text-left font-medium">Cliente</th>
                  <th className="py-3 px-4 text-left font-medium">Data</th>
                  <th className="py-3 px-4 text-left font-medium">Status</th>
                  <th className="py-3 px-4 text-right font-medium">Total</th>
                  <th className="py-3 px-4 text-center font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const status = getStatusLabel(order.status);
                  return (
                    <tr key={order.id} className="border-t border-[#5a443c] hover:bg-[#5a443c] transition-colors">
                      <td className="py-3 px-4">{`#${order.id}`}</td>
                      <td className="py-3 px-4">{order.customer_name}</td>
                      <td className="py-3 px-4">{formatDate(order.created_at)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${status.classes}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">R$ {order.total.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="p-1.5 rounded bg-[#e67e22] hover:bg-[#d35400] transition-colors"
                          title="Ver detalhes"
                        >
                          <EyeIcon size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 card">
          <h3 className="text-xl font-semibold mb-2">Nenhum pedido encontrado</h3>
          <p className="text-gray-400">
            Não há pedidos que correspondam aos filtros selecionados
          </p>
        </div>
      )}

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#46342e] rounded-lg w-full max-w-2xl my-8 animate-fade-in-scale">
            <div className="flex justify-between items-center p-4 border-b border-[#5a443c]">
              <div>
                <h2 className="text-lg font-semibold">
                  Pedido #{selectedOrder.id}
                </h2>
                <p className="text-sm text-gray-400">
                  {formatDate(selectedOrder.created_at)}
                </p>
              </div>
              <button onClick={closeModal} className="p-1 rounded-full hover:bg-[#5a443c]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="font-medium mb-2">Informações do Cliente</h3>
                  <p className="text-sm">{selectedOrder.customer_name}</p>
                  {selectedOrder.customer_email && (
                    <p className="text-sm">{selectedOrder.customer_email}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-medium mb-2">Status do Pedido</h3>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    className="select"
                  >
                    <option value="pending">Pendente</option>
                    <option value="processing">Processando</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
              
              <h3 className="font-medium mb-2">Itens do Pedido</h3>
              <div className="bg-[#2a211c] rounded-lg overflow-hidden mb-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#5a443c]">
                      <th className="py-2 px-4 text-left font-medium">Produto</th>
                      <th className="py-2 px-4 text-center font-medium">Quantidade</th>
                      <th className="py-2 px-4 text-right font-medium">Preço</th>
                      <th className="py-2 px-4 text-right font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map(item => (
                      <tr key={item.id} className="border-b border-[#5a443c]">
                        <td className="py-2 px-4">{item.product_name}</td>
                        <td className="py-2 px-4 text-center">{item.quantity}</td>
                        <td className="py-2 px-4 text-right">R$ {item.price.toFixed(2)}</td>
                        <td className="py-2 px-4 text-right">R$ {(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#5a443c]">
                      <td colSpan={3} className="py-2 px-4 text-right font-medium">Total:</td>
                      <td className="py-2 px-4 text-right font-bold">R$ {selectedOrder.total.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className="btn-primary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}