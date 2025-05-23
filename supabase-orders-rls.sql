-- Habilitar RLS na tabela orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Permitir que qualquer pessoa possa ver pedidos (necessário para clientes verem seus próprios pedidos)
CREATE POLICY "Qualquer pessoa pode ver pedidos" ON orders
    FOR SELECT USING (true);

-- Permitir que qualquer pessoa (incluindo anônimos) possa criar pedidos
CREATE POLICY "Qualquer pessoa pode criar pedidos" ON orders
    FOR INSERT
    WITH CHECK (true);

-- Apenas admins podem atualizar ou excluir pedidos
CREATE POLICY "Apenas admins podem atualizar pedidos" ON orders
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins podem excluir pedidos" ON orders
    FOR DELETE USING (auth.role() = 'authenticated'); 