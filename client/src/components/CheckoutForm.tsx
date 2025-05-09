import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
  street: z.string().min(3, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  postalCode: z.string().min(8, "CEP inválido"),
  paymentMethod: z.enum(["pix", "cartao"], {
    required_error: "Selecione um método de pagamento",
  }),
  // Campos para cartão de crédito (condicionais)
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  cardholderName: z.string().optional(),
}).refine(
  (data) => {
    // Se o método de pagamento for cartão, os campos de cartão são obrigatórios
    if (data.paymentMethod === "cartao") {
      return (
        !!data.cardNumber && 
        !!data.expiryDate && 
        !!data.cvv && 
        !!data.cardholderName
      );
    }
    return true;
  },
  {
    message: "Preencha todos os campos do cartão",
    path: ["cardNumber"],
  }
);

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const CheckoutForm = ({ cartItems, subtotal, onSuccess }: CheckoutFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const deliveryFee = 5.0;
  const total = subtotal + deliveryFee;
  
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      street: "",
      number: "",
      complement: "",
      postalCode: "",
      paymentMethod: "pix",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardholderName: "",
    },
  });
  
  const paymentMethod = form.watch("paymentMethod");
  
  const onSubmit = async (values: CheckoutFormValues) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para finalizar o pedido",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Formatando itens do pedido
      const orderItems = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      }));
      
      // Formatando endereço
      const address = `${values.street}, ${values.number}${values.complement ? `, ${values.complement}` : ''} - CEP: ${values.postalCode}`;
      
      // Criar pedido
      const orderResponse = await apiRequest("POST", "/api/orders", {
        order: {
          userId: user.id,
          status: "pendente",
          total: total,
          address: address,
        },
        items: orderItems,
      });
      
      const orderData = await orderResponse.json();
      
      // Registrar pagamento
      const paymentResponse = await apiRequest("POST", "/api/payments", {
        orderId: orderData.order.id,
        method: values.paymentMethod,
        status: "pendente",
        amount: total,
        externalId: `payment_${Date.now()}`,
      });
      
      // Simulação de aprovação de pagamento em 2 segundos
      setTimeout(() => {
        onSuccess();
        setIsSubmitting(false);
      }, 2000);
      
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      toast({
        title: "Erro ao finalizar pedido",
        description: "Ocorreu um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">Endereço de entrega</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rua</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da rua" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="complement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input placeholder="Apto, bloco, etc" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Forma de pagamento</h3>
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-3"
                    >
                      <div className="border rounded-lg p-4 cursor-pointer hover:border-primary">
                        <div className="flex items-center space-x-3">
                          <FormItem className="flex items-center space-x-3">
                            <FormControl>
                              <RadioGroupItem value="pix" id="pix" />
                            </FormControl>
                            <FormLabel htmlFor="pix" className="font-medium cursor-pointer">PIX</FormLabel>
                          </FormItem>
                        </div>
                        
                        {paymentMethod === "pix" && (
                          <div className="mt-3 pl-7">
                            <img 
                              src="https://pixabay.com/get/g272dcb6185a91e04f2c24c2fbd93607cb52bb6d85f81ca903e0323e9b9c34ea4ef89ae9d2521a40b9564cd04127348e5ff21ff606ba878bb577d74da1cf02074_1280.jpg" 
                              alt="QR Code PIX" 
                              className="w-40 h-40 mx-auto mb-2"
                            />
                            <p className="text-sm text-center text-neutral">
                              Escaneie o QR Code ou copie a chave PIX abaixo
                            </p>
                            <div className="flex items-center justify-center mt-2">
                              <Input 
                                value="fastlanche@pagamento.com" 
                                readOnly 
                                className="bg-neutral-lightest px-3 py-1 text-sm rounded border w-64"
                              />
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon"
                                className="ml-2 text-primary hover:text-primary-dark"
                                onClick={() => {
                                  navigator.clipboard.writeText("fastlanche@pagamento.com");
                                  toast({
                                    title: "Chave PIX copiada!",
                                    description: "Chave copiada para a área de transferência",
                                  });
                                }}
                              >
                                <i className="ri-file-copy-line"></i>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="border rounded-lg p-4 cursor-pointer hover:border-primary">
                        <div className="flex items-center space-x-3">
                          <FormItem className="flex items-center space-x-3">
                            <FormControl>
                              <RadioGroupItem value="cartao" id="cartao" />
                            </FormControl>
                            <FormLabel htmlFor="cartao" className="font-medium cursor-pointer">Cartão de Crédito</FormLabel>
                          </FormItem>
                        </div>
                        
                        {paymentMethod === "cartao" && (
                          <div className="mt-3 pl-7 space-y-3">
                            <FormField
                              control={form.control}
                              name="cardNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Número do cartão</FormLabel>
                                  <FormControl>
                                    <Input placeholder="0000 0000 0000 0000" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="expiryDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Data de validade</FormLabel>
                                    <FormControl>
                                      <Input placeholder="MM/AA" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="cvv"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>CVV</FormLabel>
                                    <FormControl>
                                      <Input placeholder="123" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name="cardholderName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome no cartão</FormLabel>
                                  <FormControl>
                                    <Input placeholder="NOME COMO ESTÁ NO CARTÃO" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Resumo do pedido</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral">Taxa de entrega</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processando..." : "Confirmar Pedido"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default CheckoutForm;
