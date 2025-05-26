import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TagsIcon,
  PackageIcon, 
  ClipboardListIcon, 
  StoreIcon, 
  SunIcon, 
  UserIcon
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-[#5a443c]' : '';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[#2a211c] border-b border-[#5a443c] py-3 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PackageIcon className="text-[#e67e22]" />
          <span className="text-xl font-medium text-[#e67e22]">Cantinho do Sabor</span>
        </div>
        <nav className="hidden md:flex items-center space-x-4">
          <NavLink to="/" className={`px-3 py-2 rounded transition-colors ${isActive('/')}`}>
            Dashboard
          </NavLink>
          <NavLink to="/categorias" className={`px-3 py-2 rounded transition-colors ${isActive('/categorias')}`}>
            Categorias
          </NavLink>
          <NavLink to="/produtos" className={`px-3 py-2 rounded transition-colors ${isActive('/produtos')}`}>
            Produtos
          </NavLink>
          <NavLink to="/pedidos" className={`px-3 py-2 rounded transition-colors ${isActive('/pedidos')}`}>
            Histórico de Pedidos
          </NavLink>
          <NavLink to="/loja" className={`px-3 py-2 rounded transition-colors ${isActive('/loja')}`}>
            Loja
          </NavLink>
        </nav>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-[#46342e] transition-colors">
            <SunIcon size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-[#46342e] transition-colors">
            <UserIcon size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden bg-[#2a211c] border-b border-[#5a443c] flex justify-between p-2">
        <NavLink to="/" className={`flex flex-col items-center p-2 rounded ${isActive('/')}`}>
          <LayoutDashboard size={20} />
          <span className="text-xs">Dashboard</span>
        </NavLink>
        <NavLink to="/categorias" className={`flex flex-col items-center p-2 rounded ${isActive('/categorias')}`}>
          <TagsIcon size={20} />
          <span className="text-xs">Categorias</span>
        </NavLink>
        <NavLink to="/produtos" className={`flex flex-col items-center p-2 rounded ${isActive('/produtos')}`}>
          <PackageIcon size={20} />
          <span className="text-xs">Produtos</span>
        </NavLink>
        <NavLink to="/pedidos" className={`flex flex-col items-center p-2 rounded ${isActive('/pedidos')}`}>
          <ClipboardListIcon size={20} />
          <span className="text-xs">Pedidos</span>
        </NavLink>
        <NavLink to="/loja" className={`flex flex-col items-center p-2 rounded ${isActive('/loja')}`}>
          <StoreIcon size={20} />
          <span className="text-xs">Loja</span>
        </NavLink>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#2a211c] border-t border-[#5a443c] py-6 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-medium text-[#e67e22] mb-4">Cantinho do Sabor</h3>
              <p className="text-sm text-gray-400">
                Lanches frescos e saborosos para alimentar seu corpo e mente durante a jornada acadêmica.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-400 hover:text-white">Início</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-white">Cardápio</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Horário de Funcionamento</h3>
              <ul className="space-y-2">
                <li className="flex justify-between text-sm">
                  <span>Segunda a Sexta</span>
                  <span>7h às 22h</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span>Sábado</span>
                  <span>8h às 14h</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span>Domingo</span>
                  <span>Fechado</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span>Período de Férias</span>
                  <span>Horários Especiais</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Localização</h3>
              <p className="text-sm text-gray-400">
                Universidade Anhanguera de Osasco - Próximo ao Auditório
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[#5a443c] flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2025 Cantinho do Sabor. Todos os direitos reservados.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-400 hover:text-white">Termos de Uso</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white">Política de Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}