import CheckoutForm from "@/components/CheckoutForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useState } from "react";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
  const { cart, updateItemQuantity, removeItem, clearCart } = useCart();
  const { toast } = useToast();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const subtotal = cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  const handleIncrement = (id: number) => {
    const item = cart.find(item => item.id === id);
    if (item) {
      updateItemQuantity(id, item.quantity + 1);
    }
  };
  
  const handleDecrement = (id: number) => {
    const item = cart.find(item => item.id === id);
    if (item && item.quantity > 1) {
      updateItemQuantity(id, item.quantity - 1);
    } else if (item) {
      removeItem(id);
    }
  };
  
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho Vazio",
        description: "Adicione produtos ao carrinho para fazer o pedido",
        variant: "destructive",
      });
      return;
    }
    
    setCheckoutOpen(true);
    onClose();
  };
  
  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setCheckoutOpen(false);
    clearCart();
    
    setTimeout(() => {
      setPaymentSuccess(false);
    }, 5000);
  };
  
  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-[90%] sm:w-[380px] sm:max-w-md p-0 flex flex-col">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex justify-between items-center">
                <span>Seu Carrinho</span>
                <button 
                  onClick={onClose}
                  className="text-neutral hover:text-primary"
                  aria-label="Fechar carrinho"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </SheetTitle>
            </SheetHeader>
            
            <div className="flex-grow overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <i className="ri-shopping-cart-line text-4xl text-muted-foreground mb-2"></i>
                  <p className="text-muted-foreground">Seu carrinho está vazio</p>
                  <Button 
                    variant="link" 
                    className="mt-2 text-primary"
                    onClick={onClose}
                  >
                    Explorar cardápio
                  </Button>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 mb-4 pb-4 border-b">
                      {item.imageUrl && (
                        <img 
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-grow">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-neutral">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          className="w-6 h-6 rounded-full bg-neutral-light flex items-center justify-center hover:bg-neutral-200"
                          onClick={() => handleDecrement(item.id)}
                          aria-label="Diminuir quantidade"
                        >
                          <i className="ri-subtract-line text-sm"></i>
                        </button>
                        <span className="text-sm font-medium">{item.quantity}</span>
                        <button 
                          className="w-6 h-6 rounded-full bg-neutral-light flex items-center justify-center hover:bg-neutral-200"
                          onClick={() => handleIncrement(item.id)}
                          aria-label="Aumentar quantidade"
                        >
                          <i className="ri-add-line text-sm"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            
            <div className="p-4 border-t bg-neutral-lightest">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <Button
                onClick={handleCheckout}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg"
                disabled={cart.length === 0}
              >
                Finalizar Pedido
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Checkout Modal */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Finalizar Pedido</DialogTitle>
          </DialogHeader>
          <CheckoutForm 
            cartItems={cart} 
            subtotal={subtotal} 
            onSuccess={handlePaymentSuccess} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Success Toast */}
      {paymentSuccess && (
        <div className="fixed bottom-4 right-4 bg-status-success text-white px-4 py-3 rounded-lg shadow-md flex items-center space-x-2 z-50 animate-in fade-in slide-in-from-bottom-5">
          <i className="ri-checkbox-circle-line text-xl"></i>
          <span>Pedido realizado com sucesso!</span>
        </div>
      )}
    </>
  );
};

export default CartSidebar;
