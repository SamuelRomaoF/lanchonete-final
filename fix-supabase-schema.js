import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
function loadEnv() {
  // Tentar carregar do .env na raiz
  dotenv.config();
  
  // Tentar carregar do client/.env.local se existir
  const clientEnvPath = path.join(__dirname, 'client', '.env.local');
  if (fs.existsSync(clientEnvPath)) {
    console.log(`📂 Tentando ler arquivo em: ${clientEnvPath}`);
    const envContent = fs.readFileSync(clientEnvPath, 'utf-8');
    console.log(`📄 Conteúdo do arquivo (primeiros 20 caracteres): ${envContent.substring(0, 20)}...`);
    
    // Parsear manualmente
    const envVars = {};
    envContent.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim().replace(/^['"]|['"]$/g, ''); // Remover aspas
        }
      }
    });
    
    console.log(`🔑 Variáveis encontradas: ${Object.keys(envVars)}`);
    
    // Atribuir manualmente
    if (envVars.VITE_SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL) {
      process.env.SUPABASE_URL = envVars.VITE_SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL;
    }
    if (envVars.VITE_SUPABASE_ANON_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      process.env.SUPABASE_KEY = envVars.VITE_SUPABASE_ANON_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
    if (envVars.SUPABASE_SERVICE_ROLE_KEY) {
      process.env.SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;
    }
  }
}

// Inicializar cliente Supabase
function initSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas');
    console.log('Por favor, defina SUPABASE_URL e SUPABASE_KEY ou SUPABASE_SERVICE_KEY');
    process.exit(1);
  }
  
  console.log(`🔌 Conectando ao Supabase: ${supabaseUrl}`);
  return createClient(supabaseUrl, supabaseKey);
}

// Verificar e corrigir esquema
async function checkAndFixSchema(supabase) {
  console.log('🔍 Verificando esquema...');
  
  try {
    // Obter esquema atual da tabela products
    const { data: productsColumns, error: productsError } = await supabase
      .rpc('get_table_columns', { table_name: 'products' });
    
    if (productsError) {
      console.error('❌ Erro ao obter colunas da tabela products:', productsError);
      // Tentar abordagem alternativa
      console.log('Tentando abordagem alternativa...');
      await fixSchemaWithSQL(supabase);
      return;
    }
    
    console.log('📋 Colunas da tabela products:', productsColumns);
    
    // Aplicar correções conforme necessário
    const columnMappings = {
      'categoryId': 'category_id',
      'oldPrice': 'old_price',
      'imageUrl': 'image_url',
      'isFeatured': 'is_featured',
      'isPromotion': 'is_promotion',
      'createdAt': 'created_at',
      'updatedAt': 'updated_at'
    };
    
    // Aplicar correções
    for (const [camelCase, snakeCase] of Object.entries(columnMappings)) {
      if (productsColumns.includes(camelCase)) {
        console.log(`🔄 Renomeando coluna ${camelCase} para ${snakeCase}...`);
        const { error } = await supabase.rpc('rename_column', {
          p_table: 'products',
          p_old_column: camelCase,
          p_new_column: snakeCase
        });
        
        if (error) {
          console.error(`❌ Erro ao renomear coluna ${camelCase}:`, error);
        } else {
          console.log(`✅ Coluna ${camelCase} renomeada para ${snakeCase}`);
        }
      }
    }
    
    console.log('✅ Verificação e correção de esquema concluídas');
  } catch (error) {
    console.error('❌ Erro ao verificar/corrigir esquema:', error);
    console.log('Tentando abordagem alternativa com SQL direto...');
    await fixSchemaWithSQL(supabase);
  }
}

// Aplicar correções com SQL direto
async function fixSchemaWithSQL(supabase) {
  console.log('🔧 Aplicando correções via SQL...');
  
  const sqlCommands = [
    // Products
    "ALTER TABLE IF EXISTS products RENAME COLUMN IF EXISTS \"categoryId\" TO category_id",
    "ALTER TABLE IF EXISTS products RENAME COLUMN IF EXISTS \"oldPrice\" TO old_price",
    "ALTER TABLE IF EXISTS products RENAME COLUMN IF EXISTS \"imageUrl\" TO image_url",
    "ALTER TABLE IF EXISTS products RENAME COLUMN IF EXISTS \"isFeatured\" TO is_featured", 
    "ALTER TABLE IF EXISTS products RENAME COLUMN IF EXISTS \"isPromotion\" TO is_promotion",
    "ALTER TABLE IF EXISTS products RENAME COLUMN IF EXISTS \"createdAt\" TO created_at",
    "ALTER TABLE IF EXISTS products RENAME COLUMN IF EXISTS \"updatedAt\" TO updated_at",
    
    // Orders
    "ALTER TABLE IF EXISTS orders RENAME COLUMN IF EXISTS \"createdAt\" TO created_at",
    "ALTER TABLE IF EXISTS orders RENAME COLUMN IF EXISTS \"customerName\" TO customer_name",
    "ALTER TABLE IF EXISTS orders RENAME COLUMN IF EXISTS \"totalAmount\" TO total_amount",
    "ALTER TABLE IF EXISTS orders RENAME COLUMN IF EXISTS \"ticketNumber\" TO ticket_number",
    
    // Categories
    "ALTER TABLE IF EXISTS categories RENAME COLUMN IF EXISTS \"createdAt\" TO created_at",
    "ALTER TABLE IF EXISTS categories RENAME COLUMN IF EXISTS \"updatedAt\" TO updated_at",
  ];
  
  for (const sql of sqlCommands) {
    try {
      console.log(`🔨 Executando: ${sql}`);
      const { error } = await supabase.rpc('run_sql', { sql });
      
      if (error) {
        console.error(`❌ Erro ao executar SQL:`, error);
      }
    } catch (error) {
      console.error(`❌ Erro ao executar SQL:`, error);
    }
  }
  
  console.log('✅ Correções via SQL aplicadas');
}

// Função principal
async function main() {
  try {
    console.log('🚀 Iniciando correção de esquema do Supabase...');
    
    // Carregar variáveis de ambiente
    loadEnv();
    
    // Inicializar cliente Supabase
    const supabase = initSupabase();
    
    // Verificar e corrigir esquema
    await checkAndFixSchema(supabase);
    
    console.log('✅ Processo concluído com sucesso');
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

// Executar
main(); 