-- Desativar RLS completamente para categorias e produtos
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
 
-- Conceder permissões completas ao usuário anônimo
GRANT ALL ON categories TO anon;
GRANT ALL ON products TO anon;
GRANT USAGE ON SCHEMA public TO anon; 