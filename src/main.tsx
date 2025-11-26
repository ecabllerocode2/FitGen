// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// ==========================================================
// AÑADIR ESTE BLOQUE PARA REGISTRAR EL SERVICE WORKER
// ==========================================================
if ('serviceWorker' in navigator) {
    // Usamos el mismo archivo de registro que genera Vite/el plugin
    window.addEventListener('load', () => {
        // La ruta debe coincidir con el archivo generado, 
        // que según tu captura es registerSW.js
        navigator.serviceWorker.register('/registerSW.js')
            .then(registration => {
                console.log('SW registrado en Desarrollo:', registration);
            })
            .catch(error => {
                console.error('Fallo el registro de SW en Desarrollo:', error);
            });
    });
}
// ==========================================================
// FIN BLOQUE SW
// ==========================================================

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter> 
      <App />
    </BrowserRouter>
  </StrictMode>,
)