import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Order, OrderItem, Product } from "@shared/schema";

type OrderWithItems = {
  order: Order;
  items: (OrderItem & { product: Product })[];
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "pendente":
      return "bg-yellow-500";
    case "confirmado":
      return "bg-blue-500";
    case "preparo":
      return "bg-orange-500";
    case "entrega":
      return "bg-purple-500";
    case "concluido":
      return "bg-green-500";
    case "cancelado":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "pendente":
      return "Pendente";
    case "confirmado":
      return "Confirmado";
    case "preparo":
      return "Em preparo";
    case "entrega":
      return "Em entrega";
    case "concluido":
      return "Concluído";
    case "cancelado":
      return "Cancelado";
    default:
      return status;
  }
};

const OrdersList = () => {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    if (user && user.type !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Buscar pedidos
  const {
    data: orders,
    isLoading,
    error,
  } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    enabled: !!user && user.type === "admin",
  });
  
  // Mutation para atualizar status do pedido
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Status atualizado",
        description: "Status do pedido atualizado com sucesso",
      });
      setSelectedOrder(null);
      setIsDetailsOpen(false);
    },
    onError: (error) => {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do pedido",
        variant: "destructive",
      });
    },
  });
  
  // Função para buscar detalhes do pedido
  const fetchOrderDetails = async (orderId: number) => {
    const response = await fetch(`/api/orders/${orderId}`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error("Falha ao buscar detalhes do pedido");
    }
    
    return await response.json();
  };
  
  // Função para mostrar detalhes do pedido
  const handleViewDetails = async (orderId: number) => {
    try {
      const orderDetails = await fetchOrderDetails(orderId);
      setSelectedOrder(orderDetails);
      setNewStatus(orderDetails.order.status);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error("Erro ao buscar detalhes do pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do pedido",
        variant: "destructive",
      });
    }
  };
  
  // Atualizar status do pedido
  const handleUpdateStatus = () => {
    if (selectedOrder && newStatus) {
      updateOrderStatusMutation.mutate({
        id: selectedOrder.order.id,
        status: newStatus,
      });
    }
  };
  
  // Filtrar pedidos por status
  const getFilteredOrders = () => {
    if (!orders) return [];
    
    if (selectedTab === "all") {
      return orders;
    }
    
    return orders.filter(order => order.status === selectedTab);
  };
  
  // Formatação da data
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Pedidos</h1>
      
      <Tabs 
        defaultValue="all" 
        value={selectedTab} 
        onValueChange={setSelectedTab}
        className="mb-6"
      >
        <TabsList className="grid grid-cols-4 md:grid-cols-7 mb-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="confirmado">Confirmados</TabsTrigger>
          <TabsTrigger value="preparo">Em Preparo</TabsTrigger>
          <TabsTrigger value="entrega">Em Entrega</TabsTrigger>
          <TabsTrigger value="concluido">Concluídos</TabsTrigger>
          <TabsTrigger value="cancelado">Cancelados</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="spinner h-8 w-8 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p>Carregando pedidos...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p>Erro ao carregar pedidos. Por favor, tente novamente mais tarde.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-neutral-lightest rounded-lg">
          <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
          <p className="text-neutral">
            {selectedTab === "all" 
              ? "Não há pedidos registrados"
              : `Não há pedidos com status "${getStatusText(selectedTab)}"`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                  <Badge className={`${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </Badge>
                </div>
                <CardDescription>
                  {formatDate(order.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-neutral-dark">
                  <span className="font-medium">Cliente:</span> {order.userId}
                </p>
                <p className="text-sm text-neutral-dark mt-1">
                  <span className="font-medium">Endereço:</span> {order.address}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="font-semibold">{formatCurrency(order.total)}</p>
                <Button 
                  variant="outline" 
                  onClick={() => handleViewDetails(order.id)}
                >
                  Ver Detalhes
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal de detalhes do pedido */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.order.id}</DialogTitle>
            <DialogDescription>
              {selectedOrder && formatDate(selectedOrder.order.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium mb-1">Status</h4>
                  <Badge className={`${getStatusColor(selectedOrder.order.status)}`}>
                    {getStatusText(selectedOrder.order.status)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Select
                    value={newStatus}
                    onValueChange={setNewStatus}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Alterar status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Status do Pedido</SelectLabel>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="confirmado">Confirmado</SelectItem>
                        <SelectItem value="preparo">Em Preparo</SelectItem>
                        <SelectItem value="entrega">Em Entrega</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleUpdateStatus}
                    disabled={newStatus === selectedOrder.order.status || updateOrderStatusMutation.isPending}
                  >
                    {updateOrderStatusMutation.isPending ? "Atualizando..." : "Atualizar"}
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Cliente</h4>
                <p className="text-sm">ID: {selectedOrder.order.userId}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Endereço de entrega</h4>
                <p className="text-sm">{selectedOrder.order.address}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Itens do pedido</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b">
                      <div className="flex items-center">
                        {item.product.imageUrl && (
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name} 
                            className="w-12 h-12 object-cover rounded mr-3"
                          />
                        )}
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-neutral">
                            {item.quantity} x {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between mb-1">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.order.total - 5)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Taxa de entrega</span>
                  <span>{formatCurrency(5)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.order.total)}</span>
                </div>
              </div>
              
              <Separator />
              
              <DialogFooter>
                <Button onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersList;
