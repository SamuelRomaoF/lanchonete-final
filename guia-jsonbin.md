# Guia para Configurar JSONBin.io Manualmente

Para fazer o sistema funcionar com o JSONBin.io, siga estes passos:

## 1. Faça login no JSONBin.io

- Acesse [https://jsonbin.io/login](https://jsonbin.io/login)
- Faça login usando sua conta (Google, GitHub, etc.)

## 2. Crie os bins necessários

Você precisa criar 4 bins diferentes para armazenar os diferentes tipos de dados:

### 2.1 Bin para categorias

1. No painel do JSONBin, clique em "Create Bin"
2. Coloque um nome como "categories"
3. Insira como conteúdo inicial: `[]` (um array vazio)
4. Clique em "Create" para salvar

### 2.2 Bin para produtos

1. Clique em "Create Bin" novamente
2. Coloque o nome "products"
3. Insira como conteúdo inicial: `[]`
4. Clique em "Create"

### 2.3 Bin para produtos em destaque

1. Crie outro bin chamado "featured"
2. Conteúdo inicial: `[]`
3. Clique em "Create"

### 2.4 Bin para promoções

1. Crie o último bin chamado "promotions"
2. Conteúdo inicial: `[]`
3. Clique em "Create"

## 3. Anote os IDs dos bins

Depois de criar cada bin, você verá um ID único para cada um. Anote esses IDs, você vai precisar deles para atualizar o arquivo api.js.

O ID aparece na URL quando você está visualizando o bin, no formato: `https://jsonbin.io/app/bins/[ID_DO_BIN]`

## 4. Atualize o arquivo netlify/functions/api.js

Abra o arquivo `netlify/functions/api.js` e atualize a seção de constantes BINS com os IDs que você anotou:

```javascript
const BINS = {
  categories: "seu-id-do-bin-categories",
  products: "seu-id-do-bin-products",
  featured: "seu-id-do-bin-featured",
  promotions: "seu-id-do-bin-promotions",
};
```

## 5. Implante a aplicação novamente

Depois de atualizar o arquivo com os IDs corretos, faça o deploy da aplicação novamente para que as alterações tenham efeito.

Agora o sistema deve ser capaz de salvar e recuperar dados usando seus bins do JSONBin.io.

---

**Observação importante:** Certifique-se de que a API key no arquivo `api.js` esteja correta. Se você estiver usando uma conta diferente, precisará atualizar também a API key.
