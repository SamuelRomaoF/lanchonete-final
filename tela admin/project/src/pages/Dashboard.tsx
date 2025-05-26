import { useEffect, useState } from 'react';
import { useSupabase } from '../lib/supabase-provider';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar
} from 'recharts';
import { RefreshCwIcon, DollarSignIcon, PackageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderSummary {
  id: number;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { supabase } = useSupabase();
  const [totalSales, setTotalSales] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      
      // Fetch total sales
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('total');
        
      if (!ordersError && ordersData) {
        const total = ordersData.reduce((sum, order) => sum + order.total, 0);
        setTotalSales(total);
      }
      
      // Fetch product count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
        
      if (!productsError) {
        setProductCount(productsCount || 0);
      }
      
      // Fetch recent orders
      const { data: recentOrdersData, error: recentOrdersError } = await supabase
        .from('orders')
        .select('id, customer_name, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (!recentOrdersError && recentOrdersData) {
        setRecentOrders(recentOrdersData);
      }
      
      // Generate mock sales data (in a real app, this would come from the database)
      const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      const mockSalesData = weekDays.map(day => ({
        day,
        valor: Math.floor(Math.random() * 1000)
      }));
      setSalesData(mockSalesData);
      
      // Generate mock category data
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('name');
        
      if (!categoriesError && categories) {
        const mockCategoryData = categories.map(category => ({
          name: category.name,
          valor: Math.floor(Math.random() * 1000)
        }));
        setCategoryData(mockCategoryData);
      } else {
        // Fallback mock data
        setCategoryData([
          { name: 'Lanches', valor: 420 },
          { name: 'Bebidas', valor: 300 },
          { name: 'Sobremesas', valor: 180 },
          { name: 'Combos', valor: 250 }
        ]);
      }
      
      setLoading(false);
    }
    
    fetchDashboardData();
  }, [supabase]);

  const refreshData = () => {
    // Reload dashboard data
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button 
          onClick={refreshData}
          className="flex items-center gap-2 bg-[#46342e] hover:bg-[#5a443c] text-white px-3 py-1.5 rounded transition-colors"
        >
          <RefreshCwIcon size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card flex items-center gap-4">
          <div className="bg-[#5a443c] p-3 rounded">
            <DollarSignIcon className="text-[#e67e22]" />
          </div>
          <div>
            <h3 className="text-sm text-gray-400">Vendas Totais</h3>
            <p className="text-2xl font-bold">R$ {totalSales.toFixed(2)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="bg-[#5a443c] p-3 rounded">
            <PackageIcon className="text-[#e67e22]" />
          </div>
          <div>
            <h3 className="text-sm text-gray-400">Produtos</h3>
            <p className="text-2xl font-bold">{productCount}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Total de Vendas</h2>
          <p className="text-sm text-gray-400 mb-4">R$ {totalSales.toFixed(2)}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={salesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#5a443c" />
                <XAxis dataKey="day" stroke="#ece3dd" />
                <YAxis stroke="#ece3dd" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#46342e', border: 'none' }} 
                  formatter={(value) => [`R$ ${value}`, 'Valor']}
                />
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#e67e22" 
                  strokeWidth={2}
                  dot={{ fill: '#e67e22', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">Categorias</h2>
          <p className="text-sm text-gray-400 mb-4">Distribuição de vendas</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#5a443c" />
                <XAxis dataKey="name" stroke="#ece3dd" />
                <YAxis stroke="#ece3dd" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#46342e', border: 'none' }} 
                  formatter={(value) => [`R$ ${value}`, 'Valor']}
                />
                <Bar dataKey="valor" fill="#e67e22" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Pedidos Recentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#5a443c]">
                <th className="py-3 text-left font-medium">Pedido</th>
                <th className="py-3 text-left font-medium">Cliente</th>
                <th className="py-3 text-left font-medium">Data</th>
                <th className="py-3 text-left font-medium">Status</th>
                <th className="py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-[#5a443c]">
                    <td className="py-3">{`#${order.id}`}</td>
                    <td className="py-3">{order.customer_name}</td>
                    <td className="py-3">{formatDate(order.created_at)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs 
                        ${order.status === 'completed' ? 'bg-green-900 text-green-200' : 
                        order.status === 'pending' ? 'bg-yellow-900 text-yellow-200' : 
                        'bg-blue-900 text-blue-200'}`}
                      >
                        {order.status === 'completed' ? 'Concluído' : 
                         order.status === 'pending' ? 'Pendente' : 'Processando'}
                      </span>
                    </td>
                    <td className="py-3 text-right">R$ {order.total.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}