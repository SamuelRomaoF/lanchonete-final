import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  id: number;
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
  const { addItem } = useCart();
  const { toast } = useToast();
  
  const handleAddToCart = () => {
    addItem({
      id,
      name,
      price,
      imageUrl,
      quantity: 1
    });
    
    toast({
      title: "Adicionado ao carrinho",
      description: `${name} foi adicionado ao seu carrinho`,
      variant: "default",
    });
  };
  
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg card-transition">
      <img 
        src={imageUrl} 
        alt={name} 
        className="w-full h-48 object-cover"
      />
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{name}</h3>
          {isFeatured && (
            <Badge variant="secondary" className="bg-primary-light text-white">
              MAIS VENDIDO
            </Badge>
          )}
          {isPromotion && (
            <Badge variant="secondary" className="bg-primary-light text-white">
              PROMOÇÃO
            </Badge>
          )}
        </div>
        <p className="text-neutral text-sm mb-3">{description}</p>
        <div className="flex justify-between items-center">
          <div>
            <span className="font-bold text-lg">{formatCurrency(price)}</span>
            {oldPrice && (
              <span className="text-neutral line-through text-sm ml-2">
                {formatCurrency(oldPrice)}
              </span>
            )}
          </div>
          <Button 
            onClick={handleAddToCart}
            className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg"
          >
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
