import { useAuth } from "@/context/AuthContext";
import { Redirect } from "wouter";

interface AdminRouteProps {
  component: React.ComponentType<any>;
}

const AdminRoute = ({ component: Component }: AdminRouteProps) => {
  const { user, loading } = useAuth();

  // Enquanto está carregando, mostrar indicador de carregamento
  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]">Carregando...</div>;
  }

  // Se o usuário estiver autenticado como admin, mostrar o componente
  if (user && user.type === 'admin') {
    return <Component />;
  }

  // Se não estiver autenticado ou não for admin, redirecionar para página de login admin
  return <Redirect to="/admin/login" />;
};

export default AdminRoute; 