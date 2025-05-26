import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Store from './pages/Store';
import { useEffect } from 'react';
import { useSupabase } from './lib/supabase-provider';
import { useNavigate } from 'react-router-dom';

function App() {
  const { supabase } = useSupabase();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // If not authenticated, redirect to login
        // In a real app, you would redirect to a login page
        console.log('User is not authenticated');
        // navigate('/login');
      }
    });
  }, [supabase, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="categorias" element={<Categories />} />
        <Route path="produtos" element={<Products />} />
        <Route path="pedidos" element={<Orders />} />
        <Route path="loja" element={<Store />} />
      </Route>
    </Routes>
  );
}

export default App;