import { Routes, Route, useLocation } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
// Import das páginas de admin
import AdminLayout from './components/admin/Layout';
import Dashboard from './pages/admin/Dashboard';
import Categories from './pages/admin/Categories';
import Products from './pages/admin/Products';
import Orders from './pages/admin/Orders';

function App() {
  const { theme } = useTheme();
  const location = useLocation();
  
  // Verificar se estamos em uma rota de admin
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen">
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />
        {/* Rotas de Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="categorias" element={<Categories />} />
          <Route path="produtos" element={<Products />} />
          <Route path="pedidos" element={<Orders />} />
        </Route>
        {/* Rotas de Cliente */}
        <Route
          path="/*"
          element={
            <>
              <Navbar />
              <main className="min-h-[calc(100vh-160px)]">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/cardapio" element={<MenuPage />} />
                  <Route path="/carrinho" element={<CartPage />} />
                </Routes>
              </main>
              <Footer />
            </>
          }
        />
      </Routes>
    </div>
  );
}

export default App;