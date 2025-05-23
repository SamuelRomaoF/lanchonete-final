# Instruções para Implementar Autenticação no FaleComigo

Este guia explica como implementar a autenticação com Supabase para proteger a área administrativa do aplicativo FaleComigo.

## 1. Configuração das Políticas RLS no Supabase

1. Acesse o painel administrativo do seu projeto Supabase.
2. Vá para a seção "SQL Editor".
3. Execute o script `supabase-auth-setup.sql` para configurar as políticas de segurança:

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Criar políticas para categorias
-- Permitir leitura para todos (anônimos e autenticados)
CREATE POLICY "Permitir leitura para todos" ON categories
    FOR SELECT USING (true);

-- Permitir inserção/atualização/exclusão apenas para usuários autenticados
CREATE POLICY "Permitir modificação apenas para autenticados" ON categories
    FOR INSERT USING (auth.role() = 'authenticated')
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
    FOR INSERT USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização apenas para autenticados" ON products
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão apenas para autenticados" ON products
    FOR DELETE USING (auth.role() = 'authenticated');
```

## 2. Criar Usuário Administrador

### Opção 1: Usando o Script

1. Instale as dependências necessárias:

   ```
   npm install @supabase/supabase-js
   ```

2. Execute o script para criar um usuário admin:

   ```
   node create-admin-user.js
   ```

3. Siga as instruções no terminal para fornecer:
   - URL do Supabase
   - Service Role Key do Supabase (chave com permissões admin)
   - Email do administrador
   - Senha do administrador

### Opção 2: Pelo Painel do Supabase

1. Acesse o painel do Supabase > Authentication > Users
2. Clique em "Invite" ou "Add User"
3. Insira o email e senha do administrador
4. Após criar o usuário, você pode adicionar metadados (opcional):
   - Vá para o usuário criado
   - Adicione um metadado com `role` = `admin`

## 3. Acesso ao Sistema

1. Acesse a área administrativa do FaleComigo: `/admin/login`
2. Faça login com o email e senha do administrador criado
3. Após o login, você será redirecionado para o painel administrativo
4. Todas as operações de adição, edição e exclusão agora requerem autenticação

## Segurança

Com esta implementação:

- Os usuários anônimos (clientes do site) podem visualizar produtos e categorias
- Apenas usuários autenticados (administradores) podem adicionar, editar ou excluir produtos e categorias
- O Row Level Security (RLS) do Supabase garante que essas regras sejam aplicadas no nível do banco de dados

## Resolução de Problemas

Se encontrar problemas com a autenticação:

1. Verifique se as políticas RLS foram aplicadas corretamente
2. Confirme se as variáveis de ambiente do Supabase estão configuradas:
   - `VITE_SUPABASE_URL`: URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase
3. Verifique os logs no console do navegador para identificar erros de autenticação
