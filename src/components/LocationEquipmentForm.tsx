import React, { useState } from 'react';
import { Dumbbell, Home as HomeIcon, Building2, ChevronRight, Check } from 'lucide-react';

export type Location = 'gym' | 'home';

export interface EquipmentData {
    location: Location;
    availableEquipment: string[];
    specificWeights?: { // Frontend lo llama specificWeights para consistencia
        dumbbells?: number[];
        barbell?: number;
        kettlebells?: number[];
    };
}

interface LocationEquipmentFormProps {
    onNext: (data: EquipmentData) => void;
    isLoading?: boolean;
}

// Equipamiento disponible para casa
const HOME_EQUIPMENT_OPTIONS = [
    { id: 'dumbbells', label: 'Mancuernas', icon: '🏋️' },
    { id: 'barbell', label: 'Barra Olímpica', icon: '🏋️‍♂️' },
    { id: 'pullup-bar', label: 'Barra de Dominadas', icon: '💪' },
    { id: 'resistance-bands', label: 'Bandas de Resistencia', icon: '〰️' },
    { id: 'kettlebell', label: 'Kettlebells', icon: '⚫' },
    { id: 'bench', label: 'Banco Ajustable', icon: '🛏️' },
    { id: 'trx', label: 'TRX / Suspension Straps', icon: '🔗' },
    { id: 'foam-roller', label: 'Foam Roller', icon: '📦' },
];

// Mapeo de IDs a nombres de API
const EQUIPMENT_API_NAMES: Record<string, string> = {
    'dumbbells': 'Mancuernas',
    'barbell': 'Barra Olímpica',
    'pullup-bar': 'Barra de Dominadas',
    'resistance-bands': 'Bandas de Resistencia',
    'kettlebell': 'Kettlebell',
    'bench': 'Banco Ajustable',
    'trx': 'TRX',
    'foam-roller': 'Foam Roller',
};

// Pesos comunes disponibles
const DUMBBELL_WEIGHTS = [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30];
const BARBELL_WEIGHTS = [20, 30, 40, 50, 60, 70, 80, 90, 100];
const KETTLEBELL_WEIGHTS = [4, 8, 12, 16, 20, 24, 28, 32];

const LocationEquipmentForm: React.FC<LocationEquipmentFormProps> = ({ onNext, isLoading = false }) => {
    const [location, setLocation] = useState<Location>('gym');
    const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
    
    // Estado para pesos específicos (ahora arrays de números seleccionados)
    const [selectedDumbbellWeights, setSelectedDumbbellWeights] = useState<number[]>([]);
    const [selectedBarbellWeight, setSelectedBarbellWeight] = useState<number | null>(null);
    const [selectedKettlebellWeights, setSelectedKettlebellWeights] = useState<number[]>([]);

    const handleEquipmentToggle = (equipmentId: string) => {
        if (selectedEquipment.includes(equipmentId)) {
            setSelectedEquipment(selectedEquipment.filter(e => e !== equipmentId));
            // Limpiar pesos si se deselecciona el equipo
            if (equipmentId === 'dumbbells') setSelectedDumbbellWeights([]);
            if (equipmentId === 'barbell') setSelectedBarbellWeight(null);
            if (equipmentId === 'kettlebell') setSelectedKettlebellWeights([]);
        } else {
            setSelectedEquipment([...selectedEquipment, equipmentId]);
        }
    };

    const toggleDumbbellWeight = (weight: number) => {
        if (selectedDumbbellWeights.includes(weight)) {
            setSelectedDumbbellWeights(selectedDumbbellWeights.filter(w => w !== weight));
        } else {
            setSelectedDumbbellWeights([...selectedDumbbellWeights, weight].sort((a, b) => a - b));
        }
    };

    const toggleKettlebellWeight = (weight: number) => {
        if (selectedKettlebellWeights.includes(weight)) {
            setSelectedKettlebellWeights(selectedKettlebellWeights.filter(w => w !== weight));
        } else {
            setSelectedKettlebellWeights([...selectedKettlebellWeights, weight].sort((a, b) => a - b));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (location === 'gym') {
            // Para gimnasio, enviamos array vacío (el backend agrega el equipo estándar)
            onNext({
                location: 'gym',
                availableEquipment: []
            });
        } else {
            // Para casa, convertimos los IDs a nombres de API
            const equipmentNames = selectedEquipment.map(id => EQUIPMENT_API_NAMES[id]);
            
            // Agregar peso corporal si no está
            if (!equipmentNames.includes('Peso Corporal')) {
                equipmentNames.push('Peso Corporal');
            }

            const data: EquipmentData = {
                location: 'home',
                availableEquipment: equipmentNames
            };

            // Agregar pesos específicos si los hay
            const specificWeights: NonNullable<EquipmentData['specificWeights']> = {};

            if (selectedEquipment.includes('dumbbells') && selectedDumbbellWeights.length > 0) {
                specificWeights.dumbbells = selectedDumbbellWeights;
            }

            if (selectedEquipment.includes('barbell') && selectedBarbellWeight) {
                specificWeights.barbell = selectedBarbellWeight;
            }

            if (selectedEquipment.includes('kettlebell') && selectedKettlebellWeights.length > 0) {
                specificWeights.kettlebells = selectedKettlebellWeights;
            }

            if (Object.keys(specificWeights).length > 0) {
                data.specificWeights = specificWeights;
            }

            onNext(data);
        }
    };

    const hasWeightEquipment = selectedEquipment.some(eq => 
        ['dumbbells', 'barbell', 'kettlebell'].includes(eq)
    );

    // Validar que si hay equipo con peso, se hayan seleccionado los pesos
    const hasDumbbells = selectedEquipment.includes('dumbbells');
    const hasBarbell = selectedEquipment.includes('barbell');
    const hasKettlebell = selectedEquipment.includes('kettlebell');
    
    const weightsValid = 
        (!hasDumbbells || selectedDumbbellWeights.length > 0) &&
        (!hasBarbell || selectedBarbellWeight !== null) &&
        (!hasKettlebell || selectedKettlebellWeights.length > 0);

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Ubicación */}
            <div>
                <label className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                    📍 ¿Dónde vas a entrenar?
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setLocation('gym')}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                            location === 'gym'
                                ? 'bg-lime-500/20 border-lime-500 text-lime-400'
                                : 'bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:border-zinc-500'
                        }`}
                    >
                        <Building2 className="w-8 h-8 mb-2" />
                        <span className="font-semibold">Gimnasio</span>
                        <span className="text-xs text-zinc-400 mt-1">Equipo completo</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setLocation('home')}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                            location === 'home'
                                ? 'bg-lime-500/20 border-lime-500 text-lime-400'
                                : 'bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:border-zinc-500'
                        }`}
                    >
                        <HomeIcon className="w-8 h-8 mb-2" />
                        <span className="font-semibold">Casa</span>
                        <span className="text-xs text-zinc-400 mt-1">Selecciona equipo</span>
                    </button>
                </div>
            </div>

            {/* Selección de Equipamiento (solo para casa) */}
            {location === 'home' && (
                <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-lime-500" />
                        ¿Qué equipamiento tienes disponible?
                    </label>
                    <p className="text-xs text-zinc-400 mb-2">
                        Selecciona todo el equipo con el que cuentas hoy
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2">
                        {HOME_EQUIPMENT_OPTIONS.map(equipment => (
                            <button
                                key={equipment.id}
                                type="button"
                                onClick={() => handleEquipmentToggle(equipment.id)}
                                className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${
                                    selectedEquipment.includes(equipment.id)
                                        ? 'bg-lime-500/20 border-lime-500 text-lime-400'
                                        : 'bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:border-zinc-500'
                                }`}
                            >
                                <span className="text-lg">{equipment.icon}</span>
                                <span className="text-sm font-medium flex-1">{equipment.label}</span>
                                {selectedEquipment.includes(equipment.id) && (
                                    <Check className="w-4 h-4 text-lime-400" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Selección de pesos específicos (OBLIGATORIO) */}
                    {hasWeightEquipment && (
                        <div className="mt-4 p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-bold text-amber-400">
                                    ⚠️ Especifica los pesos disponibles
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 mb-3">
                                Es obligatorio para adaptar las cargas a tu equipamiento
                            </p>

                            <div className="space-y-4">
                                {/* Mancuernas */}
                                {hasDumbbells && (
                                    <div>
                                        <label className="text-xs font-medium text-zinc-300 mb-2 block">
                                            🏋️ Mancuernas disponibles (kg)
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {DUMBBELL_WEIGHTS.map(weight => (
                                                <button
                                                    key={weight}
                                                    type="button"
                                                    onClick={() => toggleDumbbellWeight(weight)}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                        selectedDumbbellWeights.includes(weight)
                                                            ? 'bg-lime-500 text-zinc-900 border-2 border-lime-400'
                                                            : 'bg-zinc-700 text-zinc-300 border border-zinc-600 hover:border-zinc-500'
                                                    }`}
                                                >
                                                    {weight}
                                                </button>
                                            ))}
                                        </div>
                                        {selectedDumbbellWeights.length === 0 && (
                                            <p className="text-xs text-amber-400 mt-2">
                                                Selecciona al menos un peso
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Barra */}
                                {hasBarbell && (
                                    <div>
                                        <label className="text-xs font-medium text-zinc-300 mb-2 block">
                                            🏋️‍♂️ Peso máximo (Barra + Discos en kg)
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {BARBELL_WEIGHTS.map(weight => (
                                                <button
                                                    key={weight}
                                                    type="button"
                                                    onClick={() => setSelectedBarbellWeight(weight)}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                        selectedBarbellWeight === weight
                                                            ? 'bg-lime-500 text-zinc-900 border-2 border-lime-400'
                                                            : 'bg-zinc-700 text-zinc-300 border border-zinc-600 hover:border-zinc-500'
                                                    }`}
                                                >
                                                    {weight}
                                                </button>
                                            ))}
                                        </div>
                                        {selectedBarbellWeight === null && (
                                            <p className="text-xs text-amber-400 mt-2">
                                                Selecciona el peso máximo disponible
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Kettlebells */}
                                {hasKettlebell && (
                                    <div>
                                        <label className="text-xs font-medium text-zinc-300 mb-2 block">
                                            ⚫ Kettlebells disponibles (kg)
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {KETTLEBELL_WEIGHTS.map(weight => (
                                                <button
                                                    key={weight}
                                                    type="button"
                                                    onClick={() => toggleKettlebellWeight(weight)}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                        selectedKettlebellWeights.includes(weight)
                                                            ? 'bg-lime-500 text-zinc-900 border-2 border-lime-400'
                                                            : 'bg-zinc-700 text-zinc-300 border border-zinc-600 hover:border-zinc-500'
                                                    }`}
                                                >
                                                    {weight}
                                                </button>
                                            ))}
                                        </div>
                                        {selectedKettlebellWeights.length === 0 && (
                                            <p className="text-xs text-amber-400 mt-2">
                                                Selecciona al menos un peso
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Botón siguiente */}
            <button
                type="submit"
                disabled={isLoading || (location === 'home' && (selectedEquipment.length === 0 || !weightsValid))}
                className="w-full bg-lime-500 text-zinc-900 font-bold py-3 px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-400 flex items-center justify-center gap-2 mt-6"
            >
                {isLoading ? (
                    'Cargando...'
                ) : (
                    <>
                        Siguiente
                        <ChevronRight className="w-5 h-5" />
                    </>
                )}
            </button>

            {location === 'home' && selectedEquipment.length === 0 && (
                <p className="text-xs text-amber-400 text-center mt-2">
                    Selecciona al menos un equipamiento para continuar
                </p>
            )}
            
            {location === 'home' && selectedEquipment.length > 0 && !weightsValid && (
                <p className="text-xs text-amber-400 text-center mt-2">
                    Debes especificar los pesos disponibles del equipamiento seleccionado
                </p>
            )}
        </form>
    );
};

export default LocationEquipmentForm;
