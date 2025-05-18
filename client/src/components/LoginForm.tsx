import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";

interface LoginFormProps {
  onSuccess?: () => void;
}

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória"),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, navigate] = useLocation();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  // Verificar se há dados salvos no localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      form.setValue('email', savedEmail);
      form.setValue('remember', true);
    }
  }, [form]);
  
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      // Salvar email no localStorage se "Lembrar-me" estiver marcado
      if (data.remember) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Tentativa de login
      const user = await login(data.email, data.password);
      
      // Exibir toast de sucesso
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao painel administrativo!",
      });
      
      // Fechar o modal de login se necessário
      if (onSuccess) {
        onSuccess();
      }
      
      // Navegar diretamente para o painel admin se for um administrador
      if (user && user.type === 'admin') {
        navigate('/admin');
      }
      
    } catch (error) {
      console.error("Erro no login:", error);
      toast({
        title: "Erro no login",
        description: "Email ou senha incorretos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Seu email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    {...field}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-center">
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="remember"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="remember" className="text-sm">
                    Lembrar-me
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary-dark"
          disabled={isLoading}
        >
          {isLoading ? "Entrando..." : "Acessar Painel"}
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;
