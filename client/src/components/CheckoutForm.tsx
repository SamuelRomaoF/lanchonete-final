import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useOrderQueue } from "@/context/OrderQueueContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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
  paymentMethod: z.literal("pix")
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const CheckoutForm = ({ cartItems, subtotal, onSuccess }: CheckoutFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const { toast } = useToast();
  const { addOrder } = useOrderQueue();
  const total = subtotal;
  
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "pix",
    },
  });
  
  const onSubmit = async (values: CheckoutFormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log("Iniciando criação de pedido...");
      
      // Formatando itens do pedido
      const orderItems = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));
      
      console.log("Itens formatados:", orderItems);
      
      // Criar pedido sem senha customizada
      const order = addOrder(orderItems, "Cliente", undefined);
      console.log("Pedido criado com sucesso:", order);
      
      setIsPaid(true);
      
      toast({
        title: "Pagamento confirmado!",
        description: "Seu pedido foi registrado com sucesso.",
        variant: "default",
      });
      
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      toast({
        title: "Erro ao finalizar pedido",
        description: "Ocorreu um erro ao processar o pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFinishOrder = () => {
    onSuccess();
  };
  
  if (isPaid) {
    return (
      <div className="py-6 text-center space-y-6">
        <div className="rounded-lg bg-green-50 p-6 mx-auto max-w-xs">
          <h3 className="text-2xl font-bold text-green-600 mb-2">Pagamento Confirmado!</h3>
          <div className="w-24 h-24 mx-auto my-4 bg-green-100 rounded-full flex items-center justify-center">
            <i className="ri-check-line text-4xl text-green-600"></i>
          </div>
          <p className="text-sm text-neutral-dark mb-4">
            Apresente este comprovante ao estabelecimento para retirar seu pedido.
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
  }
  
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">Pagamento via PIX</h3>
            <div className="border rounded-lg p-4">
              <div className="w-48 h-48 mx-auto mb-2 flex items-center justify-center">
                <img 
                  src="https://i.imgur.com/placeholder-qrcode.png" 
                  alt="QR Code PIX" 
                  className="max-w-full max-h-full"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%23666" text-anchor="middle" dominant-baseline="middle">QR Code PIX</text></svg>';
                  }}
                />
              </div>
              <p className="text-sm text-center text-neutral mb-2">
                Escaneie o QR Code ou copie a chave PIX abaixo
              </p>
              <div className="flex items-center justify-center">
                <Input 
                  value="sua.chave.pix@exemplo.com" 
                  readOnly 
                  className="bg-neutral-lightest px-3 py-1 text-sm rounded border w-64"
                />
                <Button 
                  variant="outline" 
                  className="ml-2 h-9" 
                  onClick={() => {
                    navigator.clipboard.writeText("sua.chave.pix@exemplo.com");
                    toast({
                      title: "Chave copiada!",
                      description: "Chave PIX copiada para a área de transferência",
                    });
                  }}
                >
                  <i className="ri-clipboard-line"></i>
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-center mt-3 text-neutral-dark">
              Após realizar o pagamento, clique no botão abaixo para confirmar
            </p>
          </div>
          
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
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-4 bg-primary hover:bg-primary-dark"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CheckoutForm;
