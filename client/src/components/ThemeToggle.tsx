import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext.js";
import { Button } from "./ui/button.js";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className}
      aria-label={`Mudar para tema ${theme === "light" ? "escuro" : "claro"}`}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
} 