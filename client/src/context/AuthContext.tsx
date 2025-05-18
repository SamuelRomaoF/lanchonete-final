import { apiRequest } from "@/lib/queryClient";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  type: 'cliente' | 'admin';
}

interface AuthToken {
  token: string;
  user: User;
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
  
  const checkAuth = async () => {
    try {
      // Primeiro verificar se há token no localStorage
      const savedAuthData = localStorage.getItem('authData');
      
      if (savedAuthData) {
        try {
          // Tentar usar o token salvo
          const authData: AuthToken = JSON.parse(savedAuthData);
          
          // Usar o token para fazer uma requisição de validação
          const response = await fetch("/api/auth/me", {
            headers: {
              "Authorization": `Bearer ${authData.token}`
            }
          });
          
          if (response.ok) {
            // Token válido, definir usuário
            const data = await response.json();
            console.log("Autenticação restaurada do localStorage:", data);
            setUser(data.user || authData.user);
            return;
          } else {
            // Token inválido, remover do localStorage
            console.log("Token salvo inválido, removendo do localStorage");
            localStorage.removeItem('authData');
          }
        } catch (parseError) {
          console.error("Erro ao processar token salvo:", parseError);
          localStorage.removeItem('authData');
        }
      }
      
      // Se não houver token ou o token for inválido, verificar a autenticação normal
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Dados do usuário recuperados:", data);
        setUser(data.user);
      } else {
        console.log("Usuário não autenticado");
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
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
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro no login:", errorData);
        throw new Error(errorData.message || "Erro ao fazer login");
      }
      
      const data = await response.json();
      console.log("Login bem-sucedido:", data);

      // Garantir que os dados do usuário estejam no formato correto
      const userData = data.user || data;
      
      // Salvar dados de autenticação no localStorage
      if (data.token) {
        localStorage.setItem('authData', JSON.stringify({
          token: data.token,
          user: userData
        }));
      }
      
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Erro durante o login:", error);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
    } catch (error) {
      console.error("Erro ao fazer logout na API:", error);
    }
    
    // Remover dados de autenticação do localStorage
    localStorage.removeItem('authData');
    setUser(null);
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
