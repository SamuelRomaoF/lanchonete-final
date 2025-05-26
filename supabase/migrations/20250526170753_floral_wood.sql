/*
  # Configuração de autenticação do admin
  
  1. Configurações
    - Habilita autenticação por email/senha
    - Cria políticas de acesso para admin
  
  2. Dados Iniciais
    - Cria usuário admin inicial
*/

-- Habilita autenticação por email/senha
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cria políticas de acesso para admin
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Allow admin full access'
  ) THEN
    CREATE POLICY "Allow admin full access"
      ON products
      FOR ALL
      TO authenticated
      USING (auth.email() = 'admin@lanchonete.com')
      WITH CHECK (auth.email() = 'admin@lanchonete.com');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Allow admin full access'
  ) THEN
    CREATE POLICY "Allow admin full access"
      ON categories
      FOR ALL
      TO authenticated
      USING (auth.email() = 'admin@lanchonete.com')
      WITH CHECK (auth.email() = 'admin@lanchonete.com');
  END IF;
END $$;