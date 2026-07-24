// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import AppLoader from './components/AppLoader'

// --- INICIO CÓDIGO NUEVO ---
// 1. Captura global del evento PWA antes de que cargue React
// Esto asegura que no perdamos el evento durante la carga de Firebase
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevenir que Chrome muestre el mini-banner automático (opcional)
  e.preventDefault();
  // Guardar el evento en una variable global para que el componente lo recoja luego
  // @ts-expect-error
  window.deferredPrompt = e;
  console.log("Evento PWA capturado globalmente en main.tsx 🚀");
});

function isCriticalOnboardingFlowActive(): boolean {
  try {
    return sessionStorage.getItem('fitgen_onboarding_flow') === '1';
  } catch {
    return false;
  }
}

// --- REGISTRO AUTOMÁTICO DEL SERVICE WORKER ---
// - Comprueba actualizaciones periódicamente
// - Aplica la actualización automáticamente y recarga cuando el nuevo SW toma control
// - Basado en `virtual:pwa-register` de vite-plugin-pwa
// - NUNCA recarga durante el guardado de perfil / generación de mesociclo (iOS aborta el fetch → "Load failed")
let pendingSWUpdate = false;
const updateSW = registerSW({
  onRegistered(registration: any) {
    if (!registration) return;
    // Forzamos comprobaciones periódicas cada 30 minutos
    const periodic = setInterval(() => {
      try { registration.update(); } catch (err) { console.warn('SW update fallo', err); }
    }, 30 * 60 * 1000);
    window.addEventListener('beforeunload', () => clearInterval(periodic));
  },
  onNeedRefresh() {
    if (isCriticalOnboardingFlowActive()) {
      pendingSWUpdate = true;
      console.log('[PWA] Update deferred — onboarding completion in progress');
      return;
    }
    updateSW?.(true);
  },
  onOfflineReady() {
    console.log('[PWA] Offline ready');
  }
});

// Recarga la página una sola vez cuando el nuevo Service Worker toma control
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    if (isCriticalOnboardingFlowActive()) {
      pendingSWUpdate = true;
      console.log('[PWA] Reload deferred — onboarding completion in progress');
      return;
    }
    refreshing = true;
    window.location.reload();
  });
}

// Cuando el usuario vuelve a la pestaña, comprobamos si hay nueva versión y la aplicamos
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (isCriticalOnboardingFlowActive()) return;
    try { updateSW?.(); } catch (err) { console.warn('Error al forzar check SW', err); }
  }
});

// Apply deferred SW update once onboarding unlocks
window.addEventListener('fitgen-onboarding-flow', () => {
  if (!pendingSWUpdate || isCriticalOnboardingFlowActive()) return;
  pendingSWUpdate = false;
  try {
    updateSW?.(true);
  } catch (err) {
    console.warn('[PWA] Deferred update failed', err);
  }
});

// --- FIN REGISTRO AUTOMÁTICO ---

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter> 
      <AppLoader />
    </BrowserRouter>
  </StrictMode>,
)