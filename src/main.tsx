import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <--- IMPORTAR ESTO
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Envolvemos la App con el Router */}
    <BrowserRouter> 
      <App />
    </BrowserRouter>
  </StrictMode>,
)