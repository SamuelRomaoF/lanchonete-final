import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TagsIcon,
  PackageIcon, 
  ClipboardListIcon, 
  StoreIcon, 
  SunIcon, 
  MoonIcon,
  UserIcon,
  LogOutIcon
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-[#5a443c]' : '';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Definição de classes baseadas no tema
  const headerClass = theme === 'dark' 
    ? "bg-[#2a211c] border-b border-[#5a443c]" 
    : "bg-white border-b border-gray-200 text-gray-900";
  
  const navClass = theme === 'dark'
    ? "bg-[#2a211c] border-b border-[#5a443c]"
    : "bg-white border-b border-gray-200";
    
  const hoverClass = theme === 'dark'
    ? "hover:bg-[#46342e]"
    : "hover:bg-gray-100";
    
  const footerClass = theme === 'dark'
    ? "bg-[#2a211c] border-t border-[#5a443c]"
    : "bg-white border-t border-gray-200 text-gray-900";
  
  const borderClass = theme === 'dark'
    ? "border-[#5a443c]"
    : "border-gray-200";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className={`${headerClass} py-3 px-6 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <PackageIcon className="text-[#e67e22]" />
          <span className="text-xl font-medium text-[#e67e22]">Cantinho do Sabor</span>
        </div>
        <nav className="hidden md:flex items-center space-x-4">
          <NavLink to="/admin" className={`px-3 py-2 rounded transition-colors ${isActive('/admin')}`}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/categorias" className={`px-3 py-2 rounded transition-colors ${isActive('/admin/categorias')}`}>
            Categorias
          </NavLink>
          <NavLink to="/admin/produtos" className={`px-3 py-2 rounded transition-colors ${isActive('/admin/produtos')}`}>
            Produtos
          </NavLink>
          <NavLink to="/admin/pedidos" className={`px-3 py-2 rounded transition-colors ${isActive('/admin/pedidos')}`}>
            Histórico de Pedidos
          </NavLink>
          <Link to="/" className={`px-3 py-2 rounded transition-colors`}>
            Loja
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full ${hoverClass} transition-colors`}
            aria-label="Alternar tema claro/escuro"
          >
            {theme === 'dark' ? (
              <SunIcon size={20} />
            ) : (
              <MoonIcon size={20} />
            )}
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`p-2 rounded-full ${hoverClass} transition-colors`}
            >
              <UserIcon size={20} />
            </button>
            
            {showUserMenu && (
              <div 
                className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${
                  theme === 'dark' ? 'bg-[#2a211c] border border-[#5a443c]' : 'bg-white border border-gray-200'
                }`}
              >
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className={`flex items-center w-full px-4 py-2 text-sm ${hoverClass}`}
                  >
                    <LogOutIcon size={16} className="mr-2" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className={`md:hidden ${navClass} flex justify-between p-2`}>
        <NavLink to="/admin" className={`flex flex-col items-center p-2 rounded ${isActive('/admin')}`}>
          <LayoutDashboard size={20} />
          <span className="text-xs">Dashboard</span>
        </NavLink>
        <NavLink to="/admin/categorias" className={`flex flex-col items-center p-2 rounded ${isActive('/admin/categorias')}`}>
          <TagsIcon size={20} />
          <span className="text-xs">Categorias</span>
        </NavLink>
        <NavLink to="/admin/produtos" className={`flex flex-col items-center p-2 rounded ${isActive('/admin/produtos')}`}>
          <PackageIcon size={20} />
          <span className="text-xs">Produtos</span>
        </NavLink>
        <NavLink to="/admin/pedidos" className={`flex flex-col items-center p-2 rounded ${isActive('/admin/pedidos')}`}>
          <ClipboardListIcon size={20} />
          <span className="text-xs">Pedidos</span>
        </NavLink>
        <Link to="/" className={`flex flex-col items-center p-2 rounded`}>
          <StoreIcon size={20} />
          <span className="text-xs">Loja</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className={`${footerClass} py-6 px-6`}>
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-medium text-[#e67e22] mb-4">Cantinho do Sabor</h3>
              <p className="text-sm text-gray-400">
                Painel de Administração
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                <li><NavLink to="/" className="text-sm text-gray-400 hover:text-white">Ver Loja</NavLink></li>
                <li><NavLink to="/admin" className="text-sm text-gray-400 hover:text-white">Dashboard</NavLink></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Recursos</h3>
              <ul className="space-y-2">
                <li><NavLink to="/admin/produtos" className="text-sm text-gray-400 hover:text-white">Gerenciar Produtos</NavLink></li>
                <li><NavLink to="/admin/categorias" className="text-sm text-gray-400 hover:text-white">Gerenciar Categorias</NavLink></li>
                <li><NavLink to="/admin/pedidos" className="text-sm text-gray-400 hover:text-white">Ver Pedidos</NavLink></li>
              </ul>
            </div>
          </div>
          <div className={`mt-8 pt-8 border-t ${borderClass} flex flex-col md:flex-row justify-between items-center`}>
            <p className="text-sm text-gray-400">
              © 2025 Cantinho do Sabor - Painel Administrativo
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 