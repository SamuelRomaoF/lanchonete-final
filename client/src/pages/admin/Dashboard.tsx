import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import FileSaver from 'file-saver';
import { AlertCircle, CreditCard, Download, FileSpreadsheet, Package, Upload } from "lucide-react";
import Papa from 'papaparse';
import { useEffect, useMemo, useState } from "react";
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
import * as XLSX from 'xlsx';

interface DashboardStats {
  totalSales: number;
  productCount: number;
}

interface SalesDataItem {
  name: string;
  vendas: number;
  lucro?: number;
  quantidade?: number;
  categoria?: string;
}

interface PieDataItem {
  name: string;
  value: number;
}

// Dados simulados para os gráficos
const defaultSalesData: SalesDataItem[] = [];

const defaultPieData: PieDataItem[] = [];

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const Dashboard = () => {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [salesData, setSalesData] = useState<SalesDataItem[]>(defaultSalesData);
  const [pieData, setPieData] = useState<PieDataItem[]>(defaultPieData);
  const [showImportTips, setShowImportTips] = useState(true);
  const [importType, setImportType] = useState<'sales' | 'products'>('sales');
  
  // Estado local para estatísticas do dashboard
  const [localStats, setLocalStats] = useState<DashboardStats>({
    totalSales: 0,
    productCount: 0
  });
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    if (user && user.type !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Consulta às estatísticas da API
  const { data: apiStats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard'],
    enabled: !!user && user.type === "admin",
  });
  
  // Atualizar stats locais quando os dados da API chegarem
  useEffect(() => {
    if (apiStats && !localStats.totalSales) {
      setLocalStats(apiStats);
    }
  }, [apiStats, localStats.totalSales]);
  
  // Combinar estatísticas da API com as locais
  const stats = useMemo(() => {
    return {
      totalSales: localStats.totalSales,
      productCount: localStats.productCount
    };
  }, [localStats]);
  
  // Função para exportar dados
  const handleExportData = (dataType: 'sales' | 'products') => {
    const data = dataType === 'sales' ? salesData : pieData;
    const fileName = dataType === 'sales' ? 'vendas_semanais.xlsx' : 'vendas_por_categoria.xlsx';
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, dataType === 'sales' ? 'Vendas' : 'Categorias');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    
    FileSaver.saveAs(dataBlob, fileName);
    
    toast({
      title: "Dados exportados com sucesso",
      description: `O arquivo ${fileName} foi baixado.`,
    });
  };
  
  // Função para importar dados de Excel/CSV
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'sales' | 'products') => {
    setImportType(type);
    
    const file = event.target.files?.[0];
    if (!file) return;
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          processImportedData(results.data, type);
        },
        error: () => {
          toast({
            title: "Erro ao importar arquivo",
            description: "O formato do arquivo CSV é inválido.",
            variant: "destructive",
          });
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          processImportedData(jsonData, type);
        } catch (error) {
          toast({
            title: "Erro ao importar arquivo",
            description: "O formato do arquivo Excel é inválido.",
            variant: "destructive",
          });
        }
      };
      reader.readAsBinaryString(file);
    } else {
      toast({
        title: "Formato de arquivo não suportado",
        description: "Por favor, use arquivos .xlsx, .xls ou .csv",
        variant: "destructive",
      });
    }
    
    // Limpar o valor do input para permitir selecionar o mesmo arquivo novamente
    event.target.value = "";
  };
  
  const processImportedData = (data: any[], type: 'sales' | 'products') => {
    if (data.length === 0) {
      toast({
        title: "Arquivo vazio",
        description: "O arquivo importado não contém dados.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (type === 'sales') {
        // Validar estrutura dos dados de vendas
        const validData = data.filter(item => 
          item.name && (item.vendas !== undefined || item.valor !== undefined)
        ).map(item => ({
          name: String(item.name || item.dia || item.data || ''),
          vendas: Number(item.vendas || item.valor || 0),
          lucro: Number(item.lucro || item.profit || 0),
          quantidade: Number(item.quantidade || item.quantity || 0),
          categoria: String(item.categoria || item.category || '')
        }));
        
        if (validData.length === 0) {
          setShowImportTips(true);
          throw new Error("Formato dos dados inválido");
        }
        
        setSalesData(validData);
        
        // Calcular o total de vendas para atualizar as estatísticas
        const totalVendas = validData.reduce((sum, item) => sum + item.vendas, 0);
        
        // Atualizar as estatísticas locais
        setLocalStats(prev => ({
          ...prev,
          totalSales: totalVendas
        }));
        
        // Gerar dados para o gráfico de pizza com base nas categorias dos dados de vendas
        if (validData.some(item => item.categoria)) {
          // Agrupar vendas por categoria
          const categoriaMap = new Map<string, number>();
          
          validData.forEach(item => {
            if (item.categoria) {
              const categoria = item.categoria;
              const valorVenda = item.vendas;
              
              if (categoriaMap.has(categoria)) {
                categoriaMap.set(categoria, categoriaMap.get(categoria)! + valorVenda);
              } else {
                categoriaMap.set(categoria, valorVenda);
              }
            }
          });
          
          // Converter para o formato adequado para o gráfico de pizza
          if (categoriaMap.size > 0) {
            const pieChartData = Array.from(categoriaMap.entries()).map(([name, value]) => ({
              name,
              value: Math.round((value / validData.reduce((sum, item) => sum + item.vendas, 0)) * 100)
            }));
            
            setPieData(pieChartData);
            
            // Atualizar contagem de produtos com base nas categorias
            setLocalStats(prev => ({
              ...prev,
              productCount: categoriaMap.size
            }));
            
            toast({
              title: "Dados importados com sucesso",
              description: `${validData.length} registros de vendas foram carregados e o gráfico de categorias foi atualizado automaticamente.`,
            });
          } else {
            toast({
              title: "Dados importados com sucesso",
              description: `${validData.length} registros de vendas foram carregados.`,
            });
          }
        } else {
          toast({
            title: "Dados importados com sucesso",
            description: `${validData.length} registros de vendas foram carregados.`,
          });
        }
      } else {
        // Validar estrutura dos dados de categorias
        const validData = data.filter(item => 
          item.name && (item.value !== undefined || item.valor !== undefined || item.quantidade !== undefined)
        ).map(item => ({
          name: String(item.name || item.categoria || item.category || ''),
          value: Number(item.value || item.valor || item.quantidade || 0)
        }));
        
        if (validData.length === 0) {
          setShowImportTips(true);
          throw new Error("Formato dos dados inválido");
        }
        
        setPieData(validData);
        
        // Atualizar contagem de produtos com base nas categorias importadas
        setLocalStats(prev => ({
          ...prev,
          productCount: validData.length
        }));
        
        toast({
          title: "Dados importados com sucesso",
          description: `${validData.length} registros de categorias foram carregados.`,
        });
      }
      
      setShowImportTips(false);
    } catch (error) {
      toast({
        title: "Erro ao processar dados",
        description: "Verifique o formato dos dados e tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  // Exemplo de modelo para download
  const downloadTemplate = (type: 'sales' | 'products') => {
    let data;
    let fileName;
    
    if (type === 'sales') {
      data = [
        { name: 'Segunda', vendas: 0, lucro: 0, quantidade: 0, categoria: 'Hambúrgueres' },
        { name: 'Terça', vendas: 0, lucro: 0, quantidade: 0, categoria: 'Pizzas' },
        { name: 'Quarta', vendas: 0, lucro: 0, quantidade: 0, categoria: 'Bebidas' }
      ];
      fileName = 'modelo_vendas.xlsx';
    } else {
      data = [
        { name: 'Hambúrgueres', value: 0 },
        { name: 'Pizzas', value: 0 },
        { name: 'Bebidas', value: 0 }
      ];
      fileName = 'modelo_categorias.xlsx';
    }
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    
    FileSaver.saveAs(dataBlob, fileName);
  };
  
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
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setLocalStats({
              totalSales: 0,
              productCount: 0
            });
            setSalesData([]);
            setPieData([]);
            toast({
              title: "Dashboard zerado",
              description: "Todos os dados foram redefinidos para zero."
            });
          }}
        >
          Zerar Dashboard
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 mb-8">
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
      
      {showImportTips && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dica para importação</AlertTitle>
          <AlertDescription>
            {importType === 'sales' 
              ? "Para importar dados de vendas, certifique-se que sua planilha contenha colunas como 'name' (dia da semana), 'vendas' (valor de vendas) e 'categoria' (categoria do produto). A coluna 'categoria' permitirá preencher automaticamente o gráfico de pizza."
              : "Para importar dados de categorias, certifique-se que sua planilha contenha colunas como 'name' (nome da categoria) e 'value' (valor ou percentual)."}
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal" 
              onClick={() => downloadTemplate(importType)}
            >
              Baixar modelo de planilha
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="vendas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vendas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vendas da Semana</CardTitle>
                <CardDescription>
                  Análise de vendas dos últimos 7 dias
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleExportData('sales')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => document.getElementById('salesFileInput')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </Button>
                <Input 
                  id="salesFileInput" 
                  type="file" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'sales')}
                />
              </div>
            </CardHeader>
            <CardContent className="h-80">
              {salesData.length > 0 ? (
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
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => {
                        const formattedValue = name === 'quantidade' ? value : formatCurrency(value);
                        const label = name === 'vendas' ? 'Vendas' : 
                                      name === 'lucro' ? 'Lucro' : 
                                      name === 'quantidade' ? 'Quantidade' : name;
                        return [formattedValue, label];
                      }} 
                    />
                    <Legend 
                      formatter={(value) => {
                        return value === 'vendas' ? 'Vendas' : 
                               value === 'lucro' ? 'Lucro' : 
                               value === 'quantidade' ? 'Quantidade' : value;
                      }}
                    />
                    <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    {salesData[0]?.lucro !== undefined && (
                      <Bar dataKey="lucro" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    )}
                    {salesData[0]?.quantidade !== undefined && (
                      <Bar dataKey="quantidade" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <FileSpreadsheet className="mb-2 h-10 w-10" />
                  <p>Nenhum dado disponível</p>
                  <p className="text-sm mt-2">Importe dados clicando no botão "Importar" acima</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t p-4">
              <div className="text-xs text-muted-foreground">
                <FileSpreadsheet className="inline mr-1 h-3 w-3" />
                <span>Importe dados de planilhas Excel (.xlsx) ou CSV para personalizar este gráfico.</span>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="produtos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Distribuição de Vendas por Categoria</CardTitle>
                <CardDescription>
                  Porcentagem de vendas por categoria de produto
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleExportData('products')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => document.getElementById('productsFileInput')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </Button>
                <Input 
                  id="productsFileInput" 
                  type="file" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'products')}
                />
              </div>
            </CardHeader>
            <CardContent className="h-80">
              {pieData.length > 0 ? (
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
                    <RechartsTooltip formatter={(value: number) => [`${value}%`, "Porcentagem"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <FileSpreadsheet className="mb-2 h-10 w-10" />
                  <p>Nenhum dado disponível</p>
                  <p className="text-sm mt-2">Importe dados clicando no botão "Importar" acima</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t p-4">
              <div className="text-xs text-muted-foreground">
                <FileSpreadsheet className="inline mr-1 h-3 w-3" />
                <span>Importe dados de planilhas Excel (.xlsx) ou CSV para personalizar este gráfico.</span>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
