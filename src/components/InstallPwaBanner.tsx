import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, MoreVertical, ArrowUpRight } from 'lucide-react';

// 1. VARIABLE GLOBAL (Fuera del componente)
// Esto asegura que si el evento ocurre antes de que React cargue, no lo perdamos.
let deferredPrompt: any = null;

const InstallPwaBanner: React.FC = () => {
    // Estado para controlar la visibilidad general del banner
    const [isVisible, setIsVisible] = useState(false);
    // Estado para saber si tenemos el "permiso" del navegador para mostrar el botón
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // --- A. DETECCIÓN DE INSTALACIÓN PREVIA ---
        const checkInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                                 (window.navigator as any).standalone || 
                                 document.referrer.includes('android-app://');
            
            // Si ya es standalone, ocultamos todo y salimos
            if (isStandalone) {
                setIsVisible(false);
                setSupportsPWA(false);
            }
        };

        checkInstalled();

        // --- B. DETECCIÓN DE DISPOSITIVO ---
        const userAgent = window.navigator.userAgent.toLowerCase();
        // Detectar iOS explícitamente
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // --- C. MANEJADOR DEL EVENTO MÁGICO (beforeinstallprompt) ---
        const handler = (e: any) => {
            // Prevenir que Chrome muestre su barra nativa automática (si la tuviera)
            e.preventDefault();
            console.log("Evento 'beforeinstallprompt' capturado y guardado ✅");
            
            // Guardamos el evento en la variable global
            deferredPrompt = e;
            
            // Actualizamos estado para reactivar la UI
            setSupportsPWA(true);
            setIsVisible(true);
        };

        // Escuchar el evento
        window.addEventListener('beforeinstallprompt', handler);

        // 🚨 CRÍTICO: Revisar si el evento ya ocurrió antes de montar este componente
        if (deferredPrompt) {
            console.log("Evento recuperado de la memoria global ✅");
            setSupportsPWA(true);
            setIsVisible(true);
        } else if (!isIosDevice) {
             // Si no es iOS y no tenemos prompt aún, mostramos el banner
             // (posiblemente mostrará instrucciones manuales hasta que el evento salte)
             const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
             if (!isStandalone) setIsVisible(true);
        } else if (isIosDevice) {
            // En iOS siempre mostramos el banner si no está instalada
            const isStandalone = (window.navigator as any).standalone;
            if (!isStandalone) setIsVisible(true);
        }

        // Listener para cuando la instalación se completa con éxito
        window.addEventListener('appinstalled', () => {
            console.log('PWA Instalada con éxito');
            setIsVisible(false);
            setSupportsPWA(false);
            deferredPrompt = null;
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        console.log("Intentando instalar...");
        if (!deferredPrompt) {
            console.error("No hay evento deferredPrompt disponible");
            return;
        }

        // Mostrar el prompt nativo
        deferredPrompt.prompt();

        // Esperar a que el usuario decida
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`El usuario respondió: ${outcome}`);

        // Limpiamos la variable global, ya no sirve
        deferredPrompt = null;
        setSupportsPWA(false);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-500">
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
                        <p className="text-xs text-zinc-400">Mejor rendimiento y pantalla completa.</p>
                    </div>
                </div>

                {/* --- LÓGICA DE UI --- */}

                {/* OPCIÓN 1: Botón de Instalación Automática (Android/PC) */}
                {/* Solo sale si tenemos el evento capturado (supportsPWA) */}
                {!isIOS && supportsPWA && (
                    <button
                        onClick={handleInstallClick}
                        className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(132,204,22,0.3)] cursor-pointer"
                    >
                        Instalar Ahora
                    </button>
                )}

                {/* OPCIÓN 2: Instrucciones para iOS (iPhone/iPad) */}
                {/* iOS no soporta el botón automático, así que siempre mostramos esto */}
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

                {/* OPCIÓN 3: Fallback Android/PC (Instrucciones manuales) */}
                {/* Si NO es iOS y el navegador AÚN NO nos ha dado el evento (o no lo soporta), mostramos ayuda manual */}
                {!isIOS && !supportsPWA && (
                    <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-700 text-xs text-zinc-300">
                        <p className="mb-2 font-semibold text-lime-500">Instalación Manual:</p>
                        <div className="flex items-start gap-2">
                            <ArrowUpRight className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                            <span>
                                Abre el menú (<MoreVertical className="w-3 h-3 inline align-middle" />) 
                                y busca <strong>"Instalar aplicación"</strong>.
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstallPwaBanner;