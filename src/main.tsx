// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// --- INICIO CÓDIGO NUEVO ---
// 1. Captura global del evento PWA antes de que cargue React
// Esto asegura que no perdamos el evento durante la carga de Firebase
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevenir que Chrome muestre el mini-banner automático (opcional)
  e.preventDefault();
  // Guardar el evento en una variable global para que el componente lo recoja luego
  // @ts-ignore
  window.deferredPrompt = e;
  console.log("Evento PWA capturado globalmente en main.tsx 🚀");
});
// --- FIN CÓDIGO NUEVO ---

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter> 
      <App />
    </BrowserRouter>
  </StrictMode>,
)