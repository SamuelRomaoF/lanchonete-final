import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Inicializar com o tema do localStorage ou preferência do sistema, ou light como fallback
  const [theme, setTheme] = useState<Theme>(() => {
    // Verificar se há um tema salvo no localStorage
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    
    // Verificar se o usuário prefere dark mode pelo sistema
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    
    // Padrão para light
    return "light";
  });

  // Aplicar o tema ao documento quando ele muda
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remover a classe anterior
    root.classList.remove("light", "dark");
    
    // Adicionar a nova classe
    root.classList.add(theme);
    
    // Salvar no localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Função para alternar entre os temas
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook personalizado para usar o tema
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  }
  return context;
} 