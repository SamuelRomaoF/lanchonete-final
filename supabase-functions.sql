-- Função para excluir categoria diretamente via SQL (com verificação de segurança)
CREATE OR REPLACE FUNCTION delete_category_direct(category_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autorizado: usuário não autenticado';
  END IF;

  -- Excluir produtos associados primeiro (se necessário)
  DELETE FROM products WHERE "categoryId" = category_id;
  
  -- Excluir a categoria
  DELETE FROM categories WHERE id = category_id;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER; -- Execute como proprietário da função (maior privilégio)

-- Garantir que usuários autenticados possam chamar esta função
GRANT EXECUTE ON FUNCTION delete_category_direct(UUID) TO authenticated;

-- Função para excluir produto diretamente via SQL (com verificação de segurança)
CREATE OR REPLACE FUNCTION delete_product_direct(product_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autorizado: usuário não autenticado';
  END IF;
  
  -- Excluir o produto
  DELETE FROM products WHERE id = product_id;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER;

-- Garantir que usuários autenticados possam chamar esta função
GRANT EXECUTE ON FUNCTION delete_product_direct(UUID) TO authenticated; 