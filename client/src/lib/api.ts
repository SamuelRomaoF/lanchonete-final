// API URL base, será substituída em produção pelo Netlify
export const API_BASE_URL = import.meta.env.PROD ? '/.netlify/functions/api' : '/api';

// Chave para o token de autenticação no localStorage
const AUTH_TOKEN_KEY = 'fastlanche_auth_token';

// Função de utilidade para fazer requisições à API
export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  // Remover prefixo '/api' duplicado caso exista
  const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
  
  // Construir URL completa
  const url = `${API_BASE_URL}${cleanEndpoint.startsWith('/') ? cleanEndpoint : '/' + cleanEndpoint}`;
  
  console.log(`Fazendo requisição para: ${url}`);
  
  // Adicionar token de autenticação se disponível no localStorage
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  
  // Criar objeto de headers
  const requestHeaders = new Headers({
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  });
  
  // Adicionar headers personalizados se fornecidos
  if (options.headers) {
    const customHeaders = new Headers(options.headers);
    customHeaders.forEach((value, key) => {
      requestHeaders.set(key, value);
    });
  }
  
  // Adicionar token de autenticação ao header se disponível
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: requestHeaders,
    });
    
    // Tratamento especial para DELETE: se for 404, tratamos como sucesso
    if (!response.ok) {
      console.error(`Erro na API: ${response.status} ${response.statusText}`);
      
      // Se for uma operação DELETE e erro 404, simular sucesso (o recurso já não existe)
      if (options.method === 'DELETE' && response.status === 404) {
        console.log('Operação DELETE com erro 404 - Simulando sucesso pois o recurso já não existe');
        return { success: true, message: 'Recurso já não existe', status: 'DELETED' };
      }
      
      const text = await response.text();
      console.error(`Detalhes: ${text}`);
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    // Para respostas vazias, retornar objeto de sucesso
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return { success: true };
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao chamar API ${url}:`, error);
    throw error;
  }
} 