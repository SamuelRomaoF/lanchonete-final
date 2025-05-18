import cors from 'cors';
import express, { NextFunction, type Request, Response } from "express";
import { createServer, Server } from "http";
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";
import { log, serveStatic, setupVite } from "./vite";

const app = express();

// Configurar CORS antes de qualquer middleware
app.use(cors({
  origin: true, // Permitir origens com credenciais
  credentials: true, // Permitir envio de cookies
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurar a autenticação e sessão
setupAuth(app);

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(res, bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Função para tentar iniciar o servidor em diferentes portas
const startServer = async (initialPort: number, maxAttempts: number = 10) => {
  // Primeiro criar o servidor HTTP
  const server: Server = createServer(app);
  let currentPort = initialPort;
  let attempts = 0;

  // Registrar rotas na aplicação Express
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importante: apenas configura o vite em desenvolvimento e após
  // configurar todas as outras rotas para que a rota catch-all
  // não interfira com as outras rotas
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Função que tenta escutar em uma porta específica
  const tryListen = (port: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      server.listen({
        port,
        host: "localhost",
      })
      .on('listening', () => {
        const address = server.address();
        const actualPort = typeof address === 'object' && address ? address.port : port;
        log(`Servidor rodando em http://localhost:${actualPort}`);
        resolve();
      })
      .on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          // Se a porta estiver em uso, rejeite a promessa para tentar outra porta
          log(`Porta ${port} está em uso, tentando próxima...`);
          reject(error);
        } else {
          // Para outros erros, apenas rejeite
          reject(error);
        }
      });
    });
  };

  // Tenta portas sequenciais até encontrar uma disponível
  while (attempts < maxAttempts) {
    try {
      await tryListen(currentPort);
      // Se chegou aqui, o servidor iniciou com sucesso
      return;
    } catch (error: any) {
      if (error.code === 'EADDRINUSE') {
        // Tenta a próxima porta
        currentPort++;
        attempts++;
      } else {
        // Qualquer outro erro, logue e pare de tentar
        log(`Erro ao iniciar servidor: ${error.message}`);
        throw error;
      }
    }
  }

  // Se chegou aqui, não foi possível encontrar uma porta disponível após o máximo de tentativas
  throw new Error(`Não foi possível encontrar uma porta disponível após ${maxAttempts} tentativas`);
};

(async () => {
  try {
    // Usar porta 3001 como padrão ou definida pelo ambiente
    const initialPort = parseInt(process.env.PORT || "3001", 10);
    await startServer(initialPort);
  } catch (error) {
    log(`Falha ao iniciar o servidor: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
})();
