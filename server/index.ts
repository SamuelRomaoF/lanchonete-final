import cors from 'cors';
import express, { NextFunction, type Request, Response } from "express";
import { createServer } from "http";
import path from 'path';
import { fileURLToPath } from 'url';
import api from './api';
import { setupAuth } from "./auth";
import { supabase } from './lib/supabase';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

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

// Servir arquivos estáticos do diretório dist
app.use(express.static(path.join(__dirname, '../client/dist')));

// Rota catch-all para o SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint não encontrado' });
  }
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

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
