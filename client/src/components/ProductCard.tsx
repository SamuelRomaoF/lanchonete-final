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
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg card-transition">
      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-all duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200">
            <span className="text-gray-400">Imagem não disponível</span>
          </div>
        )}
      </div>
      
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
