import { useCart } from '../../contexts/CartContext';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cartItems, updateQuantity, removeFromCart, totalPrice } = useCart();
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className={`absolute inset-y-0 right-0 max-w-md w-full ${theme === 'dark' ? 'bg-[#2C1A10]' : 'bg-white'} shadow-xl flex flex-col`}>
        <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-[#5a443c]' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <ShoppingCart className="w-5 h-5 mr-2" />
            Seu Carrinho
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-[#46342e] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <ShoppingCart className={`w-12 h-12 ${theme === 'dark' ? 'text-[#5a443c]' : 'text-gray-400'} mb-4`} />
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-center mb-4`}>
              Seu carrinho está vazio
            </p>
            <Link
              to="/cardapio"
              onClick={onClose}
              className="btn-primary"
            >
              Ver Cardápio
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className={`flex items-center space-x-4 p-4 rounded-lg shadow-sm border ${
                      theme === 'dark' 
                        ? 'bg-[#3C2A1F] border-[#5a443c]' 
                        : 'bg-white border-gray-100'
                    }`}
                  >
                    {item.product.image_url && (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {item.product.name}
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        R$ {item.product.price.toFixed(2)}
                      </p>
                      <div className="flex items-center mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            theme === 'dark'
                              ? 'bg-[#2C1A10] hover:bg-[#46342e] text-gray-400'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                          }`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className={`mx-3 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className={`${
                        theme === 'dark'
                          ? 'text-red-400 hover:text-red-300'
                          : 'text-red-500 hover:text-red-700'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={`border-t p-4 ${
              theme === 'dark'
                ? 'border-[#5a443c] bg-[#2C1A10]'
                : 'border-gray-200 bg-white'
            }`}>
              <div className="flex justify-between mb-4">
                <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Subtotal
                </span>
                <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  R$ {totalPrice.toFixed(2)}
                </span>
              </div>
              <Link
                to="/carrinho"
                onClick={onClose}
                className="btn-primary w-full text-center py-3"
              >
                Finalizar Pedido
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}