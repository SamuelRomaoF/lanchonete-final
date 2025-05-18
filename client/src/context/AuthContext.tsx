import { apiRequest } from "@/lib/queryClient";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  type: 'cliente' | 'admin';
}

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Chave para armazenar o token de autenticação no localStorage
const AUTH_TOKEN_KEY = 'fastlanche_auth_token';
const USER_DATA_KEY = 'fastlanche_user_data';

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Função para verificar autenticação usando token armazenado
  const checkAuth = async () => {
    try {
      // Verificar se há token no localStorage
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      
      if (!token) {
        console.log("Nenhum token encontrado no localStorage");
        setLoading(false);
        return;
      }
      
      console.log("Token encontrado no localStorage, verificando...");
      
      // Usando o token armazenado para autenticar
      const response = await fetch("/api/auth/me", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Dados do usuário recuperados:", data);
        
        // Atualizar o estado com os dados do usuário
        setUser(data.user);
        
        // Também atualizar no localStorage para persistência
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
      } else {
        console.log("Token inválido ou expirado");
        
        // Limpar os dados de autenticação inválidos
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Verificar autenticação ao carregar
  useEffect(() => {
    // Tentar restaurar dados do usuário do localStorage primeiro (para UX imediata)
    const savedUserData = localStorage.getItem(USER_DATA_KEY);
    if (savedUserData) {
      try {
        const userData = JSON.parse(savedUserData);
        setUser(userData);
      } catch (e) {
        console.error("Erro ao parsear dados do usuário:", e);
      }
    }
    
    // Em seguida, verificar com o servidor para garantir que a sessão ainda é válida
    checkAuth();
  }, []);
  
  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro no login:", errorData);
        throw new Error(errorData.error || "Erro ao fazer login");
      }
      
      const data = await response.json();
      console.log("Login bem-sucedido:", data);

      if (data.token) {
        // Salvar token de autenticação no localStorage
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        
        // Garantir que os dados do usuário estejam no formato correto
        const userData = data.user;
        
        // Também salvar dados do usuário no localStorage
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        
        setUser(userData);
        return userData;
      } else {
        throw new Error("Token de autenticação não recebido");
      }
    } catch (error) {
      console.error("Erro durante o login:", error);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      // Limpar dados de autenticação do localStorage
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      
      // Também notificar o servidor (opcional)
      await apiRequest("POST", "/api/auth/logout", {});
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      // Garantir que o usuário seja deslogado mesmo se houver erro na API
      setUser(null);
    }
  };
  
  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
