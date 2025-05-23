-- Corrigir o esquema do banco de dados para permitir operações CRUD nas categorias e produtos

-- Verificar e adicionar coluna description se não existir
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Verificar e adicionar colunas necessárias na tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "isPromotion" BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;

-- Desativar o RLS para permitir operações sem autenticação
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Conceder permissões completas para usuário anônimo
GRANT ALL ON categories TO anon;
GRANT ALL ON products TO anon;
GRANT USAGE ON SCHEMA public TO anon; 