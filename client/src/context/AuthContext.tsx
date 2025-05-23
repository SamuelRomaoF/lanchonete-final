import { supabase } from "@/lib/supabase";
import { User } from "@shared/schema";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Converter usuário Supabase para nosso formato de usuário
  const convertSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
    if (!supabaseUser) return null;
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name: supabaseUser.user_metadata?.name || "Usuário",
      type: 'admin',
      address: "",
      phone: "",
    };
  };
  
  const checkAuth = async () => {
    try {
      // Verificar sessão atual
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Erro ao verificar sessão:", error);
        return;
      }
      
      if (data && data.session) {
        setSession(data.session);
        const userData = convertSupabaseUser(data.session.user);
        setUser(userData);
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Configurar listener de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Estado de autenticação alterado:", _event);
      setSession(session);
      setUser(convertSupabaseUser(session?.user || null));
    });

    checkAuth();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Credenciais inválidas');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };
  
  const register = async (data: { name: string; email: string; password: string }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar conta');
      }

      const responseData = await response.json();
      setUser(responseData.user);
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  };
  
  const logout = () => {
    setUser(null);
  };
  
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    session,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
