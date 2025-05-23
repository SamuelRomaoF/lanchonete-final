import { ProductCard } from "@/components/ProductCard";
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
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { OrderTicket, useOrderQueue } from "@/context/OrderQueueContext";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const statusConfig: Record<string, {color: string, text: string}> = {
  recebido: { color: "bg-slate-200 dark:bg-slate-700", text: "Recebido" },
  em_preparo: { color: "bg-orange-500", text: "Em preparo" },
  pronto: { color: "bg-green-500", text: "Pronto para retirada" },
  entregue: { color: "bg-gray-500", text: "Entregue" }
};

const OrderHistory = () => {
  const { getOrderHistory, clearOrderHistory } = useOrderQueue();
  const [selectedOrder, setSelectedOrder] = useState<OrderTicket | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const { addItem } = useCart();
  const [, setLocation] = useLocation();
  
  // Obter o histórico de pedidos do localStorage
  const orderHistory = getOrderHistory();
  
  // Log para depuração
  useEffect(() => {
    console.log("Histórico de pedidos:", orderHistory);
    console.log("localStorage:", localStorage.getItem('orderHistory'));
  }, [orderHistory]);
  
  // Função para mostrar detalhes do pedido
  const handleViewDetails = (order: OrderTicket) => {
    setSelectedOrder(order);
  };
  
  // Formatação da data
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleClearHistory = () => {
    clearOrderHistory();
    setConfirmClearOpen(false);
  };
  
  // Função para adicionar os itens de um pedido ao carrinho e redirecionar
  const handleOrderAgain = (order: OrderTicket) => {
    // Para cada item do pedido, adicioná-lo ao carrinho
    order.items.forEach(item => {
      // Convertemos para o formato esperado pelo carrinho
      const product = {
        id: String(item.id), // Convertendo para string
        name: item.name,
        price: item.price,
        // Adicionando propriedades obrigatórias para o tipo Product
        isFeatured: false,
        isPromotion: false,
        categoryId: "1", // Valor padrão
        available: true,
        // Propriedades opcionais
        description: item.notes || "",
        imageUrl: item.imageUrl || ""
      };
      
      addItem(product, item.quantity);
    });
    
    // Redirecionar para a página de carrinho
    setLocation("/carrinho");
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Histórico de Pedidos</h1>
        
        {orderHistory.length > 0 && (
          <Button 
            variant="outline" 
            onClick={() => setConfirmClearOpen(true)}
            className="text-sm"
          >
            Limpar Histórico
          </Button>
        )}
      </div>
      
      {orderHistory.length === 0 ? (
        <div className="text-center py-12 bg-neutral-lightest rounded-lg">
          <i className="ri-shopping-basket-line text-4xl text-neutral mb-2"></i>
          <h3 className="text-lg font-medium mb-2">Você ainda não fez nenhum pedido</h3>
          <p className="text-neutral mb-6">Que tal experimentar nossos deliciosos lanches?</p>
          <Button asChild className="bg-primary hover:bg-primary-dark">
            <a href="/produtos">Ver Cardápio</a>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {orderHistory.map((order) => (
            <Card key={order.id} className={`hover:shadow-md transition-shadow border-l-4 ${statusConfig[order.status]?.color || "bg-gray-500"}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Senha {order.ticket}</CardTitle>
                  <Badge className={`${statusConfig[order.status]?.color || "bg-gray-500"}`}>
                    {statusConfig[order.status]?.text || "Desconhecido"}
                  </Badge>
                </div>
                <CardDescription>
                  {formatDate(new Date(order.createdAt))}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-neutral-dark mb-2">
                  <span className="font-medium">Itens: </span> 
                  {order.items.length} {order.items.length === 1 ? 'produto' : 'produtos'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {order.items.slice(0, 3).map((item) => (
                    <ProductCard
                      key={item.id}
                      product={{
                        ...item,
                        description: item.notes || "",
                        imageUrl: item.imageUrl || ""
                      }}
                    />
                  ))}
                  {order.items.length > 3 && (
                    <Badge variant="outline">
                      +{order.items.length - 3} mais
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="font-semibold">{formatCurrency(order.total)}</p>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary"
                    onClick={() => handleOrderAgain(order)}
                    className="text-sm"
                  >
                    <i className="ri-refresh-line mr-1"></i>
                    Pedir novamente
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewDetails(order)}
                    className="text-sm"
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal de detalhes do pedido */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Senha {selectedOrder?.ticket}</span>
              {selectedOrder && (
                <Badge className={`${statusConfig[selectedOrder.status]?.color || "bg-gray-500"}`}>
                  {statusConfig[selectedOrder.status]?.text || "Desconhecido"}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && formatDate(new Date(selectedOrder.createdAt))}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Cliente</h4>
                <p className="text-sm">{selectedOrder.customerName || "Cliente não identificado"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Itens do pedido</h4>
                <ul className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm py-2 border-b">
                      <div>
                        <p>{item.name}</p>
                        {item.notes && <p className="text-xs text-neutral">{item.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p>{item.quantity} x {formatCurrency(item.price)}</p>
                        <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Separator />
              
              <div className="pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button onClick={() => setSelectedOrder(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de confirmação para limpar histórico */}
      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Limpar histórico de pedidos?</DialogTitle>
            <DialogDescription>
              Essa ação irá remover todos os seus pedidos do histórico. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="sm:justify-between mt-4">
            <Button variant="outline" onClick={() => setConfirmClearOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClearHistory}>
              Sim, limpar histórico
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderHistory;
