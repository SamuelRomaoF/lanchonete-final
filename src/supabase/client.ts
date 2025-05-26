import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://anyauaosvlnumclyhroo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFueWF1YW9zdmxudW1jbHlocm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYzOTQxMzQsImV4cCI6MjAzMTk3MDEzNH0.H7z6vEkLEekltaDNl0HKj8TPo5yvLbVtdgTqEOSJuiA';

// Verificar se as chaves estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ As variáveis de ambiente do Supabase não estão configuradas!');
} else {
  console.log('✅ Supabase configurado com URL:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);