// Teste de conexão com Supabase
import { supabase } from './lib/supabase.js';

// Função assíncrona para testar a conexão
async function testSupabaseConnection() {
  try {
    console.log("Testando conexão com Supabase...");
    
    // Tentando fazer uma requisição simples para verificar autenticação
    const { data, error } = await supabase.from('categories').select('count');
    
    if (error) {
      console.error("❌ Erro na conexão com Supabase:", error.message);
      return false;
    }
    
    console.log("✅ Conexão com Supabase estabelecida com sucesso!");
    console.log("Dados recebidos:", data);
    return true;
  } catch (e) {
    console.error("❌ Erro ao conectar com Supabase:", e);
    return false;
  }
}

// Executar o teste
testSupabaseConnection(); 