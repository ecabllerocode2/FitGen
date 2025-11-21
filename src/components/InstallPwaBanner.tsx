import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

const InstallPwaBanner: React.FC = () => {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // 1. Detectar si es iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        // Detectar si ya está en modo "standalone" (ya instalada)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        if (isIosDevice && !isStandalone) {
            setIsIOS(true);
            setIsVisible(true);
        }

        // 2. Detectar evento de instalación (Android/Desktop Chrome)
        const handler = (e: any) => {
            e.preventDefault();
            setSupportsPWA(true);
            setPromptInstall(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!promptInstall) return;
        promptInstall.prompt();
        const { outcome } = await promptInstall.userChoice;
        if (outcome === 'accepted') {
            setIsVisible(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-500">
            <div className="bg-zinc-800 border border-lime-500/50 p-4 rounded-xl shadow-2xl flex flex-col gap-3 relative max-w-md mx-auto">
                
                <button 
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 text-zinc-400 hover:text-white p-1"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                    <div className="bg-lime-500/20 p-2 rounded-lg">
                        <Download className="w-6 h-6 text-lime-500" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm">Instalar FitGen</h4>
                        <p className="text-xs text-zinc-400">Acceso rápido y funcionamiento offline.</p>
                    </div>
                </div>

                {/* BOTÓN PARA ANDROID / DESKTOP */}
                {supportsPWA && (
                    <button
                        onClick={handleInstall}
                        className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold py-2 rounded-lg text-sm transition-colors"
                    >
                        Instalar Aplicación
                    </button>
                )}

                {/* INSTRUCCIONES PARA IOS (Ya que iOS no permite botón directo) */}
                {isIOS && (
                    <div className="text-xs text-zinc-300 bg-zinc-900/50 p-2 rounded border border-zinc-700">
                        <p className="mb-1">Para instalar en iOS:</p>
                        <div className="flex items-center gap-2 mb-1">
                            1. Pulsa en <Share className="w-3 h-3 text-blue-400" /> (Compartir)
                        </div>
                        <div className="flex items-center gap-2">
                            2. Selecciona <PlusSquare className="w-3 h-3 text-white" /> <strong>"Agregar al inicio"</strong>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstallPwaBanner;