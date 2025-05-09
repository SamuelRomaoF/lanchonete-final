import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { 
  Activity, 
  ShoppingBag, 
  Truck, 
  Clock, 
  Package, 
  CreditCard 
} from "lucide-react";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface DashboardStats {
  totalOrders: number;
  totalSales: number;
  pendingOrders: number;
  productCount: number;
}

// Dados simulados para os gráficos
const salesData = [
  { name: "Segunda", vendas: 1200 },
  { name: "Terça", vendas: 1900 },
  { name: "Quarta", vendas: 1500 },
  { name: "Quinta", vendas: 2200 },
  { name: "Sexta", vendas: 2800 },
  { name: "Sábado", vendas: 3100 },
  { name: "Domingo", vendas: 2500 },
];

const pieData = [
  { name: "Hambúrgueres", value: 45 },
  { name: "Pizzas", value: 25 },
  { name: "Porções", value: 20 },
  { name: "Bebidas", value: 10 },
];

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const Dashboard = () => {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    if (user && user.type !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard'],
    enabled: !!user && user.type === "admin",
  });
  
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total de Vendas</p>
              <h3 className="text-2xl font-bold">
                {isLoading ? (
                  <span className="animate-pulse">--</span>
                ) : (
                  formatCurrency(stats?.totalSales || 0)
                )}
              </h3>
            </div>
            <div className="bg-primary/20 p-2 rounded-full">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pedidos</p>
              <h3 className="text-2xl font-bold">
                {isLoading ? (
                  <span className="animate-pulse">--</span>
                ) : (
                  stats?.totalOrders || 0
                )}
              </h3>
            </div>
            <div className="bg-primary/20 p-2 rounded-full">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pedidos Pendentes</p>
              <h3 className="text-2xl font-bold">
                {isLoading ? (
                  <span className="animate-pulse">--</span>
                ) : (
                  stats?.pendingOrders || 0
                )}
              </h3>
            </div>
            <div className="bg-orange-100 p-2 rounded-full">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Produtos</p>
              <h3 className="text-2xl font-bold">
                {isLoading ? (
                  <span className="animate-pulse">--</span>
                ) : (
                  stats?.productCount || 0
                )}
              </h3>
            </div>
            <div className="bg-secondary/20 p-2 rounded-full">
              <Package className="h-5 w-5 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="vendas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vendas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendas da Semana</CardTitle>
              <CardDescription>
                Análise de vendas dos últimos 7 dias
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${formatCurrency(value as number)}`, "Vendas"]} 
                  />
                  <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="produtos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Vendas por Categoria</CardTitle>
              <CardDescription>
                Porcentagem de vendas por categoria de produto
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "Porcentagem"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
