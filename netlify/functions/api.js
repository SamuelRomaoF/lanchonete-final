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
  origin: '*',  // Permitir qualquer origem para teste
  credentials: true,
}));
app.use(bodyParser.json());

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Rota para teste básico
app.get('/.netlify/functions/api/hello', (req, res) => {
  console.log('Rota hello acessada');
  res.json({ message: "API funcionando!" });
});

// Rota alternativa para teste sem prefixo
app.get('/hello', (req, res) => {
  console.log('Rota hello simples acessada');
  res.json({ message: "API funcionando!" });
});

// Categorias
app.get('/.netlify/functions/api/categories', getCategories);
app.get('/api/categories', getCategories); // Rota alternativa
app.get('/categories', getCategories); // Rota mais simples

// Produtos
app.get('/.netlify/functions/api/products', getProducts);
app.get('/api/products', getProducts); // Rota alternativa
app.get('/products', getProducts); // Rota mais simples

// Função para retornar categorias
function getCategories(req, res) {
  try {
    console.log('Rota categories acessada');
    const data = [
      { id: 1, name: "Hambúrgueres", description: "Deliciosos hambúrgueres artesanais", imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90" },
      { id: 2, name: "Pizzas", description: "Pizzas com bordas recheadas", imageUrl: "https://images.unsplash.com/photo-1590947132387-155cc02f3212" },
      { id: 3, name: "Porções", description: "Porções para compartilhar", imageUrl: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d" },
      { id: 4, name: "Bebidas", description: "Refrigerantes e sucos", imageUrl: "https://images.unsplash.com/photo-1613564834361-9436948817d1" }
    ];
    res.json(data);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
}

// Função para retornar produtos
function getProducts(req, res) {
  try {
    console.log('Rota products acessada');
    const data = [
      { id: 1, name: "X-Burguer", description: "Hambúrguer com queijo", price: 15.90, categoryId: 1, imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd" },
      { id: 2, name: "X-Salada", description: "Hambúrguer com queijo e salada", price: 18.90, categoryId: 1, imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349" },
      { id: 3, name: "Pizza Margherita", description: "Molho de tomate, muçarela e manjericão", price: 35.90, categoryId: 2, imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3" }
    ];
    res.json(data);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
}

// Rota catch-all para debug
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada', 
    path: req.originalUrl,
    method: req.method,
    baseUrl: req.baseUrl
  });
});

// Exporta o handler para Netlify Functions
module.exports.handler = serverless(app); 