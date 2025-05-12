// Determinar dinamicamente a URL base da API
const getBaseUrl = () => {
  // Se estivermos em produção e no Netlify
  if (import.meta.env.PROD && window.location.hostname !== 'localhost') {
    return '/.netlify/functions/api';
  }
  
  // Em desenvolvimento local
  return '/api';
};

export const API_BASE_URL = getBaseUrl(); 