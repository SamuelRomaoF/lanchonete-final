-- Habilitar as extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de categorias
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de produtos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    old_price NUMERIC,
    category_id UUID REFERENCES categories(id),
    available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_promotion BOOLEAN DEFAULT false,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de pedidos
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    ticket_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias
CREATE POLICY "Permitir leitura para todos" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Permitir modificação apenas para autenticados" ON categories
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização apenas para autenticados" ON categories
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão apenas para autenticados" ON categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para produtos
CREATE POLICY "Permitir leitura para todos" ON products
    FOR SELECT USING (true);

CREATE POLICY "Permitir modificação apenas para autenticados" ON products
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização apenas para autenticados" ON products
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão apenas para autenticados" ON products
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para pedidos
CREATE POLICY "Permitir leitura apenas para autenticados" ON orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir criação para todos" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização apenas para autenticados" ON orders
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated'); 