import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatCurrency";

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
  return (
    <div className="bg-white dark:bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg dark:hover:shadow-gray-900 card-transition">
      <img 
        src={imageUrl} 
        alt={name} 
        className="w-full h-48 object-cover"
      />
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg dark:text-card-foreground">{name}</h3>
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
        <p className="text-neutral dark:text-muted-foreground text-sm mb-3">{description}</p>
        <div className="flex justify-between items-center">
          <div>
            <span className="font-bold text-lg dark:text-card-foreground">{formatCurrency(price)}</span>
            {oldPrice && (
              <span className="text-neutral dark:text-muted-foreground line-through text-sm ml-2">
                {formatCurrency(oldPrice)}
              </span>
            )}
          </div>
          <Button 
            className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg"
          >
            Ver Detalhes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
