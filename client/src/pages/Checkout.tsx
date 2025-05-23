import CheckoutForm from "@/components/CheckoutForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";

const Checkout = () => {
  const { items, getTotalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Total do pedido
  const totalAmount = getTotalPrice();

  // Validar carrinho vazio
  if (items.length === 0 && currentStep !== 3) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Seu carrinho está vazio</h2>
        <p className="mb-8">Adicione produtos ao carrinho para continuar com o pedido.</p>
        <Button onClick={() => navigate("/produtos")}>Ver Produtos</Button>
      </div>
    );
  }

  // Callback quando o checkout for concluído
  const handleCheckoutSuccess = () => {
    clearCart();
    navigate("/");
  };
  
  // Preparar os itens para o formulário
  const cartItems = items.map(item => ({
    id: typeof item.productId === 'number' ? item.productId : Number(item.productId),
    name: item.name,
    price: item.price,
    quantity: item.quantity
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Finalizar Pedido</h1>
      
      {/* Passos do checkout */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            1
          </div>
          <div className="h-1 w-12 bg-muted mx-2"></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            2
          </div>
          <div className="h-1 w-12 bg-muted mx-2"></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            3
          </div>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="p-6">
            <CheckoutForm 
              cartItems={cartItems}
              subtotal={totalAmount}
              onSuccess={handleCheckoutSuccess}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Checkout; 