import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { API_BASE_URL } from "./api";

// Função auxiliar para requisições da API que retorna a resposta completa
const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const endpoint = queryKey[0] as string;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status}`);
  }

  return response.json();
};

// Configuração do cliente de queries
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1
    }
  }
});
