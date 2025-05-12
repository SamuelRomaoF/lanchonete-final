import cors from 'cors';
import express, { NextFunction, type Request, Response } from "express";
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

(async () => {
  const server = await registerRoutes(app);

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

  // Usar porta 3001 como padrão ou definida pelo ambiente
  const port = process.env.PORT || 3001;
  server.listen({
    port,
    host: "localhost",
  }, () => {
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : port;
    log(`Servidor rodando em http://localhost:${actualPort}`);
  });
})();
