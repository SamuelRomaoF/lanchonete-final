import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { Eye, EyeOff, UserCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já está autenticado
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Tentando login com:", email, password);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log("Login bem-sucedido:", data);
      navigate('/admin');
    } catch (err: any) {
      setError('Email ou senha inválidos');
      console.error('Erro no login:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAdminUser = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Cria um usuário admin padrão para testes
    const adminEmail = 'admin@cantinhodosabor.com';
    const adminPassword = 'admin123';
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
      });
      
      if (error) throw error;
      
      setSuccess(`Usuário admin criado com sucesso! Email: ${adminEmail}, Senha: ${adminPassword}`);
      setEmail(adminEmail);
      setPassword(adminPassword);
      
    } catch (err: any) {
      setError('Erro ao criar usuário admin: ' + err.message);
      console.error('Erro ao criar usuário:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-[#2C1A10]' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full rounded-lg shadow-md p-8 ${theme === 'dark' ? 'bg-[#3C2A1F] border border-[#5a443c]' : 'bg-white'}`}>
        <div className="flex flex-col items-center mb-8">
          <UserCircle className="w-12 h-12 text-orange-500 mb-2" />
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Acesso Administrativo
          </h2>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Faça login para acessar o painel administrativo
          </p>
        </div>

        {error && (
          <div className={`${theme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-300'} border text-red-500 p-3 rounded-md mb-4`}>
            {error}
          </div>
        )}
        
        {success && (
          <div className={`${theme === 'dark' ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-300'} border text-green-500 p-3 rounded-md mb-4`}>
            {success}
          </div>
        )}
        
        {isAuthenticated && (
          <div className={`${theme === 'dark' ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-300'} border text-green-500 p-3 rounded-md mb-4`}>
            Você já está autenticado! <Link to="/admin" className="underline">Ir para o admin</Link>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`input-field ${theme === 'dark' ? 'bg-[#2C1A10] border-[#5a443c] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              placeholder="Seu email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input-field pr-10 ${theme === 'dark' ? 'bg-[#2C1A10] border-[#5a443c] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                placeholder="Sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="remember" className={`ml-2 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Lembrar-me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center"
          >
            {loading ? 'Entrando...' : 'Acessar Painel'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/" className="text-orange-500 hover:text-orange-600 text-sm">
            Voltar para a loja
          </Link>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#5a443c]">
          <button
            onClick={createAdminUser}
            disabled={loading}
            className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Criar usuário admin para testes
          </button>
        </div>
      </div>
    </div>
  );
}