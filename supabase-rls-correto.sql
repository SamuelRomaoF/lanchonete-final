-- MANTER RLS ativado e criar políticas específicas para operações
-- Este script configura políticas RLS corretas que permitem segurança e funcionalidade

-- Garantir que RLS está habilitado
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes que possam estar causando problemas
DROP POLICY IF EXISTS categories_select_policy ON categories;
DROP POLICY IF EXISTS categories_insert_policy ON categories;
DROP POLICY IF EXISTS categories_update_policy ON categories;
DROP POLICY IF EXISTS categories_delete_policy ON categories;

DROP POLICY IF EXISTS products_select_policy ON products;
DROP POLICY IF EXISTS products_insert_policy ON products;
DROP POLICY IF EXISTS products_update_policy ON products;
DROP POLICY IF EXISTS products_delete_policy ON products;

-- Adicionar políticas corretas para categorias
-- Permitir SELECT para todos (leitura pública)
CREATE POLICY categories_select_policy ON categories
  FOR SELECT USING (true);

-- Permitir INSERT/UPDATE/DELETE apenas para usuários autenticados
CREATE POLICY categories_insert_policy ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY categories_update_policy ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY categories_delete_policy ON categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- Adicionar políticas corretas para produtos
-- Permitir SELECT para todos (leitura pública)
CREATE POLICY products_select_policy ON products
  FOR SELECT USING (true);

-- Permitir INSERT/UPDATE/DELETE apenas para usuários autenticados
CREATE POLICY products_insert_policy ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY products_update_policy ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY products_delete_policy ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Garantir que 'anon' tenha permissões básicas necessárias
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON products TO anon;

-- Garantir que usuários autenticados tenham todas as permissões necessárias
GRANT ALL ON categories TO authenticated;
GRANT ALL ON products TO authenticated; 