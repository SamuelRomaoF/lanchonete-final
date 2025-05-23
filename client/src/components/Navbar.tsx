import CartSidebar from "@/components/CartSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { ClipboardList, FolderTree, LayoutDashboard, LogOut, Package, Receipt, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const [location, navigate] = useLocation();
  
  // Fechar menu mobile ao mudar de página
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);
  
  const handleLogout = async () => {
    await logout();
    if (location.startsWith('/admin')) {
      navigate('/');
    }
  };
  
  // Verificar se é página de admin
  const isAdminPage = location.startsWith('/admin');

  // Total de itens no carrinho
  const totalItems = getTotalItems();

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background text-foreground shadow-md transition-colors duration-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-2">
                <i className="ri-restaurant-2-fill text-3xl text-primary"></i>
                <span className="text-2xl font-bold text-primary font-poppins">Cantinho do Sabor</span>
              </Link>
            </div>
            
            {!isAdminPage && (
              <div className="hidden md:flex space-x-6 text-sm font-medium">
                <Link href="/" className="hover:text-primary transition-colors">
                  Início
                </Link>
                <Link href="/produtos" className="hover:text-primary transition-colors">
                  Cardápio
                </Link>
                {(!user || user.type !== 'admin') && (
                  <Link href="/pedidos" className="hover:text-primary transition-colors">
                    Histórico de Pedidos
                  </Link>
                )}
              </div>
            )}
            
            {isAdminPage && (
              <div className="hidden md:flex space-x-6 text-sm font-medium">
                <Link href="/admin" className="hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin/categorias" className="hover:text-primary transition-colors">
                  Categorias
                </Link>
                <Link href="/admin/produtos" className="hover:text-primary transition-colors">
                  Produtos
                </Link>
                <Link href="/admin/pedidos/historico" className="hover:text-primary transition-colors">
                  Histórico de Pedidos
                </Link>
                <Link href="/" className="hover:text-primary transition-colors">
                  Loja
                </Link>
              </div>
            )}
            
            <div className="flex items-center space-x-4">
              {/* Carrinho (apenas para páginas não admin) */}
              {!isAdminPage && (
                <button 
                  className="flex items-center relative"
                  onClick={() => setCartOpen(true)}
                  aria-label="Abrir carrinho"
                >
                  <i className="ri-shopping-cart-line text-xl"></i>
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
              )}
              
              <ThemeToggle />
              
              {/* Exibir apenas para usuários logados */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/avatars/01.png" alt={user.name || 'Avatar do usuário'} />
                        <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name || 'Usuário'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      {user.type === 'admin' && (
                        <>
                          <DropdownMenuItem onClick={() => navigate('/admin')}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/admin/products')}>
                            <Package className="mr-2 h-4 w-4" />
                            <span>Produtos</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/admin/categories')}>
                            <FolderTree className="mr-2 h-4 w-4" />
                            <span>Categorias</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/admin/orders')}>
                            <ClipboardList className="mr-2 h-4 w-4" />
                            <span>Pedidos</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => navigate('/orders')}>
                        <Receipt className="mr-2 h-4 w-4" />
                        <span>Meus Pedidos</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center space-x-1 text-sm">
                    <i className="ri-user-line text-xl"></i>
                    <span className="hidden md:inline-block">Login</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
                    <DropdownMenuLabel>Login</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/login')}>
                      Login
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/register')}>
                      Registrar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <button
                className="md:hidden text-muted-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <i className="ri-close-line text-2xl"></i>
                ) : (
                  <i className="ri-menu-line text-2xl"></i>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="bg-background border-t border-border md:hidden">
            <div className="container mx-auto px-4 py-2">
              <div className="flex flex-col space-y-3 py-3 text-sm font-medium">
                {!isAdminPage ? (
                  <>
                    <Link href="/" className="hover:text-primary transition-colors py-2">
                      Início
                    </Link>
                    <Link href="/produtos" className="hover:text-primary transition-colors py-2">
                      Cardápio
                    </Link>
                    {(!user || user.type !== 'admin') && (
                      <Link href="/pedidos" className="hover:text-primary transition-colors py-2">
                        Histórico de Pedidos
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link href="/admin" className="hover:text-primary transition-colors py-2">
                      Dashboard
                    </Link>
                    <Link href="/admin/categorias" className="hover:text-primary transition-colors py-2">
                      Categorias
                    </Link>
                    <Link href="/admin/produtos" className="hover:text-primary transition-colors py-2">
                      Produtos
                    </Link>
                    <Link href="/admin/pedidos/historico" className="hover:text-primary transition-colors py-2">
                      Histórico de Pedidos
                    </Link>
                    <Link href="/" className="hover:text-primary transition-colors py-2">
                      Loja
                    </Link>
                  </>
                )}
                
                <div className="flex items-center space-x-2 py-2">
                  <span>Alternar tema</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Carrinho */}
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Navbar;
