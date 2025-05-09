import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import CartSidebar from "@/components/CartSidebar";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const { cart } = useCart();
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
  
  // Alternar entre login e registro
  const showRegisterForm = () => {
    setLoginOpen(false);
    setRegisterOpen(true);
  };
  
  const showLoginForm = () => {
    setRegisterOpen(false);
    setLoginOpen(true);
  };
  
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  
  // Verificar se é página de admin
  const isAdminPage = location.startsWith('/admin');

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-2">
                <i className="ri-restaurant-2-fill text-3xl text-primary"></i>
                <span className="text-2xl font-bold text-primary font-poppins">FastLanche</span>
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
                {user && user.type === 'cliente' && (
                  <Link href="/pedidos" className="hover:text-primary transition-colors">
                    Meus Pedidos
                  </Link>
                )}
                {user && user.type === 'admin' && (
                  <Link href="/admin" className="hover:text-primary transition-colors">
                    Área Admin
                  </Link>
                )}
              </div>
            )}
            
            {isAdminPage && (
              <div className="hidden md:flex space-x-6 text-sm font-medium">
                <Link href="/admin" className="hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin/produtos" className="hover:text-primary transition-colors">
                  Produtos
                </Link>
                <Link href="/admin/pedidos" className="hover:text-primary transition-colors">
                  Pedidos
                </Link>
                <Link href="/" className="hover:text-primary transition-colors">
                  Loja
                </Link>
              </div>
            )}
            
            <div className="flex items-center space-x-4">
              {!isAdminPage && (
                <button 
                  className="relative p-2 text-neutral hover:text-primary transition-colors"
                  onClick={() => setCartOpen(true)}
                >
                  <i className="ri-shopping-cart-2-line text-xl"></i>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
              )}
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="hidden md:flex items-center space-x-1 hover:text-primary transition-colors">
                    <i className="ri-user-line text-xl"></i>
                    <span className="text-sm font-medium">{user.name.split(' ')[0]}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.type === 'cliente' && (
                      <DropdownMenuItem asChild>
                        <Link href="/pedidos">Meus Pedidos</Link>
                      </DropdownMenuItem>
                    )}
                    {user.type === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">Área Admin</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button 
                  className="hidden md:flex items-center space-x-1 hover:text-primary transition-colors"
                  onClick={() => setLoginOpen(true)}
                >
                  <i className="ri-user-line text-xl"></i>
                  <span className="text-sm font-medium">Entrar</span>
                </button>
              )}
              
              <button 
                className="p-2 text-neutral md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <i className={`text-xl ${mobileMenuOpen ? 'ri-close-line' : 'ri-menu-line'}`}></i>
              </button>
            </div>
          </div>
        </div>
        
        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="bg-white border-t md:hidden">
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
                    {user && user.type === 'cliente' && (
                      <Link href="/pedidos" className="hover:text-primary transition-colors py-2">
                        Meus Pedidos
                      </Link>
                    )}
                    {user && user.type === 'admin' && (
                      <Link href="/admin" className="hover:text-primary transition-colors py-2">
                        Área Admin
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link href="/admin" className="hover:text-primary transition-colors py-2">
                      Dashboard
                    </Link>
                    <Link href="/admin/produtos" className="hover:text-primary transition-colors py-2">
                      Produtos
                    </Link>
                    <Link href="/admin/pedidos" className="hover:text-primary transition-colors py-2">
                      Pedidos
                    </Link>
                    <Link href="/" className="hover:text-primary transition-colors py-2">
                      Loja
                    </Link>
                  </>
                )}
                
                {user ? (
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-1 hover:text-primary transition-colors py-2"
                  >
                    <i className="ri-logout-box-line text-xl"></i>
                    <span>Sair</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setLoginOpen(true);
                    }}
                    className="flex items-center space-x-1 hover:text-primary transition-colors py-2"
                  >
                    <i className="ri-user-line text-xl"></i>
                    <span>Entrar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Cart Sidebar */}
      <CartSidebar 
        isOpen={cartOpen} 
        onClose={() => setCartOpen(false)} 
      />
      
      {/* Login Modal */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Entre em sua conta</DialogTitle>
            <DialogDescription>
              Acesse sua conta para fazer pedidos e acompanhar seus pedidos
            </DialogDescription>
          </DialogHeader>
          <LoginForm onSuccess={() => setLoginOpen(false)} />
          <div className="text-center mt-4">
            <span className="text-sm text-neutral-dark">Não tem uma conta?</span>{" "}
            <button 
              onClick={showRegisterForm}
              className="text-sm text-primary hover:underline font-medium"
            >
              Cadastre-se
            </button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Register Modal */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Crie sua conta</DialogTitle>
            <DialogDescription>
              Crie uma conta para fazer pedidos e aproveitar nossas promoções
            </DialogDescription>
          </DialogHeader>
          <RegisterForm onSuccess={() => setRegisterOpen(false)} />
          <div className="text-center mt-4">
            <span className="text-sm text-neutral-dark">Já tem uma conta?</span>{" "}
            <button 
              onClick={showLoginForm}
              className="text-sm text-primary hover:underline font-medium"
            >
              Faça login
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
