import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { fetchFromApi } from "./api";

// Função auxiliar para requisições da API que retorna a resposta completa
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  try {
    const response = await fetchFromApi(url, {
      method,
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    return response;
  } catch (error) {
    console.error(`Erro na requisição ${method} ${url}:`, error);
    throw error;
  }
}

// Função para gerar a função de consulta padrão
function createQueryFn({ on401 = "throw" }: { on401?: "throw" | "redirect" } = {}) {
  return (async ({ queryKey }) => {
    const [endpoint, params] = queryKey;
    
    if (typeof endpoint !== "string") {
      throw new Error(`Expected queryKey[0] to be a string, got: ${typeof endpoint}`);
    }

    try {
      // Usar a função fetchFromApi para fazer requisições
      return await fetchFromApi(endpoint, {
        method: 'GET',
      });
    } catch (error) {
      console.error(`Erro na consulta ${endpoint}:`, error);
      throw error;
    }
  }) as QueryFunction;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: createQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
