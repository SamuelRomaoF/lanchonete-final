import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import serverless from 'serverless-http';
import { setupAuth } from '../../server/auth';
import { registerRoutes } from '../../server/routes';

// Inicia o app Express
const app = express();

// Configurações do middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(bodyParser.json());

// Configurar autenticação
setupAuth(app);

// Registrar todas as rotas do servidor no app
registerRoutes(app);

// Exporta o handler para Netlify Functions
export const handler = serverless(app); 