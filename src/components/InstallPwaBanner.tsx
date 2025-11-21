import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, MoreVertical, ArrowUpRight } from 'lucide-react';

const InstallPwaBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);

    useEffect(() => {
        // 1. Revisar si ya está instalada
        const checkInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                                 (window.navigator as any).standalone || 
                                 document.referrer.includes('android-app://');
            
            setIsAlreadyInstalled(isStandalone);
            if (isStandalone) setIsVisible(false);
            else setIsVisible(true); // Mostrar por defecto si no está instalada
        };

        checkInstalled();

        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        mediaQuery.addEventListener('change', checkInstalled);

        // 2. Detectar iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        // 3. Capturar el evento del "Botón Mágico"
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
            console.log("Evento de instalación capturado ✅");
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            mediaQuery.removeEventListener('change', checkInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    if (!isVisible || isAlreadyInstalled) return null;

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
                        <p className="text-xs text-zinc-400">Mejor rendimiento y sin barra de navegación.</p>
                    </div>
                </div>

                {/* --- LOGICA DE UI INTELIGENTE --- */}

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
                {!isIOS && deferredPrompt && (
                    <button
                        onClick={handleInstallClick}
                        className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(132,204,22,0.3)]"
                    >
                        Instalar Ahora
                    </button>
                )}

                {/* CASO 3: Android/Desktop SIN evento (Tu caso actual en la captura) */}
                {!isIOS && !deferredPrompt && (
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