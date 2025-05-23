import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltam variáveis de ambiente do Supabase');
}

console.log('Conectando ao Supabase URL:', supabaseUrl);

// Criar cliente com opções avançadas para persistência de sessão
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,  // Manter a sessão entre recargas
    autoRefreshToken: true, // Atualizar token automaticamente
    storage: window.localStorage, // Usar localStorage para persistir sessão
  },
  global: {
    headers: {
      'X-App-Name': 'FaleComigo',
    },
  },
  db: {
    schema: 'public',
  },
});

// Log para verificar se o cliente foi inicializado corretamente
console.log('Cliente Supabase inicializado:', !!supabase);

// Verificar conexão com o Supabase e status de autenticação
supabase.auth.getSession().then(response => {
  if (response.error) {
    console.error('Erro ao conectar com Supabase:', response.error);
  } else {
    console.log('Conexão com Supabase estabelecida');
    if (response.data?.session) {
      console.log('Usuário autenticado no Supabase');
    } else {
      console.log('Nenhum usuário autenticado no Supabase');
    }
  }
});