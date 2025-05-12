// Versão simplificada usando JavaScript puro em vez de TypeScript
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Inicia o app Express
const app = express();

// Configurações do middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(bodyParser.json());

// Rotas básicas para teste
app.get('/.netlify/functions/api/hello', (req, res) => {
  res.json({ message: "API funcionando!" });
});

app.get('/.netlify/functions/api/categories', (req, res) => {
  try {
    // Carregar dados de um arquivo JSON na pasta de funções
    const categoriesPath = path.join(__dirname, 'categories.json');
    
    // Se o arquivo não existir, criar um com dados padrão
    if (!fs.existsSync(categoriesPath)) {
      const defaultData = [
        { id: 1, name: "Hambúrgueres", description: "Deliciosos hambúrgueres artesanais", imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90" },
        { id: 2, name: "Pizzas", description: "Pizzas com bordas recheadas", imageUrl: "https://images.unsplash.com/photo-1590947132387-155cc02f3212" }
      ];
      fs.writeFileSync(categoriesPath, JSON.stringify(defaultData, null, 2));
    }
    
    // Ler o arquivo
    const data = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// Exporta o handler para Netlify Functions
module.exports.handler = serverless(app); 