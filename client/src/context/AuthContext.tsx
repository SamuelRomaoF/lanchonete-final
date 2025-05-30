import { supabase } from "@/lib/supabase";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  type: 'cliente' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  session: Session | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

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
      // Por padrão, consideramos todos usuários autenticados como admin
      // Em uma implementação mais robusta, você pode verificar claims ou metadados
      type: 'admin'
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
  
  const login = async (email: string, password: string): Promise<User> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Erro no login:", error);
        throw new Error(error.message);
      }
      
      if (!data.user || !data.session) {
        throw new Error("Falha na autenticação");
      }
      
      const userData = convertSupabaseUser(data.user);
      setUser(userData);
      setSession(data.session);
      
      if (!userData) {
        throw new Error("Falha ao processar dados do usuário");
      }
      
      return userData;
    } catch (error) {
      console.error("Erro durante o login:", error);
      throw error;
    }
  };
  
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erro ao fazer logout:", error);
    }
    
    setUser(null);
    setSession(null);
  };
  
  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    session,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
