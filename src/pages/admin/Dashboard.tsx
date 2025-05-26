import { useEffect, useState } from 'react';
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
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../supabase/client';
import { useTheme } from '../../contexts/ThemeContext';

interface OrderSummary {
  id: number;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

interface DailySales {
  day: string;
  valor: number;
}

interface CategorySales {
  name: string;
  valor: number;
}

export default function Dashboard() {
  const { theme } = useTheme();
  const [totalSales, setTotalSales] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [salesData, setSalesData] = useState<DailySales[]>([]);
  const [categoryData, setCategoryData] = useState<CategorySales[]>([]);
  const [loading, setLoading] = useState(true);

  // Definir classes de acordo com o tema
  const cardBg = theme === 'dark' ? 'bg-[#2a211c]' : 'bg-white';
  const cardBorder = theme === 'dark' ? 'border-[#5a443c]' : 'border-gray-200';
  const iconBg = theme === 'dark' ? 'bg-[#5a443c]' : 'bg-gray-100';
  const buttonBg = theme === 'dark' 
    ? 'bg-[#46342e] hover:bg-[#5a443c]' 
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
  const textColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const headingColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  
  // Definindo cores para os gráficos
  const chartGridColor = theme === 'dark' ? '#5a443c' : '#e5e7eb';
  const chartAxisColor = theme === 'dark' ? '#9ca3af' : '#6b7280';

  async function fetchDashboardData() {
    setLoading(true);
    
    try {
      // 1. Buscar vendas totais
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('total');
        
      if (!ordersError && ordersData) {
        const total = ordersData.reduce((sum, order) => sum + (order.total || 0), 0);
        setTotalSales(total);
      }
      
      // 2. Buscar contagem de produtos
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
        
      if (!productsError) {
        setProductCount(productsCount || 0);
      }
      
      // 3. Buscar pedidos recentes
      const { data: recentOrdersData, error: recentOrdersError } = await supabase
        .from('orders')
        .select('id, customer_name, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (!recentOrdersError && recentOrdersData) {
        setRecentOrders(recentOrdersData);
      }
      
      // 4. Buscar vendas dos últimos 7 dias
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i);
        return {
          start: startOfDay(date).toISOString(),
          end: endOfDay(date).toISOString(),
          day: format(date, 'EEE', { locale: ptBR })
        };
      }).reverse();

      const dailySalesPromises = last7Days.map(async ({ start, end }) => {
        const { data, error } = await supabase
          .from('orders')
          .select('total')
          .gte('created_at', start)
          .lte('created_at', end);

        if (error) throw error;
        return data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      });

      const dailySalesValues = await Promise.all(dailySalesPromises);
      const dailySalesData = last7Days.map((day, index) => ({
        day: day.day,
        valor: dailySalesValues[index]
      }));

      setSalesData(dailySalesData);
      
      // 5. Buscar vendas por categoria
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');
        
      if (!categoriesError && categories) {
        const categorySalesPromises = categories.map(async (category) => {
          const { data: products } = await supabase
            .from('products')
            .select('id')
            .eq('category_id', category.id);

          if (!products) return { name: category.name, valor: 0 };

          const productIds = products.map(p => p.id);
          
          const { data: orderItems } = await supabase
            .from('order_items')
            .select('quantity, price')
            .in('product_id', productIds);

          const categoryTotal = orderItems?.reduce((sum, item) => 
            sum + (item.quantity * item.price), 0) || 0;

          return {
            name: category.name,
            valor: categoryTotal
          };
        });

        const categorySalesData = await Promise.all(categorySalesPromises);
        setCategoryData(categorySalesData);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refreshData = () => {
    fetchDashboardData();
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${headingColor}`}>Dashboard</h1>
        <button 
          onClick={refreshData}
          className={`flex items-center gap-2 ${buttonBg} px-3 py-1.5 rounded transition-colors`}
        >
          <RefreshCwIcon size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`card flex items-center gap-4 p-4 ${cardBg} rounded-lg border ${cardBorder}`}>
          <div className={`${iconBg} p-3 rounded`}>
            <DollarSignIcon className="text-[#e67e22]" />
          </div>
          <div>
            <h3 className={`text-sm ${textColor}`}>Vendas Totais</h3>
            <p className={`text-2xl font-bold ${headingColor}`}>R$ {totalSales.toFixed(2)}</p>
          </div>
        </div>
        <div className={`card flex items-center gap-4 p-4 ${cardBg} rounded-lg border ${cardBorder}`}>
          <div className={`${iconBg} p-3 rounded`}>
            <PackageIcon className="text-[#e67e22]" />
          </div>
          <div>
            <h3 className={`text-sm ${textColor}`}>Produtos</h3>
            <p className={`text-2xl font-bold ${headingColor}`}>{productCount}</p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`card p-4 ${cardBg} rounded-lg border ${cardBorder}`}>
          <h2 className={`text-lg font-semibold mb-4 ${headingColor}`}>Vendas dos Últimos 7 Dias</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={salesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis 
                  dataKey="day" 
                  stroke={chartAxisColor}
                />
                <YAxis 
                  stroke={chartAxisColor}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#2a211c' : 'white',
                    borderColor: theme === 'dark' ? '#5a443c' : '#e5e7eb',
                    color: theme === 'dark' ? 'white' : 'black'
                  }}
                  formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Vendas']}
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

        <div className={`card p-4 ${cardBg} rounded-lg border ${cardBorder}`}>
          <h2 className={`text-lg font-semibold mb-4 ${headingColor}`}>Vendas por Categoria</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis 
                  dataKey="name" 
                  stroke={chartAxisColor}
                />
                <YAxis 
                  stroke={chartAxisColor}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#2a211c' : 'white',
                    borderColor: theme === 'dark' ? '#5a443c' : '#e5e7eb',
                    color: theme === 'dark' ? 'white' : 'black'
                  }}
                  formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Vendas']}
                />
                <Bar 
                  dataKey="valor" 
                  fill="#e67e22" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pedidos Recentes */}
      <div className={`card p-4 ${cardBg} rounded-lg border ${cardBorder}`}>
        <h2 className={`text-lg font-semibold mb-4 ${headingColor}`}>Pedidos Recentes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${textColor} uppercase tracking-wider`}>Pedido</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${textColor} uppercase tracking-wider`}>Cliente</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${textColor} uppercase tracking-wider`}>Data</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${textColor} uppercase tracking-wider`}>Status</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${textColor} uppercase tracking-wider`}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {recentOrders.length > 0 ? (
                recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${headingColor}`}>#{order.id}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${headingColor}`}>{order.customer_name}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {order.status === 'completed' ? 'Concluído' :
                         order.status === 'pending' ? 'Pendente' : 'Processando'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${headingColor}`}>
                      R$ {order.total.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={`px-6 py-4 text-center text-sm ${textColor}`}>
                    {loading ? 'Carregando pedidos...' : 'Nenhum pedido encontrado'}
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