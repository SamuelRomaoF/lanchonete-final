import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
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

const OrderHistory = () => {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  
  // Buscar pedidos do usuário
  const {
    data: orders,
    isLoading,
    error,
  } = useQuery<Order[]>({
    queryKey: user ? [`/api/users/${user.id}/orders`] : null,
    enabled: !!user,
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
    } catch (error) {
      console.error("Erro ao buscar detalhes do pedido:", error);
    }
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
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Histórico de Pedidos</h1>
        <p className="mb-4">Você precisa estar logado para ver seu histórico de pedidos.</p>
        <Button>Fazer Login</Button>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Histórico de Pedidos</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Erro ao carregar pedidos. Por favor, tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Histórico de Pedidos</h1>
      
      {isLoading ? (
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-9 w-32" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="grid gap-6">
          {orders.map((order) => (
            <Card key={order.id}>
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
                  <span className="font-medium">Endereço de entrega:</span> {order.address}
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
      ) : (
        <div className="text-center py-12 bg-neutral-lightest rounded-lg">
          <i className="ri-shopping-basket-line text-4xl text-neutral mb-2"></i>
          <h3 className="text-lg font-medium mb-2">Você ainda não fez nenhum pedido</h3>
          <p className="text-neutral mb-6">Que tal experimentar nossos deliciosos lanches?</p>
          <Button asChild className="bg-primary hover:bg-primary-dark">
            <a href="/produtos">Ver Cardápio</a>
          </Button>
        </div>
      )}
      
      {/* Modal de detalhes do pedido */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.order.id}</DialogTitle>
            <DialogDescription>
              {selectedOrder && formatDate(selectedOrder.order.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Status</h4>
                <Badge className={`${getStatusColor(selectedOrder.order.status)}`}>
                  {getStatusText(selectedOrder.order.status)}
                </Badge>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderHistory;
