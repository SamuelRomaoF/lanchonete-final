import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@shared/schema";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  imageUrl: string;
  isFeatured?: boolean;
  isPromotion?: boolean;
}

const ProductCard = ({ 
  id, 
  name, 
  description, 
  price, 
  oldPrice,
  imageUrl, 
  isFeatured, 
  isPromotion 
}: ProductCardProps) => {
  const { addItem, isItemInCart, getItemQuantity } = useCart();
  const { toast } = useToast();
  
  // Verificar se o produto já está no carrinho
  const inCart = isItemInCart(id);
  const quantity = getItemQuantity(id);
  
  // Adicionar ao carrinho
  const handleAddToCart = () => {
    const product: Product = {
      id,
      name,
      description,
      price,
      imageUrl,
      available: true,
      isFeatured: isFeatured || false,
      isPromotion: isPromotion || false
    };
    
    addItem(product);
    
    toast({
      title: "Produto adicionado",
      description: `${name} foi adicionado ao carrinho`,
    });
  };
  
  return (
    <div className="bg-card text-card-foreground rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <img 
        src={imageUrl} 
        alt={name} 
        className="w-full h-48 object-cover"
      />
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{name}</h3>
          <div className="flex space-x-1">
            {isFeatured && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                POPULAR
              </Badge>
            )}
            {isPromotion && (
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                PROMOÇÃO
              </Badge>
            )}
          </div>
        </div>
        <p className="text-muted-foreground text-sm mb-3">{description}</p>
        <div className="flex justify-between items-center">
          <div>
            <span className="font-bold text-lg">{formatCurrency(price)}</span>
            {oldPrice && (
              <span className="text-muted-foreground line-through text-sm ml-2">
                {formatCurrency(oldPrice)}
              </span>
            )}
          </div>
          
          {inCart ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{quantity} no carrinho</span>
              <Button 
                variant="outline"
                size="sm"
                className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                onClick={handleAddToCart}
              >
                + Adicionar
              </Button>
            </div>
          ) : (
            <Button 
              className="bg-primary hover:bg-primary-dark text-white font-medium"
              onClick={handleAddToCart}
            >
              Adicionar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
