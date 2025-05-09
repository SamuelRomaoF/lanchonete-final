import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface RegisterFormProps {
  onSuccess?: () => void;
}

const registerSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z
    .string()
    .min(1, "Confirmação de senha é obrigatória"),
  phone: z
    .string()
    .optional(),

  terms: z
    .boolean()
    .refine(val => val === true, {
      message: "Você deve aceitar os termos e condições",
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",

      terms: false,
    },
  });
  
  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    
    try {
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      
      toast({
        title: "Registro realizado com sucesso",
        description: "Sua conta foi criada com sucesso!",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro no registro:", error);
      toast({
        title: "Erro no registro",
        description: "Não foi possível criar a conta. Email já cadastrado.",
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input
                  placeholder="Seu nome completo"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="********"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirme a senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="********"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input
                  placeholder="(00) 00000-0000"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        

        
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex items-start space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="terms"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel htmlFor="terms" className="text-sm">
                  Concordo com os{" "}
                  <a href="#" className="text-primary hover:underline">Termos de Uso</a>{" "}
                  e{" "}
                  <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary-dark"
          disabled={isLoading}
        >
          {isLoading ? "Cadastrando..." : "Cadastrar"}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
