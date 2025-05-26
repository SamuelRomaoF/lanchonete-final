import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function EmailSettings() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings/email`);
        if (!response.ok) throw new Error('Falha ao carregar configurações');
        const data = await response.json();
        setEmail(data.email || "");
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações de e-mail",
          variant: "destructive",
        });
      }
    };

    loadSettings();
  }, [user, setLocation, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/settings/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Falha ao salvar configurações');

      toast({
        title: "Sucesso",
        description: "Configurações de e-mail atualizadas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações de e-mail",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Configurações de E-mail</CardTitle>
          <CardDescription>
            Configure o e-mail que receberá as notificações de pedidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
} 