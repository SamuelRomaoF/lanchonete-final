-- Habilitar RLS nas tabelas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Criar políticas para categorias
-- Permitir leitura para todos (anônimos e autenticados)
CREATE POLICY "Permitir leitura para todos" ON categories
    FOR SELECT USING (true);

-- Permitir inserção/atualização/exclusão apenas para usuários autenticados
CREATE POLICY "Permitir modificação apenas para autenticados" ON categories
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização apenas para autenticados" ON categories
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão apenas para autenticados" ON categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Criar políticas para produtos
-- Permitir leitura para todos (anônimos e autenticados)
CREATE POLICY "Permitir leitura para todos" ON products
    FOR SELECT USING (true);

-- Permitir inserção/atualização/exclusão apenas para usuários autenticados
CREATE POLICY "Permitir modificação apenas para autenticados" ON products
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização apenas para autenticados" ON products
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão apenas para autenticados" ON products
    FOR DELETE USING (auth.role() = 'authenticated'); 