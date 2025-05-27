# Instruções para Corrigir o Esquema do Banco de Dados no Supabase

Este documento contém instruções para corrigir os nomes das colunas nas tabelas do banco de dados Supabase, alterando de camelCase para snake_case, que é o padrão recomendado pelo PostgreSQL.

## Passos para Aplicar as Correções

1. Acesse o painel de administração do seu projeto Supabase: https://app.supabase.com
2. Navegue até "SQL Editor" no menu lateral
3. Crie uma nova consulta SQL
4. Cole o conteúdo abaixo na janela de edição SQL
5. Execute o script clicando no botão "Run"

```sql
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

-- Verificar os esquemas atuais para confirmar as mudanças
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
```

## Verificação

Depois de executar o script, verifique se as colunas foram renomeadas corretamente:

1. Na seção "Table Editor", acesse cada uma das tabelas (products, categories, orders)
2. Confirme que os nomes das colunas estão em formato snake_case (ex: category_id, old_price, image_url)

## Próximos Passos

Após corrigir o esquema do banco de dados:

1. Execute o aplicativo com `npm run dev` para verificar se a conexão está funcionando corretamente
2. Teste a criação de categorias e produtos para confirmar que as operações estão funcionando com os novos nomes de colunas
3. Verifique se as listagens e consultas existentes estão funcionando corretamente

## Solução de Problemas

Se você ainda encontrar erros após aplicar estas correções:

1. Verifique as mensagens de erro no console do aplicativo para identificar quais consultas estão falhando
2. Inspecione as consultas SQL que estão sendo geradas pelo Supabase no log do console
3. Verifique se há diferenças entre os nomes de colunas usados no código e os nomes no banco de dados 