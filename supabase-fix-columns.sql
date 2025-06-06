-- Primeiro, vamos verificar quais colunas existem
DO $$ 
BEGIN
    -- Adicionar colunas que podem estar faltando na tabela products
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'old_price') THEN
            ALTER TABLE products ADD COLUMN old_price NUMERIC;
        END IF;
    EXCEPTION WHEN duplicate_column THEN
        -- Coluna já existe
    END;

    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url') THEN
            ALTER TABLE products ADD COLUMN image_url TEXT;
        END IF;
    EXCEPTION WHEN duplicate_column THEN
        -- Coluna já existe
    END;

    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_featured') THEN
            ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT false;
        END IF;
    EXCEPTION WHEN duplicate_column THEN
        -- Coluna já existe
    END;

    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_promotion') THEN
            ALTER TABLE products ADD COLUMN is_promotion BOOLEAN DEFAULT false;
        END IF;
    EXCEPTION WHEN duplicate_column THEN
        -- Coluna já existe
    END;

    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'available') THEN
            ALTER TABLE products ADD COLUMN available BOOLEAN DEFAULT true;
        END IF;
    EXCEPTION WHEN duplicate_column THEN
        -- Coluna já existe
    END;

    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'created_at') THEN
            ALTER TABLE products ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
    EXCEPTION WHEN duplicate_column THEN
        -- Coluna já existe
    END;

    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'updated_at') THEN
            ALTER TABLE products ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
    EXCEPTION WHEN duplicate_column THEN
        -- Coluna já existe
    END;
END $$;

-- Agora vamos renomear apenas as colunas que existem em snake_case para camelCase
DO $$
BEGIN
    -- Renomear colunas na tabela products
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url') THEN
            ALTER TABLE products RENAME COLUMN image_url TO "imageUrl";
        END IF;
    EXCEPTION WHEN undefined_column THEN
        -- Coluna não existe
    END;

    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'old_price') THEN
            ALTER TABLE products RENAME COLUMN old_price TO "oldPrice";
        END IF;
    EXCEPTION WHEN undefined_column THEN
        -- Coluna não existe
    END;

    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_featured') THEN
            ALTER TABLE products RENAME COLUMN is_featured TO "isFeatured";
        END IF;
    EXCEPTION WHEN undefined_column THEN
        -- Coluna não existe
    END;

    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_promotion') THEN
            ALTER TABLE products RENAME COLUMN is_promotion TO "isPromotion";
        END IF;
    EXCEPTION WHEN undefined_column THEN
        -- Coluna não existe
    END;

    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'created_at') THEN
            ALTER TABLE products RENAME COLUMN created_at TO "createdAt";
        END IF;
    EXCEPTION WHEN undefined_column THEN
        -- Coluna não existe
    END;

    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'updated_at') THEN
            ALTER TABLE products RENAME COLUMN updated_at TO "updatedAt";
        END IF;
    EXCEPTION WHEN undefined_column THEN
        -- Coluna não existe
    END;

    -- Renomear colunas na tabela categories
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'created_at') THEN
            ALTER TABLE categories RENAME COLUMN created_at TO "createdAt";
        END IF;
    EXCEPTION WHEN undefined_column THEN
        -- Coluna não existe
    END;

    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'updated_at') THEN
            ALTER TABLE categories RENAME COLUMN updated_at TO "updatedAt";
        END IF;
    EXCEPTION WHEN undefined_column THEN
        -- Coluna não existe
    END;

    -- Renomear colunas na tabela orders
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_name') THEN
            ALTER TABLE orders RENAME COLUMN customer_name TO "customerName";
        END IF;
    EXCEPTION WHEN undefined_column THEN
        -- Coluna não existe
    END;

    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_amount') THEN
            ALTER TABLE orders RENAME COLUMN total_amount TO "totalAmount";
        END IF;
    EXCEPTION WHEN undefined_column THEN
        -- Coluna não existe
    END;

    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'ticket_number') THEN
            ALTER TABLE orders RENAME COLUMN ticket_number TO "ticketNumber";
        END IF;
    EXCEPTION WHEN undefined_column THEN
        -- Coluna não existe
    END;

    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'created_at') THEN
            ALTER TABLE orders RENAME COLUMN created_at TO "createdAt";
        END IF;
    EXCEPTION WHEN undefined_column THEN
        -- Coluna não existe
    END;
END $$;

-- Verificar o esquema atual
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products';

-- Corrigir colunas na tabela products
ALTER TABLE products RENAME COLUMN IF EXISTS "categoryId" TO category_id;
ALTER TABLE products RENAME COLUMN IF EXISTS "oldPrice" TO old_price;
ALTER TABLE products RENAME COLUMN IF EXISTS "imageUrl" TO image_url;
ALTER TABLE products RENAME COLUMN IF EXISTS "isFeatured" TO is_featured;
ALTER TABLE products RENAME COLUMN IF EXISTS "isPromotion" TO is_promotion;
ALTER TABLE products RENAME COLUMN IF EXISTS "createdAt" TO created_at;
ALTER TABLE products RENAME COLUMN IF EXISTS "updatedAt" TO updated_at;

-- Verificar o esquema atual
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders';

-- Corrigir colunas na tabela orders
ALTER TABLE orders RENAME COLUMN IF EXISTS "createdAt" TO created_at;
ALTER TABLE orders RENAME COLUMN IF EXISTS "customerName" TO customer_name;
ALTER TABLE orders RENAME COLUMN IF EXISTS "totalAmount" TO total_amount;
ALTER TABLE orders RENAME COLUMN IF EXISTS "ticketNumber" TO ticket_number;

-- Verificar o esquema atual
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories';

-- Corrigir colunas na tabela categories
ALTER TABLE categories RENAME COLUMN IF EXISTS "createdAt" TO created_at;
ALTER TABLE categories RENAME COLUMN IF EXISTS "updatedAt" TO updated_at;

-- Notifique se a operação foi concluída
DO $$
BEGIN
  RAISE NOTICE 'Colunas atualizadas com sucesso.';
END $$; 