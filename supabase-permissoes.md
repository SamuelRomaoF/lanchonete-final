# Guia de Resolução de Problemas de Permissões no Supabase

## Problema: Não consegue excluir categorias ou produtos

Se você estiver enfrentando problemas ao tentar excluir categorias ou produtos, mesmo vendo mensagens de sucesso nos logs, provavelmente é um problema de permissões no Supabase. Aqui estão as etapas para resolver:

### 1. Verificar as permissões da tabela no Supabase

1. Acesse o painel do Supabase
2. Vá para **Table Editor** > **Categorias**
3. Clique em **Policies**
4. Verifique se existe uma política de exclusão (DELETE) para a tabela
5. Se não existir, crie uma nova política com as seguintes configurações:
   - **Policy name**: `Permitir excluir categorias para admins`
   - **Target roles**: `authenticated`
   - **Using expression**: `auth.uid() IN (SELECT auth.uid() FROM auth.users WHERE email IN (SELECT email FROM users WHERE type = 'admin'))`

### 2. Executar o script SQL de correção

Execute o script `supabase-fix.sql` no **SQL Editor** do Supabase para corrigir automaticamente os problemas de permissão.

### 3. Verificar relacionamentos entre tabelas

Certifique-se de que não existam chaves estrangeiras bloqueando a exclusão. Execute estas consultas:

```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_name = 'products' OR ccu.table_name = 'categories');
```

### 4. Remover produtos associados à categoria

Antes de excluir uma categoria, é necessário:

1. Reclassificar ou excluir todos os produtos dessa categoria
2. Atualizar o campo `categoryId` para `null` ou outra categoria

### 5. Usar o endpoint RPC personalizado

Se a exclusão direta ainda não funcionar, tente usar o endpoint RPC personalizado que criamos:

```javascript
const { data, error } = await supabase.rpc("delete_category", {
  category_id: "ID_DA_CATEGORIA",
});
```

Este método tem verificações adicionais e é executado com permissões elevadas.

## Como funciona a exclusão de registros no Supabase

1. **Permissões**: O Supabase verifica se o usuário tem permissão para excluir
2. **Políticas RLS**: As políticas de segurança de linha determinam quais registros podem ser excluídos
3. **Chaves Estrangeiras**: Se houver uma restrição de chave estrangeira, a exclusão pode falhar silenciosamente
4. **Triggers**: Eventos de banco podem interferir na operação

## Dicas para Debug

1. Sempre verifique os logs do console para erros específicos
2. Use o botão "Atualizar" na página de categorias para garantir que as mudanças foram aplicadas
3. Verifique se o token de autenticação está sendo enviado corretamente
4. Tente excluir via SQL Editor diretamente no Supabase para verificar se funciona
