import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { useOrderQueue } from "@/context/OrderQueueContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { zodResolver } from "@hookform/resolvers/zod";
// Importação comentada para evitar erros
// import AbacatePay from "abacatepay-nodejs-sdk";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface CheckoutFormProps {
  cartItems: {
    id: number;
    name: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  onSuccess: () => void;
}

const checkoutSchema = z.object({
  customerName: z.string().min(3, { message: "Nome é obrigatório" }),
  paymentMethod: z.literal("pix")
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// Inicializar o cliente do AbacatePay com valores padrão para desenvolvimento
const API_KEY = (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_ABACATEPAY_API_KEY) 
  ? import.meta.env.VITE_ABACATEPAY_API_KEY 
  : 'test_api_key';

// Comentado para evitar erros
// const abacatePay = AbacatePay(API_KEY);

// Constante para a URL da API
const API_URL = (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_ABACATEPAY_API_URL)
  ? import.meta.env.VITE_ABACATEPAY_API_URL
  : 'https://api.abacatepay.com';

const CheckoutForm = ({ cartItems, subtotal, onSuccess }: CheckoutFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [generatedTicket, setGeneratedTicket] = useState<string | null>(null);
  const [simulationMode, setSimulationMode] = useState(false);
  // Estado para forçar a exibição da tela de confirmação
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();
  const { addOrder } = useOrderQueue();
  const { clearCart } = useCart();
  const total = subtotal;
  
  // Debug: Monitorar mudanças nos estados importantes
  useEffect(() => {
    console.log("Estado atualizado - isPaid:", isPaid, "ticket:", generatedTicket, "showConfirmation:", showConfirmation);
  }, [isPaid, generatedTicket, showConfirmation]);
  
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      paymentMethod: "pix",
    },
  });
  
  const onSubmit = async (values: CheckoutFormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log("Iniciando criação de pagamento...");
      
      // Preparar os itens para o formato esperado pela API do AbacatePay
      const paymentItems = cartItems.map(item => ({
        externalId: `product-${item.id}`,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));
      
      // Simulamos a criação de pagamento sem chamar a API externa
      // para contornar o erro de "Failed to fetch"
      setSimulationMode(true);
      
      // Gerar um ID falso para simular o pagamento
      const fakePaymentId = `sim-${Math.random().toString(36).substring(2, 15)}`;
      setPaymentId(fakePaymentId);
      
      // Iniciar a verificação automática de pagamento
      setIsVerifying(true);
      
      // Toast informando que estamos em modo de simulação
      toast({
        title: "Modo de simulação ativado",
        description: "Use o botão 'Simular Pagamento Confirmado' para completar o pedido.",
        variant: "default",
      });
      
    } catch (error) {
      console.error("Erro ao simular processo de pagamento:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: "Ocorreu um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };
  
  // Verificar status do pagamento
  useEffect(() => {
    if (!isVerifying || !paymentId) return;
    
    // Em modo de simulação, não precisamos verificar o status
    if (simulationMode) return;
    
    const checkPaymentStatus = async () => {
      try {
        // Verificar status do pagamento na API do AbacatePay
        const response = await fetch(`/api/payment/check-status?id=${paymentId}`);
        const paymentStatus = await response.json();
        
        if (paymentStatus.status === 'PAID') {
          // Pagamento aprovado
          await processSuccessfulPayment(form.getValues().customerName);
        } else if (paymentStatus.status === 'EXPIRED' || paymentStatus.status === 'CANCELLED') {
          // Pagamento expirado ou cancelado
          toast({
            title: "Pagamento não realizado",
            description: "O tempo para pagamento expirou ou foi cancelado. Tente novamente.",
            variant: "destructive",
          });
          setIsVerifying(false);
          setIsSubmitting(false);
          setPaymentId(null);
        }
        // Se ainda estiver pendente (PENDING), continuamos verificando
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
      }
    };
    
    // Verificar a cada 5 segundos
    const interval = setInterval(checkPaymentStatus, 5000);
    
    return () => clearInterval(interval);
  }, [isVerifying, paymentId, simulationMode]);
  
  // Processar pagamento bem-sucedido
  const processSuccessfulPayment = async (customerName: string) => {
    console.log("Pagamento confirmado! Processando pedido...");
    
    try {
      if (!customerName || customerName.trim() === "") {
        toast({
          title: "Nome obrigatório",
          description: "Por favor, informe seu nome para continuar.",
          variant: "destructive",
        });
        return;
      }
      
      // Formatando itens do pedido
      const orderItems = cartItems.map(item => ({
        id: String(item.id),
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));
      
      // Criar pedido com o nome do cliente
      const order = addOrder(orderItems, customerName);
      console.log("Ticket gerado:", order.ticket);
      
      // IMPORTANTE: Guardar o ticket e dados do pedido localmente antes de qualquer operação
      const ticketNumber = order.ticket;
      
      // Limpar carrinho imediatamente após confirmar o pagamento
      clearCart();
      
      // Mostrar notificação de sucesso
      toast({
        title: "Pagamento confirmado!",
        description: `Seu pedido foi registrado com sucesso. Seu ticket é: ${ticketNumber}`,
        variant: "default",
      });

      // IMPORTANTE: Forçar a exibição da tela de confirmação
      setGeneratedTicket(ticketNumber);
      setIsPaid(true);
      setShowConfirmation(true); // Este é o estado chave que decidirá a renderização
      
      // Redefinir outros estados
      setIsSubmitting(false);
      setIsVerifying(false);
      
      console.log("Forçando exibição da tela de confirmação com ticket:", ticketNumber);

      // Enviar dados para a API em segundo plano - não esperamos pela resposta
      try {
        const orderInfo = {
          order: {
            id: ticketNumber,
            ticket: ticketNumber,
            status: 'recebido',
            items: orderItems,
            total: total,
            createdAt: new Date().toISOString(),
            customerName: customerName,
            customerEmail: `${customerName.replace(/\s+/g, '-').toLowerCase()}@example.com`,
            payment: {
              method: 'pix',
              status: 'paid',
              amount: total
            }
          },
          customerPhone: ''
        };

        console.log("Enviando dados para a fila...");
        fetch('/api/queue/add-and-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderInfo),
        }).then(response => {
          if (response.ok) {
            console.log('Notificações enviadas com sucesso!');
          } else {
            response.text().then(text => console.error('Erro na fila:', text));
          }
        }).catch(err => {
          console.error("Erro ao enviar notificações:", err);
        });
      } catch (error) {
        console.error("Erro no processamento em segundo plano:", error);
        // Não afeta o fluxo principal do usuário
      }
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      toast({
        title: "Erro ao finalizar pedido",
        description: "Ocorreu um erro ao processar o pedido. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  const handleFinishOrder = () => {
    onSuccess();
    clearCart();
  };
  
  const renderConfirmationScreen = () => {
    console.log("Renderizando tela de confirmação com ticket:", generatedTicket);
    return (
      <div className="py-6 text-center space-y-6">
        <div className="rounded-lg bg-green-50 p-6 mx-auto max-w-xs">
          <h3 className="text-xl font-bold text-green-600 mb-2">Pagamento Confirmado!</h3>
          <div className="w-24 h-24 mx-auto my-4 bg-green-100 rounded-full flex items-center justify-center">
            <i className="ri-check-line text-4xl text-green-600"></i>
          </div>
          <p className="text-sm text-neutral-dark mb-2">
            Obrigado por seu pedido!
          </p>
          <div className="my-4 py-3 border-y border-green-200">
            <p className="text-green-700 font-bold mb-1">Seu número de ticket é:</p>
            <div className="text-3xl font-bold text-green-600">{generatedTicket}</div>
          </div>
          <p className="text-sm text-neutral-dark">
            Você será chamado por este número quando seu pedido estiver pronto.
          </p>
        </div>
        
        <div className="space-y-3 mt-4">
          <h4 className="font-semibold">Resumo do Pedido</h4>
          {cartItems.map(item => (
            <div key={item.id} className="flex justify-between">
              <span>{item.name} × {item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-2 border-t">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
        
        <Button 
          onClick={handleFinishOrder}
          className="w-full bg-primary hover:bg-primary-dark mt-4"
        >
          Concluir
        </Button>
      </div>
    );
  };
  
  // IMPORTANTE: Usamos showConfirmation como estado principal para decidir o que renderizar
  if (showConfirmation && generatedTicket) {
    return renderConfirmationScreen();
  }
  
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {!paymentId && (
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Digite seu nome" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {paymentId ? (
            <div>
              <h3 className="font-medium mb-3">Pagamento via PIX</h3>
              <div className="border rounded-lg p-4">
                {simulationMode ? (
                  <div className="w-48 h-48 mx-auto mb-2 flex items-center justify-center bg-gray-100">
                    <div className="text-center p-4">
                      <p className="font-medium text-gray-500">Modo de Simulação</p>
                      <p className="text-sm text-gray-400 mt-2">QR Code Simulado</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 mx-auto mb-2 flex items-center justify-center">
                    <img 
                      src={`${API_URL}/payments/${paymentId}/qrcode`}
                      alt="QR Code PIX AbacatePay" 
                      className="max-w-full max-h-full"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%23666" text-anchor="middle" dominant-baseline="middle">QR Code AbacatePay</text></svg>';
                      }}
                    />
                  </div>
                )}
                <p className="text-sm text-center text-neutral mb-2">
                  {simulationMode 
                    ? "Modo de demonstração ativado" 
                    : "Escaneie o QR Code com o aplicativo do seu banco"}
                </p>
                <div className="text-center">
                  <p className="text-sm font-medium">Valor a pagar:</p>
                  <p className="text-xl font-bold">{formatCurrency(total)}</p>
                </div>
                
                <div className="mt-4">
                  <Button
                    type="button"
                    onClick={() => processSuccessfulPayment(form.getValues().customerName)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={simulationMode ? false : (isSubmitting || isVerifying)}
                  >
                    Teste: Simular Pagamento Confirmado
                  </Button>
                </div>
                
                {isVerifying && !simulationMode && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-primary">Aguardando confirmação do pagamento...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-medium mb-2">Resumo</h3>
              <div className="bg-neutral-lightest p-4 rounded-lg">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between mb-2">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-3 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full mt-4 bg-primary hover:bg-primary-dark"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processando..." : "Continuar para pagamento"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default CheckoutForm;
