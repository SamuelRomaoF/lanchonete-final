-- Função para verificar se uma coluna existe e renomeá-la
CREATE OR REPLACE FUNCTION rename_column_if_exists(
    table_name text,
    old_column text,
    new_column text
) RETURNS void AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = rename_column_if_exists.table_name
        AND column_name = old_column
    ) THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', table_name, old_column, new_column);
        RAISE NOTICE 'Coluna % renomeada para % na tabela %', old_column, new_column, table_name;
    ELSE
        RAISE NOTICE 'Coluna % não existe na tabela %, pulando', old_column, table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Aplicar renomeações
SELECT rename_column_if_exists('products', 'categoryId', 'category_id');
SELECT rename_column_if_exists('products', 'oldPrice', 'old_price');
SELECT rename_column_if_exists('products', 'imageUrl', 'image_url');
SELECT rename_column_if_exists('products', 'isFeatured', 'is_featured');
SELECT rename_column_if_exists('products', 'isPromotion', 'is_promotion');
SELECT rename_column_if_exists('products', 'createdAt', 'created_at');
SELECT rename_column_if_exists('products', 'updatedAt', 'updated_at');

SELECT rename_column_if_exists('orders', 'createdAt', 'created_at');
SELECT rename_column_if_exists('orders', 'customerName', 'customer_name');
SELECT rename_column_if_exists('orders', 'totalAmount', 'total_amount');
SELECT rename_column_if_exists('orders', 'ticketNumber', 'ticket_number');

SELECT rename_column_if_exists('categories', 'createdAt', 'created_at');
SELECT rename_column_if_exists('categories', 'updatedAt', 'updated_at');

-- Verificar os esquemas atuais
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders';

-- Dropar a função após uso
DROP FUNCTION rename_column_if_exists; 