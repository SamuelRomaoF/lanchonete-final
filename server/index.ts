import cors from 'cors';
import express, { NextFunction, type Request, Response } from "express";
import { createServer } from "http";
import path from 'path';
import { fileURLToPath } from 'url';
import api from './api';
import { setupAuth } from "./auth";
import { supabase } from './lib/supabase';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV === 'development';

// Verificar se o diretório dist existe
const distDir = path.join(__dirname, '../client/dist');
const distExists = fs.existsSync(distDir) && fs.existsSync(path.join(distDir, 'index.html'));

// Configurar CORS e headers de segurança
app.use(cors({
  origin: true,
  credentials: true
}));

// Configurar headers de segurança
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.json());

// Configurar rotas da API
app.use('/api', api);

// Configurar autenticação
setupAuth(app);

// Servir arquivos estáticos do diretório dist se existirem
if (distExists) {
  console.log('✅ Servindo arquivos estáticos do diretório client/dist');
  app.use(express.static(distDir));
  
  // Rota catch-all para o SPA
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint não encontrado' });
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  console.log('⚠️ Cliente não foi compilado (client/dist não existe)');
  
  if (isDevelopment) {
    // Em desenvolvimento, redirecionar para o servidor de desenvolvimento do Vite
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint não encontrado' });
      }
      res.send(`
        <html>
          <head>
            <title>Redirecionando para o servidor de desenvolvimento</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
              .container { text-align: center; margin-top: 50px; }
              .btn { padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Servidor backend está rodando!</h1>
              <p>O diretório client/dist não foi encontrado. Para rodar o projeto completo:</p>
              <ol>
                <li>Execute <code>npm run build:client</code> para construir o frontend, ou</li>
                <li>Execute <code>npm run dev:client</code> em outro terminal para iniciar o servidor de desenvolvimento do cliente</li>
              </ol>
              <p>
                <a href="http://localhost:5173" class="btn">Ir para o servidor de desenvolvimento (porta 5173)</a>
              </p>
            </div>
          </body>
        </html>
      `);
    });
  } else {
    // Em produção, mostrar erro
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint não encontrado' });
      }
      res.status(500).send('Erro: Arquivos do frontend não encontrados. Execute npm run build antes de iniciar em produção.');
    });
  }
}

// Tratamento de erros
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
async function startServer() {
  try {
    // Verificar conexão com Supabase
    const { data, error } = await supabase.from('categories').select('count');
    if (error) {
      console.error('❌ Erro ao conectar com Supabase:', error);
      process.exit(1);
    }
    console.log('✅ Conexão com Supabase estabelecida');

    const server = createServer(app);

    server.listen(port, () => {
      console.log(`Servidor rodando em http://localhost:${port}`);
      
      if (!distExists && isDevelopment) {
        console.log(`⚠️ Frontend não encontrado. Execute 'npm run build:client' ou 'npm run dev:client' em outro terminal.`);
      }
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Porta ${port} está em uso, tentando próxima...`);
        server.listen(Number(port) + 1);
      } else {
        console.error('Erro ao iniciar servidor:', error);
      }
    });

  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
