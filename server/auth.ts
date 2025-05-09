import session from 'express-session';
import { Express, Request, Response, NextFunction } from 'express';
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

export function setupAuth(app: Express) {
  // Configuração da sessão
  app.use(
    session({
      secret: 'fastlanche-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        httpOnly: true
      },
      store: new MemoryStore({
        checkPeriod: 86400000 // limpa sessões expiradas a cada 24h
      })
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
      id: number;
      name: string;
      email: string;
      type: 'cliente' | 'admin';
    };
  }
}