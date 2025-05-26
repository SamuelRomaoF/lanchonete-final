import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = 'https://jkisabfnmzrgzazlazcq.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  throw new Error('SUPABASE_ANON_KEY não está configurada nas variáveis de ambiente!');
}

export const supabase = createClient(supabaseUrl, supabaseKey); 