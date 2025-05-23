import { createRoot } from "react-dom/client";
import App from "./App.js";
import "./index.css";
import { initializeStorage } from './lib/storage.js';

// Configuração para remixicon
import "remixicon/fonts/remixicon.css";

// Inicializar storage do Supabase
initializeStorage().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
