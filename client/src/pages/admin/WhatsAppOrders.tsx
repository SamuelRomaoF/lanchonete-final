import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useOrderQueue } from "@/context/OrderQueueContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface PendingOrder {
  id: string;
  from: string;
  text: string;
  timestamp: string;
  parsed?: {
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    customerName: string;
    total: number;
  };
}

interface WhatsAppConfig {
  adminPhones: string[];
}

const WhatsAppOrders = () => {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { addOrder } = useOrderQueue();
  
  // Estado para pedidos pendentes
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para configurações
  const [config, setConfig] = useState<WhatsAppConfig>({ adminPhones: [] });
  const [newAdminPhone, setNewAdminPhone] = useState("");
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    if (user && user.type !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Carregar pedidos pendentes
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/whatsapp/pending-orders');
        
        if (response.ok) {
          const data = await response.json();
          setPendingOrders(data.pendingOrders || []);
        } else {
          console.error("Erro ao buscar pedidos pendentes");
          toast({
            title: "Erro",
            description: "Não foi possível carregar os pedidos do WhatsApp",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar pedidos pendentes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && user.type === "admin") {
      fetchPendingOrders();
    }
  }, [user, toast]);
  
  // Função para adicionar um telefone de administrador
  const handleAddAdminPhone = async () => {
    if (!newAdminPhone || newAdminPhone.length < 10) {
      toast({
        title: "Erro",
        description: "Informe um número de telefone válido com DDD",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch('/api/admin/whatsapp/recipients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: newAdminPhone,
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Número de telefone adicionado com sucesso",
        });
        setNewAdminPhone("");
        setConfig(prev => ({
          ...prev,
          adminPhones: [...prev.adminPhones, newAdminPhone]
        }));
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível adicionar o número de telefone",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao adicionar telefone:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar o telefone",
        variant: "destructive",
      });
    }
  };
  
  // Função para importar um pedido
  const handleImportOrder = (order: PendingOrder) => {
    if (!order.parsed) {
      toast({
        title: "Erro",
        description: "Este pedido não pôde ser interpretado corretamente",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Converter itens para o formato esperado pelo addOrder
      const orderItems = order.parsed.items.map((item, index) => ({
        id: String(index + 1), // Convertendo para string
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));
      
      // Criar pedido no sistema
      const newOrder = addOrder(
        orderItems,
        order.parsed.customerName,
        order.from
      );
      
      // Remover da lista de pendentes
      setPendingOrders(prev => prev.filter(p => p.id !== order.id));
      
      toast({
        title: "Pedido importado",
        description: `Pedido importado com sucesso. Senha: ${newOrder.ticket}`,
      });
    } catch (error) {
      console.error("Erro ao importar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível importar o pedido",
        variant: "destructive",
      });
    }
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
      <h1 className="text-2xl font-bold mb-6">Integração com WhatsApp</h1>
      
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pedidos Pendentes</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <p className="text-amber-800">
              <strong>Importante:</strong> Esta funcionalidade permite importar pedidos recebidos via WhatsApp.
              Para isso, é necessário configurar o webhook do WhatsApp Business API.
            </p>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p>Carregando pedidos pendentes...</p>
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="text-center py-12 bg-neutral-lightest rounded-lg">
              <h3 className="text-lg font-medium mb-2">Nenhum pedido pendente</h3>
              <p className="text-neutral">
                Não há pedidos recebidos pelo WhatsApp para importar.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-bold">
                        Pedido de {order.parsed?.customerName || "Cliente"}
                      </CardTitle>
                      <Badge variant="outline" className="bg-blue-100">
                        Via WhatsApp
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-dark">
                      De: {order.from} • {new Date(order.timestamp).toLocaleString()}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-2">
                    {order.parsed ? (
                      <>
                        <div className="space-y-2 mb-4">
                          <h4 className="text-sm font-medium">Itens identificados:</h4>
                          <ul className="space-y-1 text-sm">
                            {order.parsed.items.map((item, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>{item.quantity}× {item.name}</span>
                                <span>{formatCurrency(item.price * item.quantity)}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex justify-between font-semibold pt-2 border-t">
                            <span>Total</span>
                            <span>{formatCurrency(order.parsed.total)}</span>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => handleImportOrder(order)}
                          className="w-full"
                        >
                          Importar Pedido
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Mensagem original:</h4>
                          <div className="bg-neutral-lightest p-3 rounded text-sm">
                            {order.text}
                          </div>
                          <p className="text-red-500 text-xs mt-2">
                            Não foi possível interpretar este pedido automaticamente.
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" className="flex-1">
                            Ignorar
                          </Button>
                          <Button variant="outline" className="flex-1">
                            Criar Manualmente
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Telefones para notificação</h3>
                <p className="text-sm text-neutral-dark mb-4">
                  Adicione números de telefone que receberão notificações de novos pedidos.
                </p>
                
                <div className="flex space-x-2">
                  <Input
                    placeholder="(11) 99999-9999"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                  />
                  <Button onClick={handleAddAdminPhone}>
                    Adicionar
                  </Button>
                </div>
                
                {config.adminPhones.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Telefones configurados:</h4>
                    <ul className="space-y-2">
                      {config.adminPhones.map((phone, idx) => (
                        <li key={idx} className="flex items-center justify-between p-2 bg-neutral-lightest rounded">
                          <span>{phone}</span>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <i className="ri-delete-bin-line text-red-500"></i>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Webhook do WhatsApp</h3>
                <p className="text-sm text-neutral-dark mb-4">
                  Configure o webhook no painel do WhatsApp Business API com a URL abaixo:
                </p>
                
                <div className="bg-neutral-lightest p-3 rounded font-mono text-sm break-all">
                  {window.location.origin}/api/webhook/whatsapp
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium">Token de verificação:</h4>
                  <div className="bg-neutral-lightest p-3 rounded font-mono text-sm mt-1">
                    falecomigo_whatsapp_token
                  </div>
                  <p className="text-xs text-neutral-dark mt-1">
                    Use este token na configuração do webhook para verificação.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppOrders; 