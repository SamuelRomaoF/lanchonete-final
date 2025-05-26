import { createClient } from '@supabase/supabase-js';

// Configuração direta para debug
const supabaseUrl = 'https://jkisabfnmzrgzazlazcq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraXNhYmZubXpyZ3phemxhemNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIyNzExMiwiZXhwIjoyMDYzODAzMTEyfQ.1jOzq5yx3eEiRGHEbYb18-3F9TYtNatUzBVNQri0Uyc';

console.log('Configurando Supabase com:', {
  url: supabaseUrl,
  serviceKey: supabaseServiceKey.substring(0, 10) + '...'
});

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Cliente Supabase do servidor inicializado'); 