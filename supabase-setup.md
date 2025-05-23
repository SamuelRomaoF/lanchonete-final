# Configuração do Supabase

## Credenciais necessárias

Para conectar o projeto ao Supabase, você precisará das seguintes variáveis de ambiente:

```
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase
```

## Onde encontrar suas credenciais

1. Acesse https://app.supabase.io
2. Selecione seu projeto
3. Vá para Settings > API
4. Você encontrará:
   - URL = "Project URL"
   - ANON KEY = "anon public"

## Configuração local

Crie um arquivo `.env.local` na pasta `client` com as variáveis acima.

## Configuração no Netlify

1. Vá para o seu projeto no Netlify
2. Navegue até Site settings > Build & deploy > Environment
3. Adicione as variáveis:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

## Estrutura do banco de dados

Você precisará criar as seguintes tabelas no Supabase:

### categories

- id (uuid, primary key)
- name (text, not null)
- created_at (timestamp with timezone)
- updated_at (timestamp with timezone)

### products

- id (uuid, primary key)
- name (text, not null)
- description (text)
- price (numeric, not null)
- oldPrice (numeric)
- categoryId (uuid, foreign key references categories.id)
- available (boolean, default true)
- isFeatured (boolean, default false)
- isPromotion (boolean, default false)
- imageUrl (text)
- created_at (timestamp with timezone)
- updated_at (timestamp with timezone)

### orders

- id (uuid, primary key)
- customerName (text, not null)
- items (jsonb, not null) - array de objetos com produtos
- totalAmount (numeric, not null)
- status (text, not null) - "pending", "paid", "completed", "cancelled"
- ticketNumber (text, not null)
- created_at (timestamp with timezone, default now())

## Políticas de segurança recomendadas

Configure as políticas de acesso (RLS) no Supabase:

### Produtos e Categorias

- Leitura: permitir para todos
- Escrita: apenas authenticated users com role admin

### Pedidos

- Leitura: apenas authenticated users com role admin
- Escrita (create): permitir para todos (necessário para realizar pedidos)
- Atualização: apenas authenticated users com role admin
