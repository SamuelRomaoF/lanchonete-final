// Script para criar um usuário administrador no Supabase
// Execute com: node create-admin-user.js

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// Interface para leitura de input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Perguntar ao usuário
async function pergunta(questao) {
  return new Promise((resolve) => {
    rl.question(questao, (resposta) => {
      resolve(resposta);
    });
  });
}

async function main() {
  console.log('===== Criação de Usuário Admin no Supabase =====');
  
  // Solicitar informações do Supabase e do novo usuário
  const supabaseUrl = await pergunta('URL do Supabase: ');
  const supabaseServiceKey = await pergunta('Service Role Key do Supabase (admin key): ');
  const adminEmail = await pergunta('Email do administrador: ');
  const adminPassword = await pergunta('Senha do administrador (mínimo 6 caracteres): ');

  try {
    // Verificar se as informações estão corretas
    if (!supabaseUrl || !supabaseServiceKey || !adminEmail || !adminPassword) {
      throw new Error('Todas as informações são obrigatórias');
    }

    // Criar cliente Supabase com chave de admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('\nCriando usuário admin...');

    // Criar usuário
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: { role: 'admin' }
    });

    if (error) {
      throw new Error(`Erro ao criar usuário: ${error.message}`);
    }

    console.log('\n✅ Usuário admin criado com sucesso!');
    console.log(`ID do usuário: ${data.user.id}`);
    console.log(`Email: ${data.user.email}`);
    
    // Instruções adicionais
    console.log('\n===== Próximos Passos =====');
    console.log('1. Execute o SQL de configuração RLS (supabase-auth-setup.sql) no Console SQL do Supabase');
    console.log('2. Use o email e senha cadastrados para fazer login na área administrativa');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  } finally {
    rl.close();
  }
}

main(); 