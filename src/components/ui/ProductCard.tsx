import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, cartItems, updateQuantity } = useCart();
  
  const cartItem = cartItems.find(item => item.product.id === product.id);
  const isInCart = !!cartItem;

  return (
    <div className="product-card">
      {product.image_url && (
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
        <p className="text-gray-500 dark:text-gray-300 mb-4">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">R$ {product.price.toFixed(2)}</span>
          
          {isInCart ? (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => updateQuantity(product.id, Math.max(0, cartItem.quantity - 1))}
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-medium">{cartItem.quantity}</span>
              <button 
                onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => addToCart(product)} 
              className="btn-primary flex items-center"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Adicionar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}