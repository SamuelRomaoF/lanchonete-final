import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const EmailSettings = () => {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [emailList, setEmailList] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    if (user && user.type !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Carregar a lista de e-mails cadastrados
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("GET", "/api/admin/email/recipients");
        const data = await response.json();
        
        if (response.ok) {
          setEmailList(data.emails || []);
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os e-mails cadastrados",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar e-mails:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao carregar os dados",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && user.type === "admin") {
      fetchEmails();
    }
  }, [user, toast]);
  
  // Adicionar um novo e-mail
  const handleAddEmail = async () => {
    // Validação básica de e-mail
    if (!newEmail || !newEmail.includes('@') || !newEmail.includes('.')) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, insira um endereço de e-mail válido",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await apiRequest("POST", "/api/admin/email/recipients", {
        email: newEmail,
      });
      
      if (response.ok) {
        // Atualizar a lista de e-mails
        setEmailList(prev => [...prev, newEmail]);
        setNewEmail("");
        
        toast({
          title: "E-mail adicionado",
          description: "O e-mail foi adicionado com sucesso",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erro",
          description: errorData.message || "Não foi possível adicionar o e-mail",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao adicionar e-mail:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar o e-mail",
        variant: "destructive",
      });
    }
  };
  
  // Remover um e-mail
  const handleRemoveEmail = async (email: string) => {
    try {
      const response = await apiRequest("DELETE", `/api/admin/email/recipients`, {
        email
      });
      
      if (response.ok) {
        // Atualizar a lista de e-mails
        setEmailList(prev => prev.filter(e => e !== email));
        
        toast({
          title: "E-mail removido",
          description: "O e-mail foi removido com sucesso",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível remover o e-mail",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao remover e-mail:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao remover o e-mail",
        variant: "destructive",
      });
    }
  };
  
  // Enviar e-mail de teste
  const handleTestEmail = async () => {
    if (emailList.length === 0) {
      toast({
        title: "Nenhum e-mail cadastrado",
        description: "Adicione pelo menos um e-mail para receber notificações",
        variant: "destructive",
      });
      return;
    }
    
    setIsTesting(true);
    try {
      const response = await apiRequest("POST", "/api/admin/email/test");
      
      if (response.ok) {
        toast({
          title: "E-mail de teste enviado",
          description: "Verifique sua caixa de entrada",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erro",
          description: errorData.message || "Não foi possível enviar o e-mail de teste",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao enviar e-mail de teste:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar o e-mail de teste",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  if (!user || user.type !== "admin") {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
        <p>Esta área é restrita a administradores.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Configurações de E-mail</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Notificações de Pedidos</CardTitle>
            <CardDescription>
              Configure os e-mails que receberão notificações quando novos pedidos forem feitos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
              <p className="text-amber-800">
                <strong>Importante:</strong> Adicione os e-mails do estabelecimento que devem receber
                notificações de novos pedidos. Você pode adicionar múltiplos e-mails.
              </p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">E-mails cadastrados</h3>
              
              {isLoading ? (
                <p className="text-sm text-neutral">Carregando...</p>
              ) : emailList.length === 0 ? (
                <p className="text-sm text-neutral-dark">Nenhum e-mail cadastrado</p>
              ) : (
                <ul className="space-y-2">
                  {emailList.map((email) => (
                    <li key={email} className="flex items-center justify-between p-2 bg-neutral-50 rounded">
                      <span>{email}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEmail(email)}
                        className="h-8 w-8 p-0 text-neutral-dark hover:text-destructive"
                      >
                        <i className="ri-delete-bin-line" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Adicionar novo e-mail"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <Button onClick={handleAddEmail}>Adicionar</Button>
            </div>
            
            <div className="mt-8">
              <Button 
                onClick={handleTestEmail} 
                disabled={isTesting || emailList.length === 0}
                variant="outline"
              >
                {isTesting ? 'Enviando...' : 'Enviar e-mail de teste'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailSettings; 