import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';
import { defineConfig } from "vite";

// Obter o equivalente a __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simples configuração que funciona no Netlify
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "client/dist"),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          // Atualizar a porta do proxy dinamicamente
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const serverPort = process.env.SERVER_PORT;
            if (serverPort) {
              const target = new URL(options.target as string);
              target.port = serverPort;
              options.target = target.toString();
            }
          });
        }
      }
    }
  }
});
