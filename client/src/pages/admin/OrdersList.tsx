import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { OrderStatus, OrderTicket, useOrderQueue } from "@/context/OrderQueueContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const statusConfig: Record<OrderStatus, {color: string, text: string}> = {
  recebido: { color: "bg-yellow-500", text: "Recebido" },
  em_preparo: { color: "bg-orange-500", text: "Em preparo" },
  pronto: { color: "bg-green-500", text: "Pronto" },
  entregue: { color: "bg-gray-500", text: "Entregue" }
};

const OrdersList = () => {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderTicket | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>("recebido");
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevOrdersCountRef = useRef<number>(0);
  
  const { 
    orders, 
    updateOrderStatus, 
    resetQueue, 
    clearCompletedOrders,
    getActiveOrders,
    getTodayOrders,
    syncWithServer,
    setOrders
  } = useOrderQueue();
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    if (user && user.type !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Efeito para tocar som quando chegar um novo pedido
  useEffect(() => {
    const activeOrders = orders.filter(o => o.status === "recebido");
    
    if (soundEnabled && activeOrders.length > prevOrdersCountRef.current) {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.error("Erro ao tocar som:", e));
      }
    }
    
    prevOrdersCountRef.current = activeOrders.length;
  }, [orders, soundEnabled]);

  // Função para mostrar detalhes do pedido
  const handleViewDetails = (order: OrderTicket) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsDetailsOpen(true);
  };
  
  // Atualizar status do pedido
  const handleUpdateStatus = async () => {
    if (selectedOrder && newStatus) {
      try {
        console.log(`Atualizando pedido ${selectedOrder.id} para status: ${newStatus}`);
        
        // Atualizar o status localmente
        updateOrderStatus(selectedOrder.id, newStatus);
        setIsDetailsOpen(false);
        
        // Forçar sincronização com o servidor
        await syncWithServer();
        
        toast({
          title: "Status atualizado",
          description: `Pedido ${selectedOrder.ticket} atualizado para ${statusConfig[newStatus].text}`,
        });
        
        console.log("Atualização de status concluída e sincronizada com o servidor");
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
  
  // Filtrar pedidos por status
  const getFilteredOrders = () => {
    if (selectedTab === "all") {
      return getTodayOrders();
    }
    
    return orders.filter(order => order.status === selectedTab);
  };
  
  // Formatação da data
  const formatDate = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const filteredOrders = getFilteredOrders();
  const activeOrdersCount = orders.filter(o => o.status === "recebido").length;
  const pendingOrdersCount = orders.filter(o => o.status !== "entregue").length;
  
  const handleResetQueue = () => {
    resetQueue();
    setConfirmResetOpen(false);
    
    toast({
      title: "Sistema reiniciado",
      description: "Sistema de senhas foi reiniciado com sucesso",
    });
  };
  
  const handleClearCompleted = () => {
    clearCompletedOrders();
    
    toast({
      title: "Pedidos limpos",
      description: "Pedidos concluídos foram removidos",
    });
  };
  
  // Atualizar periodicamente para verificar novos pedidos
  useEffect(() => {
    // Função para forçar uma atualização dos pedidos
    const forceRefresh = async () => {
      try {
        console.log("Forçando atualização de pedidos do servidor...");
        
        // Buscar dados diretamente do servidor
        const response = await fetch('/api/queue');
        if (!response.ok) {
          throw new Error('Erro ao buscar pedidos do servidor');
        }
        
        const serverData = await response.json();
        console.log("Dados recebidos do servidor:", serverData);
        
        // Se houver pedidos no servidor, atualizar localmente
        if (serverData.orders && Array.isArray(serverData.orders)) {
          // Converter as datas para objetos Date
          const processedOrders = serverData.orders.map((order: any) => ({
            ...order,
            createdAt: new Date(order.createdAt)
          }));
          
          // Atualizar os pedidos localmente
          console.log("Atualizando pedidos com dados do servidor:", processedOrders);
          
          // Atualizar o estado local com os pedidos do servidor
          if (processedOrders.length > 0) {
            setOrders(processedOrders);
          }
        }
      } catch (error) {
        console.error("Erro ao forçar atualização de pedidos:", error);
      }
    };
    
    // Executar imediatamente ao carregar o componente
    forceRefresh();
    
    // Configurar intervalo para atualização a cada 5 segundos
    const intervalId = setInterval(() => {
      forceRefresh();
    }, 5000);
    
    // Limpar o intervalo ao desmontar
    return () => clearInterval(intervalId);
  }, []); // Sem dependências para evitar recriação do efeito
  
  // Função de sincronização manual
  const manualSync = async () => {
    try {
      toast({
        title: "Atualizando...",
        description: "Buscando novos pedidos do servidor",
      });
      
      await syncWithServer();
      
      toast({
        title: "Dados atualizados",
        description: "Os pedidos foram sincronizados com o servidor",
      });
    } catch (error) {
      console.error("Erro na sincronização manual:", error);
      toast({
        title: "Erro na atualização",
        description: "Não foi possível sincronizar com o servidor",
        variant: "destructive",
      });
    }
  };
  
  // Log para depuração
  useEffect(() => {
    console.log("Pedidos no dashboard:", orders);
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
      {/* Audio para notificação */}
      <audio ref={audioRef} preload="auto">
        <source src="https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=notification-sound-7062.mp3" type="audio/mp3" />
      </audio>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Senhas</h1>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
              id="sound-toggle"
            />
            <label htmlFor="sound-toggle" className="text-sm">
              Som de notificação
            </label>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={manualSync}
          >
            <i className="ri-refresh-line mr-1"></i> Atualizar
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-lg flex justify-between">
              <span>Senhas Novas</span>
              <Badge variant="outline" className="bg-yellow-100">{activeOrdersCount}</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-lg flex justify-between">
              <span>Senhas Pendentes</span>
              <Badge variant="outline" className="bg-blue-100">{pendingOrdersCount}</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-lg flex justify-between">
              <span>Total Hoje</span>
              <Badge variant="outline" className="bg-gray-100">{getTodayOrders().length}</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <Tabs 
          defaultValue="all" 
          value={selectedTab} 
          onValueChange={(value) => setSelectedTab(value as OrderStatus | "all")}
          className="flex-grow"
        >
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="recebido">Recebido</TabsTrigger>
            <TabsTrigger value="em_preparo">Em Preparo</TabsTrigger>
            <TabsTrigger value="pronto">Pronto</TabsTrigger>
            <TabsTrigger value="entregue">Entregue</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex space-x-2 ml-4">
          <Button 
            variant="outline" 
            onClick={() => setConfirmResetOpen(true)}
            className="text-sm"
          >
            Reiniciar Senhas
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleClearCompleted}
            className="text-sm"
          >
            Limpar Concluídos
          </Button>
        </div>
      </div>
      
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-neutral-lightest rounded-lg">
          <h3 className="text-lg font-medium mb-2">Nenhuma senha encontrada</h3>
          <p className="text-neutral">
            {selectedTab === "all" 
              ? "Não há senhas registradas hoje"
              : `Não há senhas com status "${statusConfig[selectedTab as OrderStatus].text}"`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <Card key={order.id} className={`hover:shadow-md transition-shadow border-l-4 ${statusConfig[order.status].color}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold">{order.ticket}</CardTitle>
                  <Badge className={`${statusConfig[order.status].color} text-white`}>
                    {statusConfig[order.status].text}
                  </Badge>
                </div>
                <p className="text-sm text-neutral-dark">
                  {order.customerName || "Cliente"} • {formatDate(order.createdAt)}
                </p>
              </CardHeader>
              
              <CardContent className="py-2">
                <ul className="space-y-1 text-sm">
                  {order.items.slice(0, 3).map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.quantity}× {item.name}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </li>
                  ))}
                  {order.items.length > 3 && (
                    <li className="text-neutral text-xs">
                      + {order.items.length - 3} outros itens
                    </li>
                  )}
                </ul>
              </CardContent>
              
              <CardFooter className="pt-2 flex justify-between items-center">
                <div className="text-lg font-semibold">
                  {formatCurrency(order.total)}
                </div>
                <Button size="sm" onClick={() => handleViewDetails(order)}>
                  Detalhes
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal de detalhes do pedido */}
      {selectedOrder && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>Senha {selectedOrder.ticket}</span>
                <Badge className={`${statusConfig[selectedOrder.status].color} text-white`}>
                  {statusConfig[selectedOrder.status].text}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                {selectedOrder.customerName || "Cliente"} • {formatDate(selectedOrder.createdAt)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Itens do pedido</h4>
                <ul className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}× {item.name}
                        {item.notes && <p className="text-xs text-neutral">{item.notes}</p>}
                      </span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Atualizar status</h4>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o novo status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recebido">Recebido</SelectItem>
                    <SelectItem value="em_preparo">Em Preparo</SelectItem>
                    <SelectItem value="pronto">Pronto</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateStatus}>
                Atualizar Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Modal de confirmação de reset */}
      <Dialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reiniciar sistema de senhas?</DialogTitle>
            <DialogDescription>
              Essa ação irá reiniciar o contador de senhas para A01 e limpar todos os pedidos. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setConfirmResetOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleResetQueue}>
              Sim, reiniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersList;
