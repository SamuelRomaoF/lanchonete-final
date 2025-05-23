import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getOrders } from "@/lib/api";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Order } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Download, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const statusConfig: Record<string, {color: string, text: string}> = {
  recebido: { color: "bg-yellow-500", text: "Recebido" },
  em_preparo: { color: "bg-orange-500", text: "Em preparo" },
  pronto: { color: "bg-green-500", text: "Pronto" },
  entregue: { color: "bg-gray-500", text: "Entregue" },
  cancelado: { color: "bg-red-500", text: "Cancelado" }
};

const OrderHistory = () => {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    if (user && user.type !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Atualização automática a cada 15 segundos
  useEffect(() => {
    // Atualizar dados na primeira execução - forçar atualização imediata
    console.log("Forçando atualização inicial do histórico de pedidos...");
    refetch();
    
    // Configurar intervalo de atualização automática mais frequente
    const intervalId = setInterval(() => {
      console.log("Atualizando histórico de pedidos automaticamente...");
      refetch();
    }, 15000); // 15 segundos
    
    // Limpar intervalo quando componente for desmontado
    return () => clearInterval(intervalId);
  }, []);
  
  // Buscar pedidos do Supabase
  const { data: orders, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
    enabled: !!user && user.type === "admin",
  });
  
  // Filtrar pedidos
  const getFilteredOrders = () => {
    if (!orders) return [];
    
    return orders.filter(order => {
      // Filtro por status
      const matchesStatus = selectedTab === "all" || order.status === selectedTab;
      
      // Filtro por pesquisa (nome, email, telefone, ticket)
      const matchesSearch = searchTerm === "" || 
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer.email && order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customer.phone && order.customer.phone.includes(searchTerm)) ||
        (order.ticketNumber && order.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtro por data
      const matchesDate = dateFilter === "" || 
        new Date(order.created_at).toLocaleDateString() === dateFilter;
      
      return matchesStatus && matchesSearch && matchesDate;
    });
  };
  
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status || "recebido");
    setIsDetailsOpen(true);
  };
  
  const handleUpdateStatus = async () => {
    if (selectedOrder && newStatus) {
      try {
        await updateOrderStatus(selectedOrder.id.toString(), newStatus);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        
        toast({
          title: "Status atualizado",
          description: `Pedido ${selectedOrder.ticketNumber} atualizado para ${statusConfig[newStatus]?.text || newStatus}`,
        });
        
        setIsDetailsOpen(false);
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
        
        toast({
          title: "Erro na atualização",
          description: "Não foi possível atualizar o status do pedido",
          variant: "destructive",
        });
      }
    }
  };
  
  // Formatação da data completa
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Exportar pedidos para CSV
  const exportToCSV = () => {
    const filteredOrders = getFilteredOrders();
    
    if (filteredOrders.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há pedidos para exportar com os filtros atuais",
      });
      return;
    }
    
    // Construir cabeçalho do CSV
    const headers = ["ID", "Ticket", "Data", "Cliente", "Telefone", "Email", "Total", "Status", "Itens"];
    
    // Construir linhas do CSV
    const rows = filteredOrders.map(order => {
      const itemsText = order.items.map(item => 
        `${item.quantity}x ${item.name} (${formatCurrency(item.price)})`
      ).join("; ");
      
      return [
        order.id,
        order.ticketNumber || "-",
        formatDate(order.created_at),
        order.customer.name,
        order.customer.phone || "-",
        order.customer.email || "-",
        formatCurrency(order.totalAmount),
        statusConfig[order.status || "recebido"]?.text || order.status,
        itemsText
      ];
    });
    
    // Juntar tudo em um CSV
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pedidos_${new Date().toISOString().split("T")[0]}.csv`);
    link.click();
    
    toast({
      title: "Exportação concluída",
      description: `${filteredOrders.length} pedidos exportados com sucesso`,
    });
  };
  
  const filteredOrders = getFilteredOrders();
  
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Histórico de Pedidos</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => {
            console.log("Atualizando manualmente os pedidos...");
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            refetch();
            toast({
              title: "Atualizado",
              description: "Os dados foram atualizados com sucesso",
            });
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, email, telefone ou ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-36"
              />
            </div>
          </div>
          
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="all" className="flex-1">Todos ({orders?.length || 0})</TabsTrigger>
              <TabsTrigger value="recebido" className="flex-1">Recebido</TabsTrigger>
              <TabsTrigger value="em_preparo" className="flex-1">Em Preparo</TabsTrigger>
              <TabsTrigger value="pronto" className="flex-1">Pronto</TabsTrigger>
              <TabsTrigger value="entregue" className="flex-1">Entregue</TabsTrigger>
              <TabsTrigger value="cancelado" className="flex-1">Cancelado</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {isLoading ? (
            <div className="text-center py-8">
              <p>Carregando pedidos...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <p className="text-red-500">Erro ao carregar pedidos. Por favor, tente novamente.</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-2">
                Tentar novamente
              </Button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p>Nenhum pedido encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.ticketNumber || "-"}
                    </TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{order.customer.name}</div>
                      <div className="text-xs text-muted-foreground">{order.customer.phone}</div>
                    </TableCell>
                    <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {order.items.map(item => `${item.quantity}x ${item.name}`).join(", ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`${statusConfig[order.status || "recebido"]?.color || "bg-gray-500"} text-white`}
                      >
                        {statusConfig[order.status || "recebido"]?.text || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewDetails(order)}
                      >
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog de detalhes do pedido */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Informações do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ticket:</span>
                        <span className="font-medium">{selectedOrder.ticketNumber || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data:</span>
                        <span>{formatDate(selectedOrder.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-bold">{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status:</span>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recebido">Recebido</SelectItem>
                            <SelectItem value="em_preparo">Em Preparo</SelectItem>
                            <SelectItem value="pronto">Pronto</SelectItem>
                            <SelectItem value="entregue">Entregue</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newStatus !== selectedOrder.status && (
                        <Button 
                          className="w-full mt-2" 
                          onClick={handleUpdateStatus}
                        >
                          Atualizar Status
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Cliente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nome:</span>
                        <span>{selectedOrder.customer.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telefone:</span>
                        <span>{selectedOrder.customer.phone || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{selectedOrder.customer.email || "-"}</span>
                      </div>
                      {selectedOrder.customer.address && (
                        <div>
                          <span className="text-muted-foreground block">Endereço:</span>
                          <span className="block mt-1">{selectedOrder.customer.address}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Método:</span>
                        <span>{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={selectedOrder.paymentStatus === "paid" ? "bg-green-500" : "bg-yellow-500"}>
                          {selectedOrder.paymentStatus === "paid" ? "Pago" : "Pendente"}
                        </Badge>
                      </div>
                      {selectedOrder.paymentStatus === "paid" && selectedOrder.paymentDetails?.paidAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Data de Pagamento:</span>
                          <span>{new Date(selectedOrder.paymentDetails.paidAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Valor Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.quantity}x</TableCell>
                          <TableCell>
                            <div>{item.name}</div>
                            {item.notes && (
                              <div className="text-xs text-muted-foreground">{item.notes}</div>
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.price * item.quantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-end">
                    <div className="w-1/3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold">{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {selectedOrder.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderHistory; 