# Instruções para Configuração do Supabase

## 1. Criar Projeto no Supabase

1. Acesse https://app.supabase.com
2. Clique em "New Project"
3. Preencha as informações:
   - Nome do projeto: FaleComigo
   - Banco de dados: Escolha a senha mais segura
   - Região: Escolha a mais próxima
   - Pricing Plan: Free tier

## 2. Configurar Variáveis de Ambiente

1. No projeto Supabase, vá em Settings > API
2. Copie as seguintes informações:
   - Project URL
   - anon public key
3. Crie um arquivo `.env.local` na pasta `client` com:

```
VITE_SUPABASE_URL=sua_project_url
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

## 3. Configurar Banco de Dados

1. No Supabase, vá em SQL Editor
2. Execute os seguintes scripts na ordem:
   - `supabase-setup.sql` (Criar tabelas e políticas)
   - `supabase-storage-permissions.sql` (Configurar storage)

## 4. Criar Usuário Administrador

1. Instale as dependências:

```bash
npm install
```

2. Execute o script de criação de admin:

```bash
node create-admin-user.js
```

3. Siga as instruções no terminal:
   - Cole a URL do Supabase
   - Cole a Service Role Key (encontrada em Settings > API)
   - Digite o email do administrador
   - Digite a senha do administrador

## 5. Verificar Configuração

1. Execute o projeto:

```bash
npm run dev
```

2. Acesse a rota de admin (/admin/login)
3. Faça login com as credenciais criadas
4. Verifique se consegue:
   - Ver a lista de produtos
   - Criar um novo produto com imagem
   - Editar um produto existente
   - Excluir um produto

## Resolução de Problemas

Se encontrar problemas:

1. Verifique os logs no console do navegador
2. Confirme que todas as variáveis de ambiente estão corretas
3. Verifique se os scripts SQL foram executados com sucesso
4. Confirme que o usuário admin foi criado corretamente

## Estrutura de Arquivos Importantes

```
client/
  ├── src/
  │   ├── lib/
  │   │   ├── supabase.ts    # Configuração do cliente Supabase
  │   │   └── storage.ts     # Funções para gerenciar imagens
  │   └── context/
  │       └── AuthContext.tsx # Contexto de autenticação
```

## Políticas de Segurança

- Produtos e Categorias:

  - Leitura: Permitida para todos
  - Escrita/Edição/Exclusão: Apenas usuários autenticados

- Storage (Imagens):
  - Upload/Delete: Apenas usuários autenticados
  - Download: Público

## Suporte

Se precisar de ajuda:

1. Verifique a documentação do Supabase: https://supabase.com/docs
2. Consulte os logs do Supabase em Database > Logs
3. Verifique as políticas RLS em Database > Policies
