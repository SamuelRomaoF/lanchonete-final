import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { Trash2, Plus, Minus, ShoppingCart, X } from 'lucide-react';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, totalPrice } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="section-container">
        <h1 className="text-3xl font-bold text-center mb-4">Seu Carrinho</h1>
        <div className="flex flex-col items-center justify-center py-16">
          <ShoppingCart className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-medium mb-2">Seu carrinho está vazio</h2>
          <p className="text-gray-500 text-center max-w-md mb-8">
            Adicione alguns itens deliciosos do nosso cardápio para começar seu pedido.
          </p>
          <Link to="/cardapio" className="btn-primary">
            Ver Cardápio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container">
      <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">Seu Carrinho</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="rounded-lg overflow-hidden shadow-md bg-white dark:bg-[#2C1A10]">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {cartItems.map((item) => (
                <div key={item.product.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center">
                  {item.product.image_url && (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-md mr-4 mb-4 sm:mb-0"
                    />
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold dark:text-white">{item.product.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{item.product.description}</p>
                    <p className="font-medium dark:text-white">R$ {item.product.price.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center mt-4 sm:mt-0">
                    <div className="flex items-center space-x-2 mr-4">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        <Minus className="w-4 h-4 dark:text-white" />
                      </button>
                      <span className="font-medium dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="rounded-lg overflow-hidden shadow-md p-6 bg-white dark:bg-[#2C1A10]">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Resumo do Pedido</h2>
            
            <div className="space-y-3 mb-6">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex justify-between dark:text-gray-300">
                  <span>{item.quantity}x {item.product.name}</span>
                  <span>R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
              <div className="flex justify-between font-bold text-lg dark:text-white">
                <span>Total</span>
                <span>R$ {totalPrice.toFixed(2)}</span>
              </div>
            </div>
            
            <button className="btn-primary w-full py-3 mb-4">
              Finalizar Pedido
            </button>
            
            <Link to="/cardapio" className="btn-outline w-full block text-center py-3">
              Continuar Comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}