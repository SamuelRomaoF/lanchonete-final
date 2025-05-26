import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { clearSystemData, getDashboardStats, getOrders, getProducts, syncQueueWithLocalStorage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Receipt, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    XAxis,
    YAxis
} from "recharts";
import { useLocation } from "wouter";

interface DashboardStats {
  totalSales: number;
  productCount: number;
}

interface SalesDataItem {
  name: string;
  vendas: number;
}

interface PieDataItem {
  name: string;
  value: number;
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const Dashboard = () => {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    if (user && user.type !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Função para atualizar todos os dados
  const refetchAll = async () => {
    try {
      console.log("Iniciando sincronização de dados...");
      
      // Primeiro, sincronizar dados da fila com localStorage
      await syncQueueWithLocalStorage();
      
      // Em seguida, invalidar as queries para forçar a busca de dados atualizados
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      // Por fim, refetch manual de cada query
      await refetchStats();
      await refetchProducts();
      await refetchOrders();
      
      console.log("Sincronização completa!");
    } catch (error) {
      console.error("Erro na sincronização de dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  // Buscar estatísticas do dashboard
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    enabled: !!user && user.type === "admin",
  });
  
  // Buscar produtos
  const { data: products, isLoading: isLoadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    enabled: !!user && user.type === "admin",
  });
  
  // Buscar pedidos
  const { data: orders, isLoading: isLoadingOrders, refetch: refetchOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    enabled: !!user && user.type === "admin",
  });
  
  // Implementar atualização automática a cada 15 segundos (mais frequente)
  useEffect(() => {
    // Variável para controlar se uma sincronização já está em andamento
    let isSyncing = false;
    
    // Função para sincronizar com verificação de controle
    const syncData = async () => {
      if (isSyncing) {
        console.log("Sincronização já em andamento, ignorando chamada");
        return;
      }
      
      try {
        isSyncing = true;
        console.log("Atualizando dados do dashboard automaticamente...");
        await refetchAll();
      } catch (error) {
        console.error("Erro na sincronização automática:", error);
      } finally {
        isSyncing = false;
      }
    };
    
    // Forçar atualização imediata ao montar o componente
    console.log("Forçando atualização inicial dos dados do dashboard...");
    syncData();
    
    // Configurar intervalo de atualização automática mais frequente (15 segundos)
    const intervalId = setInterval(() => {
      if (user?.type === "admin") {
        syncData();
      }
    }, 15000); // 15 segundos
    
    // Limpar intervalo quando componente for desmontado
    return () => clearInterval(intervalId);
  }, [user]); // Usar apenas o user como dependência para evitar ciclos
  
  // Processar dados para o gráfico de vendas por dia
  const salesData = useMemo(() => {
    if (!orders) return [];
    
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(now.getDate() - i);
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    }).reverse();
    
    // Mapear dias da semana para valores mais curtos
    const dayMap: Record<string, string> = {
      'dom.': 'Dom',
      'seg.': 'Seg',
      'ter.': 'Ter',
      'qua.': 'Qua',
      'qui.': 'Qui',
      'sex.': 'Sex',
      'sáb.': 'Sab',
    };
    
    // Calcular vendas por dia
    const salesByDay = last7Days.map(day => {
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.toLocaleDateString('pt-BR', { weekday: 'short' }) === day;
      });
      
      const totalSales = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      return {
        name: dayMap[day] || day,
        vendas: totalSales
      };
    });
    
    return salesByDay;
  }, [orders]);
  
  // Processar dados para o gráfico de vendas por categoria
  const pieData = useMemo(() => {
    if (!orders) return [];
    
    // Agrupar produtos por categoria
    const categoryMap = new Map<string, number>();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        // Tentar encontrar a categoria correspondente ao produto
        const product = products?.find(p => p.name === item.name);
        
        if (product) {
          const category = products?.find(p => p.id === product.categoryId)?.name || "Outros";
          
          const amount = item.price * item.quantity;
          if (categoryMap.has(category)) {
            categoryMap.set(category, categoryMap.get(category)! + amount);
          } else {
            categoryMap.set(category, amount);
          }
        }
      });
    });
    
    // Converter para o formato do gráfico de pizza
    const totalSales = Array.from(categoryMap.values()).reduce((sum, value) => sum + value, 0);
    
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round((value / totalSales) * 100)
      }))
      .sort((a, b) => b.value - a.value); // Ordenar do maior para o menor
  }, [orders, products]);
  
  // Calcular total de vendas
  const totalSales = useMemo(() => {
    if (!orders) return 0;
    return orders.reduce((sum, order) => sum + order.totalAmount, 0);
  }, [orders]);
  
  // Obter pedidos recentes (últimos 5)
  const recentOrders = useMemo(() => {
    if (!orders) return [];
    
    return [...orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [orders]);
  
  if (!user || user.type !== "admin") {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
        <p>Esta área é restrita a administradores.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => {
              console.log("Atualizando dados manualmente via botão...");
              refetchAll();
              toast({
                title: "Atualizado",
                description: "Os dados foram atualizados com sucesso",
              });
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          
          <Button 
            variant="destructive"
            size="icon"
            onClick={async () => {
              // Verificação dupla para evitar exclusões acidentais
              const confirmation = window.confirm(
                "ATENÇÃO: Essa ação irá limpar todo o histórico de pedidos. Deseja continuar?"
              );
              
              if (!confirmation) return;
              
              try {
                await clearSystemData();
                
                // Invalidar todas as queries para forçar a recarga de dados
                queryClient.invalidateQueries({ queryKey: ['orders'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                
                // Atualizar todos os dados
                await refetchAll();
                
                toast({
                  title: "Dados Limpos",
                  description: "O histórico de pedidos foi limpo com sucesso",
                });
              } catch (error) {
                console.error("Erro ao limpar dados:", error);
                toast({
                  title: "Erro",
                  description: "Não foi possível limpar os dados. Tente novamente.",
                  variant: "destructive",
                });
              }
            }}
            title="Limpar histórico de pedidos"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Vendas Totais */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Receipt className="mr-2 h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {isLoadingOrders ? "..." : formatCurrency(totalSales)}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Produtos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="mr-2 h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {isLoadingProducts ? "..." : products?.length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
        {/* Total de Vendas */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Total de Vendas</CardTitle>
                <CardDescription>R$ {totalSales.toFixed(2)}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-80 px-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value: number) => [`${formatCurrency(value)}`, 'Vendas']}
                  />
                  <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Distribuição de Categorias */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
            <CardDescription>Distribuição de vendas</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-80 px-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => [`${value}%`, 'Porcentagem']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Pedidos Recentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pedidos Recentes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingOrders ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Carregando...</TableCell>
                </TableRow>
              ) : recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Nenhum pedido encontrado</TableCell>
                </TableRow>
              ) : (
                recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.ticketNumber || `#${order.id}`}</TableCell>
                    <TableCell>{order.customer.name}</TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${order.status === 'recebido' ? 'bg-yellow-100 text-yellow-800' : 
                          order.status === 'em_preparo' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'pronto' ? 'bg-green-100 text-green-800' :
                          order.status === 'entregue' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'}`}
                      >
                        {order.status === 'recebido' ? 'Recebido' :
                         order.status === 'em_preparo' ? 'Em Preparo' :
                         order.status === 'pronto' ? 'Pronto' :
                         order.status === 'entregue' ? 'Entregue' : 'Cancelado'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(order.totalAmount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
