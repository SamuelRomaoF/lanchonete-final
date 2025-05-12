// Determinar dinamicamente a URL base da API
const getBaseUrl = () => {
  // Se estivermos em produção e no Netlify
  if (import.meta.env.PROD) {
    const hostname = window.location.hostname;
    console.log('Ambiente de produção detectado, hostname:', hostname);
    
    // Estamos no Netlify
    if (hostname.includes('netlify.app') || !hostname.includes('localhost')) {
      console.log('Usando URL base para Netlify: /.netlify/functions/api');
      return '/.netlify/functions';
    }
  }
  
  // Em desenvolvimento local
  console.log('Usando URL base para desenvolvimento: /api');
  return '/api';
};

export const API_BASE_URL = getBaseUrl();

// Função de utilidade para fazer requisições à API
export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  // Ajustar o endpoint para evitar duplicação de 'api' nas URLs quando em produção
  let url: string;
  
  if (API_BASE_URL === '/.netlify/functions') {
    // Em produção/Netlify
    url = `${API_BASE_URL}/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  } else {
    // Em desenvolvimento
    url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }
  
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