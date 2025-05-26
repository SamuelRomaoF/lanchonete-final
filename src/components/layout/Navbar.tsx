import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import { ShoppingCart, Sun, Moon, Utensils, User } from 'lucide-react';
import CartDrawer from '../ui/CartDrawer';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { totalItems } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-colors duration-300 shadow-md ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-[#2C1A10] text-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Utensils className="w-6 h-6 text-orange-500" />
                <span className="text-xl font-bold text-orange-500">Cantinho do Sabor</span>
              </Link>
            </div>

            <div className="hidden md:flex space-x-8 items-center">
              <Link to="/" className="hover:text-orange-500 transition-colors">
                Início
              </Link>
              <Link to="/cardapio" className="hover:text-orange-500 transition-colors">
                Cardápio
              </Link>
              <Link to="/admin" className="hover:text-orange-500 transition-colors">
                Dashboard
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>

              <button 
                onClick={() => setIsCartOpen(true)} 
                className="relative p-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              <Link to="/login" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <User className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}