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
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Erro durante o login:", error);
      throw error;
    }
  };
  
  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout", {});
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
