import React, { useState } from 'react';
import { BatteryCharging, Scale, ChevronDown } from 'lucide-react';

// Tipos
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;
export type SorenessLevel = 1 | 2 | 3 | 4 | 5;
export type SleepQuality = 1 | 2 | 3 | 4 | 5;
export type StressLevel = 1 | 2 | 3 | 4 | 5;

export interface ReadinessData {
    energyLevel: EnergyLevel;
    sorenessLevel: SorenessLevel;
    sleepQuality: SleepQuality;
    stressLevel: StressLevel;
}

interface ReadinessFormProps {
    onSubmit: (data: ReadinessData) => void;
    onBack?: () => void;
    isLoading?: boolean;
}

// Opciones para los selectores
const energyOptions = [
    { value: 5, label: '🔥 Óptimo - Excelente, listo para rendir' },
    { value: 4, label: '😊 Bueno - Buena energía, motivado' },
    { value: 3, label: '😐 Normal - Energía normal' },
    { value: 2, label: '😓 Bajo - Cansado, poca motivación' },
    { value: 1, label: '😴 Agotado - Sin energía' },
];

const sorenessOptions = [
    { value: 1, label: '✅ Sin dolor - Músculos recuperados' },
    { value: 2, label: '🟢 Leve - Ligera tensión muscular' },
    { value: 3, label: '🟡 Moderado - DOMS perceptible' },
    { value: 4, label: '🟠 Alto - Dolor que limita' },
    { value: 5, label: '🔴 Severo - Dolor intenso' },
];

const sleepOptions = [
    { value: 5, label: '😴💤 Excelente - 8+ horas, sueño reparador' },
    { value: 4, label: '😊 Bien - 7-8 horas, buena calidad' },
    { value: 3, label: '😐 Normal - 6-7 horas, aceptable' },
    { value: 2, label: '😞 Mal - 4-5 horas o mala calidad' },
    { value: 1, label: '😵 Muy mal - < 4 horas o fragmentado' },
];

const stressOptions = [
    { value: 1, label: '🧘 Muy relajado - Sin estrés' },
    { value: 2, label: '😌 Relajado - Bajo estrés' },
    { value: 3, label: '😐 Normal - Estrés cotidiano' },
    { value: 4, label: '😰 Estresado - Estrés alto' },
    { value: 5, label: '🤯 Muy estresado - Abrumado' },
];

const ReadinessForm: React.FC<ReadinessFormProps> = ({ onSubmit, onBack, isLoading = false }) => {
    const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(3);
    const [sorenessLevel, setSorenessLevel] = useState<SorenessLevel>(2);
    const [sleepQuality, setSleepQuality] = useState<SleepQuality>(3);
    const [stressLevel, setStressLevel] = useState<StressLevel>(3);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ energyLevel, sorenessLevel, sleepQuality, stressLevel });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nivel de Energía */}
            <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <BatteryCharging className="w-4 h-4 text-lime-500" /> 💪 Nivel de Energía
                </label>
                <div className="relative">
                    <select
                        value={energyLevel}
                        onChange={(e) => setEnergyLevel(parseInt(e.target.value) as EnergyLevel)}
                        required
                        className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white appearance-none focus:ring-lime-500 focus:border-lime-500 text-sm"
                    >
                        {energyOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
            </div>

            {/* Dolor Muscular */}
            <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-lime-500" /> 🦵 Dolor Muscular (DOMS)
                </label>
                <div className="relative">
                    <select
                        value={sorenessLevel}
                        onChange={(e) => setSorenessLevel(parseInt(e.target.value) as SorenessLevel)}
                        required
                        className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white appearance-none focus:ring-lime-500 focus:border-lime-500 text-sm"
                    >
                        {sorenessOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
            </div>

            {/* Calidad del Sueño */}
            <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    😴 Calidad del Sueño
                </label>
                <div className="relative">
                    <select
                        value={sleepQuality}
                        onChange={(e) => setSleepQuality(parseInt(e.target.value) as SleepQuality)}
                        required
                        className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white appearance-none focus:ring-lime-500 focus:border-lime-500 text-sm"
                    >
                        {sleepOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
            </div>

            {/* Nivel de Estrés */}
            <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    🧠 Nivel de Estrés
                </label>
                <div className="relative">
                    <select
                        value={stressLevel}
                        onChange={(e) => setStressLevel(parseInt(e.target.value) as StressLevel)}
                        required
                        className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white appearance-none focus:ring-lime-500 focus:border-lime-500 text-sm"
                    >
                        {stressOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-6">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex-1 bg-zinc-700 text-white font-bold py-3 px-4 rounded-xl hover:bg-zinc-600 transition"
                    >
                        Atrás
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-lime-500 text-zinc-900 font-bold py-3 px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-400"
                >
                    {isLoading ? 'Generando...' : 'Generar Sesión'}
                </button>
            </div>
        </form>
    );
};

export default ReadinessForm;
