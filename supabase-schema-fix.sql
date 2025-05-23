-- Corrigir esquema das tabelas 'categories' e 'products'

-- Verificar se a tabela 'categories' existe, senão criar
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT
);

-- Verificar se a tabela 'products' existe, senão criar
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  "categoryId" UUID REFERENCES categories(id),
  "imageUrl" TEXT,
  "isFeatured" BOOLEAN DEFAULT false,
  "isPromotion" BOOLEAN DEFAULT false
);

-- Tentar adicionar colunas faltantes (vai ignorar se já existirem)
DO $$
BEGIN
  -- Adicionar coluna description se não existir
  BEGIN
    ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
  EXCEPTION WHEN duplicate_column THEN
    -- Coluna já existe
  END;
  
  -- Adicionar outras colunas potencialmente faltantes
  BEGIN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
  EXCEPTION WHEN duplicate_column THEN
    -- Coluna já existe
  END;
  
  BEGIN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
  EXCEPTION WHEN duplicate_column THEN
    -- Coluna já existe
  END;
  
  BEGIN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT false;
  EXCEPTION WHEN duplicate_column THEN
    -- Coluna já existe
  END;
  
  BEGIN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS "isPromotion" BOOLEAN DEFAULT false;
  EXCEPTION WHEN duplicate_column THEN
    -- Coluna já existe
  END;
END $$;

-- Desativar RLS completamente para categorias e produtos
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Conceder permissões completas ao usuário anônimo
GRANT ALL ON categories TO anon;
GRANT ALL ON products TO anon;
GRANT USAGE ON SCHEMA public TO anon; 