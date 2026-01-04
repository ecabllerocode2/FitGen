import React, { useEffect, useState, useMemo } from 'react';
import { Trophy, TrendingUp, Target, X, Zap } from 'lucide-react';

// Función helper para generar valores aleatorios del confetti
const generateConfettiParticles = () => {
    const colors = ['#84cc16', '#fbbf24', '#f59e0b', '#ef4444', '#8b5cf6'];
    return Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2
    }));
};

interface LevelUpCelebrationProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        celebrationTitle: string;
        celebrationMessage: string;
        newLevel: string;
        previousLevel: string;
        nextGoal?: string;
        metrics?: {
            completedSessions?: number;
            weeksTraining?: number;
            completionRate?: string;
            progressionRate?: string;
        };
    };
}

const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({ isOpen, onClose, data }) => {
    const [showConfetti, setShowConfetti] = useState(false);
    const [animate, setAnimate] = useState(false);

    // Generar posiciones aleatorias del confetti una sola vez
    const confettiParticles = useMemo(() => generateConfettiParticles(), []);

    useEffect(() => {
        if (isOpen) {
            // Usar requestAnimationFrame para evitar setState sincrónico
            requestAnimationFrame(() => {
                setShowConfetti(true);
                setAnimate(true);
            });
            
            // Detener confetti después de 4 segundos
            const timer = setTimeout(() => setShowConfetti(false), 4000);
            return () => clearTimeout(timer);
        } else {
            // Defer state update to avoid synchronous setState in effect
            requestAnimationFrame(() => setAnimate(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Mapeo de colores y badges según nivel
    const levelConfig = {
        intermedio: {
            color: 'from-blue-500 to-cyan-500',
            bgGlow: 'bg-blue-500/20',
            icon: '🏅',
            badge: 'INTERMEDIO'
        },
        avanzado: {
            color: 'from-purple-500 to-pink-500',
            bgGlow: 'bg-purple-500/20',
            icon: '👑',
            badge: 'AVANZADO'
        }
    };

    const config = levelConfig[data.newLevel.toLowerCase() as keyof typeof levelConfig] || levelConfig.intermedio;

    return (
        <>
            {/* Overlay con backdrop blur */}
            <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
                onClick={onClose}
            >
                {/* Modal Container */}
                <div 
                    className={`relative bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-3xl border-2 border-lime-500/30 max-w-lg w-full shadow-2xl ${animate ? 'animate-in zoom-in-95 duration-500' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Botón cerrar */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-10"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Glow effect en el fondo */}
                    <div className={`absolute inset-0 ${config.bgGlow} blur-3xl opacity-50 rounded-3xl`}></div>

                    {/* Confetti Animation */}
                    {showConfetti && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                            {confettiParticles.map((particle) => (
                                <div
                                    key={particle.id}
                                    className="absolute w-2 h-2 animate-confetti"
                                    style={{
                                        left: `${particle.left}%`,
                                        top: '-10px',
                                        backgroundColor: particle.color,
                                        animationDelay: `${particle.delay}s`,
                                        animationDuration: `${particle.duration}s`
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Contenido */}
                    <div className="relative p-8 text-center">
                        {/* Ícono grande animado */}
                        <div className="mb-6 animate-bounce">
                            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${config.color} shadow-lg`}>
                                <Trophy className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        {/* Título principal */}
                        <h2 className="text-3xl font-black text-white mb-3 leading-tight">
                            {data.celebrationTitle}
                        </h2>

                        {/* Badge de nivel */}
                        <div className="inline-flex items-center gap-3 bg-zinc-800/50 px-6 py-3 rounded-full border border-lime-500/30 mb-6">
                            <span className="text-lg font-bold text-zinc-400 line-through">{data.previousLevel.toUpperCase()}</span>
                            <Zap className="w-5 h-5 text-lime-500" />
                            <span className={`text-xl font-black bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
                                {config.badge}
                            </span>
                            <span className="text-2xl">{config.icon}</span>
                        </div>

                        {/* Mensaje detallado */}
                        <p className="text-zinc-300 text-base leading-relaxed mb-8">
                            {data.celebrationMessage}
                        </p>

                        {/* Métricas */}
                        {data.metrics && (
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {data.metrics.completedSessions && (
                                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                                        <TrendingUp className="w-6 h-6 text-lime-500 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-white">{data.metrics.completedSessions}</div>
                                        <div className="text-xs text-zinc-400 uppercase tracking-wide">Sesiones</div>
                                    </div>
                                )}
                                {data.metrics.weeksTraining && (
                                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                                        <Trophy className="w-6 h-6 text-lime-500 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-white">{data.metrics.weeksTraining}</div>
                                        <div className="text-xs text-zinc-400 uppercase tracking-wide">Semanas</div>
                                    </div>
                                )}
                                {data.metrics.completionRate && (
                                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                                        <Target className="w-6 h-6 text-lime-500 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-white">{data.metrics.completionRate}</div>
                                        <div className="text-xs text-zinc-400 uppercase tracking-wide">Consistencia</div>
                                    </div>
                                )}
                                {data.metrics.progressionRate && (
                                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                                        <Zap className="w-6 h-6 text-lime-500 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-white">{data.metrics.progressionRate}</div>
                                        <div className="text-xs text-zinc-400 uppercase tracking-wide">Progresión</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Siguiente objetivo */}
                        {data.nextGoal && (
                            <div className="bg-gradient-to-r from-lime-500/10 to-lime-500/5 border border-lime-500/30 rounded-xl p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <Target className="w-5 h-5 text-lime-500 mt-0.5 shrink-0" />
                                    <div className="text-left">
                                        <h4 className="text-sm font-bold text-lime-400 mb-1">🎯 Próximo Objetivo</h4>
                                        <p className="text-sm text-zinc-300">{data.nextGoal}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Botón de continuar */}
                        <button
                            onClick={onClose}
                            className={`w-full bg-gradient-to-r ${config.color} text-white font-bold py-4 px-8 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2`}
                        >
                            <Zap className="w-5 h-5" />
                            ¡Continuar Entrenando!
                        </button>
                    </div>
                </div>
            </div>

            {/* Estilos para la animación de confetti */}
            <style>{`
                @keyframes confetti {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
                .animate-confetti {
                    animation: confetti linear forwards;
                }
            `}</style>
        </>
    );
};

export default LevelUpCelebration;
