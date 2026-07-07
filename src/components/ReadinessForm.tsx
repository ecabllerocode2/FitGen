import React, { useState } from 'react';
import { BatteryCharging, Moon, Brain, Activity, ChevronDown } from 'lucide-react';
import type { ReadinessData, EnergyLevel, SorenessLevel, SleepQuality, StressLevel, ExternalFatigue } from '../types/session';

interface ReadinessFormProps {
    onSubmit: (data: ReadinessData) => void;
    onBack?: () => void;
    isLoading?: boolean;
}

// Opciones para los selectores (escalas 1-5)
const energyOptions = [
    { value: 5, label: '5 - Óptimo: Excelente energía, listo para rendir' },
    { value: 4, label: '4 - Bueno: Buena energía, motivado' },
    { value: 3, label: '3 - Normal: Energía normal' },
    { value: 2, label: '2 - Bajo: Cansado, poca motivación' },
    { value: 1, label: '1 - Agotado: Sin energía' },
];

const sorenessOptions = [
    { value: 1, label: '1 - Sin dolor: Músculos recuperados' },
    { value: 2, label: '2 - Leve: Ligera tensión muscular' },
    { value: 3, label: '3 - Moderado: DOMS perceptible' },
    { value: 4, label: '4 - Alto: Dolor que limita' },
    { value: 5, label: '5 - Severo: Dolor intenso' },
];

const sleepOptions = [
    { value: 5, label: '5 - Excelente: 8+ horas, sueño reparador' },
    { value: 4, label: '4 - Bien: 7-8 horas, buena calidad' },
    { value: 3, label: '3 - Normal: 6-7 horas, aceptable' },
    { value: 2, label: '2 - Mal: 4-5 horas o mala calidad' },
    { value: 1, label: '1 - Muy mal: < 4 horas o fragmentado' },
];

const stressOptions = [
    { value: 1, label: '1 - Muy relajado: Sin estrés' },
    { value: 2, label: '2 - Relajado: Bajo estrés' },
    { value: 3, label: '3 - Normal: Estrés cotidiano' },
    { value: 4, label: '4 - Estresado: Estrés alto' },
    { value: 5, label: '5 - Muy estresado: Abrumado' },
];

const externalFatigueOptions = [
    { value: 'none', label: 'Ninguna', desc: 'Día sedentario normal' },
    { value: 'low', label: 'Baja', desc: 'Caminata ligera, trabajo de oficina' },
    { value: 'moderate', label: 'Moderada', desc: 'Trabajo activo, estar de pie mucho tiempo' },
    { value: 'high', label: 'Alta', desc: 'Trabajo físico intenso, deporte recreativo' },
    { value: 'extreme', label: 'Extrema', desc: 'Mudanza, maratón, evento deportivo intenso' },
];

const ReadinessForm: React.FC<ReadinessFormProps> = ({ onSubmit, onBack, isLoading = false }) => {
    const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(3);
    const [sorenessLevel, setSorenessLevel] = useState<SorenessLevel>(2);
    const [sleepQuality, setSleepQuality] = useState<SleepQuality>(3);
    const [stressLevel, setStressLevel] = useState<StressLevel>(3);
    const [externalFatigue, setExternalFatigue] = useState<ExternalFatigue>('none');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Solo enviar externalFatigue si es diferente de 'none'
        const data: ReadinessData = {
            energyLevel,
            sorenessLevel,
            sleepQuality,
            stressLevel
        };
        
        // Agregar externalFatigue solo si no es 'none'
        if (externalFatigue !== 'none') {
            data.externalFatigue = externalFatigue;
        }
        
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nivel de Energía */}
            <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <BatteryCharging className="w-4 h-4 text-lime-500" /> Nivel de Energía
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
                    <Activity className="w-4 h-4 text-lime-500" /> Dolor Muscular (DOMS)
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
                    <Moon className="w-4 h-4 text-lime-500" /> Calidad del Sueño
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
                    <Brain className="w-4 h-4 text-lime-500" /> Nivel de Estrés
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

            {/* Fatiga Externa */}
            <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-lime-500" /> Fatiga Externa
                    <span className="text-xs text-zinc-500 font-normal ml-1">(opcional)</span>
                </label>
                <p className="text-xs text-zinc-400 mb-2">
                    ¿Tuviste alguna actividad física intensa fuera del gym? Déjalo en "Ninguna" si fue un día normal.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {externalFatigueOptions.map(option => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setExternalFatigue(option.value as ExternalFatigue)}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                                externalFatigue === option.value
                                    ? 'bg-lime-500/20 border-lime-500 text-lime-400'
                                    : 'bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:border-zinc-500'
                            }`}
                        >
                            <div className="font-semibold text-sm">{option.label}</div>
                            <div className="text-xs text-zinc-400 mt-1">{option.desc}</div>
                        </button>
                    ))}
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
