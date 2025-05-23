import { Express, NextFunction, Request, Response } from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';

const MemoryStoreSession = MemoryStore(session);

export function setupAuth(app: Express) {
  // Configuração da sessão em memória
  app.use(
    session({
      store: new MemoryStoreSession({
        checkPeriod: 86400000 // limpar sessões expiradas a cada 24h
      }),
      secret: 'fastlanche-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: false, // Em desenvolvimento, defina como false
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        httpOnly: true,
        sameSite: 'lax'
      }
    })
  );

  // Middleware para deixar o usuário disponível em res.locals
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.user = req.session.user;
    next();
  });
}

// Definir tipagem para req.session
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      name: string;
      email: string;
      type: 'cliente' | 'admin';
    };
  }
}