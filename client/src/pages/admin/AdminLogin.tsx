import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "wouter";

const AdminLogin = () => {
  const { user } = useAuth();

  // Se já estiver autenticado como admin, redirecionar para o dashboard
  if (user && user.type === 'admin') {
    return <Redirect to="/admin" />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg border border-border">
        <div className="text-center">
          <i className="ri-admin-line text-4xl text-primary"></i>
          <h2 className="mt-6 text-2xl font-extrabold">Acesso Administrativo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Faça login para acessar o painel administrativo
          </p>
        </div>
        
        <LoginForm onSuccess={() => {}} />
        
        <div className="text-center mt-4">
          <a href="/" className="text-sm text-primary hover:underline">
            Voltar para a loja
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 