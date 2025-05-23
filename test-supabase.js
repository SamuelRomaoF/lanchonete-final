// Script para testar a conexão com Supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv manualmente
const __dirname = dirname(fileURLToPath(import.meta.url));
// Modificando o caminho para encontrar o arquivo .env.local
const envPath = './client/.env.local';

try {
  console.log(`📂 Tentando ler arquivo em: ${envPath}`);
  // Carregar variáveis de ambiente manualmente
  const envFile = readFileSync(envPath, 'utf8');
  console.log(`📄 Conteúdo do arquivo (primeiros 20 caracteres): ${envFile.substring(0, 20)}...`);
  
  const envVars = envFile.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .reduce((acc, line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        acc[key] = value;
      }
      return acc;
    }, {});
  
  console.log("🔑 Variáveis encontradas:", Object.keys(envVars));
  
  // Verificar se as variáveis de ambiente existem
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Erro: Variáveis de ambiente do Supabase não encontradas.");
    console.log("Variáveis esperadas:");
    console.log("VITE_SUPABASE_URL=sua_url_supabase");
    console.log("VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase");
    console.log("Variáveis encontradas:");
    console.log(envVars);
    process.exit(1);
  }
  
  console.log("📡 Testando conexão com Supabase...");
  console.log(`URL: ${supabaseUrl}`);
  
  // Criar cliente Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Testar a conexão
  async function testConnection() {
    try {
      // Tentando uma operação simples para verificar a conexão
      const { data, error } = await supabase
        .from('categories')
        .select('count');
      
      if (error) {
        console.error("❌ Erro na conexão:", error.message);
        console.error("Detalhes:", error);
        return;
      }
      
      console.log("✅ Conexão estabelecida com sucesso!");
      console.log("Resposta:", data);
      
      // Verificar se há tabelas criadas
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_schema_info');
      
      if (tablesError) {
        console.warn("⚠️ Não foi possível verificar tabelas:", tablesError.message);
      } else if (tables && tables.length > 0) {
        console.log("\n📊 Tabelas encontradas:");
        tables.forEach(table => {
          console.log(`- ${table.table_name}`);
        });
      } else {
        console.warn("⚠️ Nenhuma tabela encontrada. Você precisa criar as tabelas no Supabase.");
      }
      
    } catch (err) {
      console.error("❌ Erro ao testar conexão:", err);
    }
  }
  
  // Executar o teste
  testConnection();
  
} catch (err) {
  console.error("❌ Erro ao carregar arquivo .env:", err);
  console.error("Detalhes do erro:", err.message);
  console.error("Código do erro:", err.code);
  process.exit(1);
} 