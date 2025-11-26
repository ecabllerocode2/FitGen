import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, MoreVertical, ArrowUpRight } from 'lucide-react';

const InstallPwaBanner: React.FC = () => {
    // Visibilidad general del banner
    const [isVisible, setIsVisible] = useState(false);
    // Indica si el navegador ha disparado el evento 'beforeinstallprompt' (Botón Mágico)
    const [supportsPWA, setSupportsPWA] = useState(false);
    // Indica si es un dispositivo iOS (requiere instrucciones manuales)
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // --- 1. DETECCIÓN DE ESTADO Y DISPOSITIVO ---
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone || 
                             document.referrer.includes('android-app://');

        setIsIOS(isIosDevice);

        if (isStandalone) {
            setIsVisible(false); // Ocultar si ya está instalada
            return;
        }

        // --- 2. MANEJO DEL EVENTO beforeinstallprompt (La Trampa Global) ---
        
        // @ts-ignore
        const currentDeferredPrompt = window.deferredPrompt;
        
        // CRÍTICO: Buscar el evento capturado globalmente en main.tsx
        if (currentDeferredPrompt) {
            setSupportsPWA(true);
            setIsVisible(true);
        } else if (isIosDevice) {
            // iOS: Siempre mostramos instrucciones si no está instalada
            setIsVisible(true);
        } else {
            // Android/Desktop sin prompt: Mostramos instrucciones manuales por defecto
            setIsVisible(true);
        }

        // Listener para capturar el evento si ocurre DESPUÉS del montaje
        const handler = (e: any) => {
            e.preventDefault();
            // @ts-ignore
            window.deferredPrompt = e;
            setSupportsPWA(true);
            setIsVisible(true);
            console.log("Evento capturado en tiempo real ✅");
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Listener para limpiar si el usuario instala la app
        window.addEventListener('appinstalled', () => {
            console.log('PWA Instalada con éxito');
            setIsVisible(false);
            setSupportsPWA(false);
            // @ts-ignore
            window.deferredPrompt = null;
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        // @ts-ignore
        const promptEvent = window.deferredPrompt;
        if (!promptEvent) return;

        // Muestra el diálogo de instalación nativo
        promptEvent.prompt();
        
        const { outcome } = await promptEvent.userChoice;
        console.log(`El usuario respondió: ${outcome}`);

        // Limpiar el estado y la variable global
        // @ts-ignore
        window.deferredPrompt = null;
        setIsVisible(false);
        setSupportsPWA(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[100] animate-in slide-in-from-bottom-5 duration-500">
            <div className="bg-zinc-800 border border-lime-500/50 p-4 rounded-xl shadow-2xl flex flex-col gap-3 relative max-w-md mx-auto">
                
                {/* Botón de cerrar */}
                <button 
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 text-zinc-400 hover:text-white p-1"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Cabecera del Banner */}
                <div className="flex items-center gap-3">
                    <div className="bg-lime-500/20 p-2 rounded-lg shrink-0">
                        <Download className="w-6 h-6 text-lime-500" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm">Instalar FitGen</h4>
                        <p className="text-xs text-zinc-400">Mejor rendimiento y sin barra de navegación.</p>
                    </div>
                </div>

                {/* --- LÓGICA DE UI INTELIGENTE --- */}

                {/* CASO 1: iOS (Siempre instrucciones manuales) */}
                {isIOS && (
                    <div className="text-xs text-zinc-300 bg-zinc-900/50 p-2 rounded border border-zinc-700">
                        <div className="flex items-center gap-2 mb-1">
                            1. Pulsa <Share className="w-3 h-3 text-blue-400" /> <strong>Compartir</strong>
                        </div>
                        <div className="flex items-center gap-2">
                            2. Selecciona <PlusSquare className="w-3 h-3 text-white" /> <strong>Agregar al inicio</strong>
                        </div>
                    </div>
                )}

                {/* CASO 2: Android/Desktop con "Botón Mágico" disponible */}
                {/* Sale si NO es iOS y el evento fue capturado (supportsPWA=true) */}
                {!isIOS && supportsPWA && (
                    <button
                        onClick={handleInstallClick}
                        className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(132,204,22,0.3)] cursor-pointer"
                    >
                        Instalar Ahora
                    </button>
                )}

                {/* CASO 3: Android/Desktop SIN evento (Fallback Manual) */}
                {/* Sale si NO es iOS y el evento NO fue capturado (supportsPWA=false) */}
                {!isIOS && !supportsPWA && (
                    <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-700 text-xs text-zinc-300">
                        <p className="mb-2 font-semibold text-lime-500">Instalación Manual:</p>
                        <div className="flex items-start gap-2">
                            <ArrowUpRight className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                            <span>
                                Abre el menú de tu navegador (<MoreVertical className="w-3 h-3 inline align-middle" />) 
                                y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla de inicio"</strong>.
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstallPwaBanner;