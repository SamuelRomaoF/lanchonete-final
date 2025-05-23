import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@shared/schema";
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useLocation } from 'wouter';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  showAddToCart?: boolean;
}

const ProductCard = ({ product, onAddToCart, showAddToCart = true }: ProductCardProps) => {
  const { addItem, isItemInCart, getItemQuantity } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  
  // Verificar se o produto já está no carrinho
  const inCart = isItemInCart(product.id);
  const quantity = getItemQuantity(product.id);
  
  const handleClick = () => {
    setLocation(`/products/${product.id}`);
  };

  // Adicionar ao carrinho
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addItem(product);
    }
    
    toast({
      title: "Produto adicionado",
      description: `${product.name} foi adicionado ao carrinho`,
    });
  };
  
  return (
    <motion.div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform duration-200 hover:scale-105"
      whileHover={{ scale: 1.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="relative">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-48 object-cover"
        />
        {product.isPromotion && (
          <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-sm">
            Promoção
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{product.name}</h3>
          <div className="flex space-x-1">
            {product.isFeatured && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                POPULAR
              </Badge>
            )}
            {product.isPromotion && (
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                PROMOÇÃO
              </Badge>
            )}
          </div>
        </div>
        <p className="text-muted-foreground text-sm mb-3">{product.description}</p>
        <div className="flex justify-between items-center">
          <div>
            {product.isPromotion && product.oldPrice && (
              <span className="text-gray-500 line-through mr-2">
                {formatCurrency(product.oldPrice)}
              </span>
            )}
            <span className="font-bold text-lg">{formatCurrency(product.price)}</span>
          </div>
          
          {showAddToCart && (
            <Button 
              className="bg-primary hover:bg-primary-dark text-white font-medium"
              onClick={handleAddToCart}
            >
              Adicionar
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
