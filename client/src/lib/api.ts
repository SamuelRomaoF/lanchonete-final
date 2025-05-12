// API URL base, será substituída em produção pelo Netlify
export const API_BASE_URL = import.meta.env.PROD ? '/.netlify/functions/api' : '/api';

// Função de utilidade para fazer requisições à API
export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  // Remover prefixo '/api' duplicado caso exista
  const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
  
  // Construir URL completa
  const url = `${API_BASE_URL}${cleanEndpoint.startsWith('/') ? cleanEndpoint : '/' + cleanEndpoint}`;
  
  console.log(`Fazendo requisição para: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      console.error(`Erro na API: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`Detalhes: ${text}`);
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao chamar API ${url}:`, error);
    throw error;
  }
} 