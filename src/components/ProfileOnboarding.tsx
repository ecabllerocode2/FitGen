import { useState, type FC } from 'react';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore'; 

// Las URL de las imágenes son placeholders que asumen que las cargarás en la carpeta public/
// ¡Asegúrate de que existan en la carpeta 'public' de tu proyecto!
interface EquipmentDetail {
    key: string; 
    name: string;
    imagePath: string;
    description: string;
    isWeightBased: boolean; // Indica si el equipo tiene opciones de peso
    weightOptions?: number[]; // Opciones de peso en kg
}

// Lista detallada de equipo que el usuario puede tener en casa
const homeEquipmentList: EquipmentDetail[] = [
    {
        key: 'mancuernas',
        name: 'Mancuernas (Dumbbells)',
        imagePath: '/man_cuernas.jpeg', 
        description: 'Pesos libres esenciales. (Selecciona pesos disponibles)',
        isWeightBased: true,
        weightOptions: [5, 10, 15, 20, 25, 30], // Opciones de kg
    },
    {
        key: 'ketlebells',
        name: 'Pesas Rusas (Kettlebells)',
        imagePath: '/ketlebells.jpeg',
        description: 'Herramienta versátil para fuerza y cardio. (Selecciona pesos disponibles)',
        isWeightBased: true,
        weightOptions: [8, 12, 16, 20, 24], // Opciones de kg
    },
    {
        key: 'barra-dominadas',
        name: 'Barra de Dominadas',
        imagePath: '/barra_pullup.jpeg', 
        description: 'Para ejercicios de espalda y bíceps (pull-ups/chin-ups).',
        isWeightBased: false,
    },
    {
        key: 'mini-bands',
        name: 'Mini Bandas de Resistencia',
        imagePath: '/mini_bands.jpeg',
        description: 'Pequeñas bandas de *loop* para activación de glúteos y piernas.',
        isWeightBased: false,
    },
    {
        key: 'handle-bands',
        name: 'Bandas Elásticas con Asas',
        imagePath: '/handle_bands.jpeg',
        description: 'Bandas de tubo con asas, ideales para reemplazar mancuernas en casa.',
        isWeightBased: false,
    },
    {
        key: 'foam-roller',
        name: 'Rodillo de Espuma',
        imagePath: '/foam_roller.jpeg',
        description: 'Herramienta de recuperación y movilidad (liberación miofascial).',
        isWeightBased: false,
    },
    {
        key: 'barra-pesos',
        name: 'Barra de Pesos Libres',
        imagePath: '/barra_pesos.jpeg',
        description: 'Barra larga para sentadillas y levantamiento de pesas. (Selecciona pesos de discos disponibles)',
        isWeightBased: true,
        weightOptions: [5, 10, 15, 20, 25, 30, 40, 50], // Opciones de kg (discos)
    },
];


const trainingLocationOptions = [
    'Gimnasio (Máquinas y Pesos Libres)', // Opción 1: Acceso completo
    'En Casa (Solo Peso Corporal)', // Opción 2: Sin equipo
    'En Casa (Con Equipo Limitado)', // Opción 3: Despliega la lista de detalle
];

const goals = [
    'Pérdida de Peso', 
    'Ganancia Muscular', 
    'Mantenimiento'
];

const experienceLevels = [
    'Principiante', 
    'Intermedio', 
    'Avanzado'
];

const genderOptions = [
    'Masculino',
    'Femenino',
    'Prefiero no decir'
];

// Lista de días de la semana para la selección
const daysOfWeek = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 
    'Viernes', 'Sábado', 'Domingo'
];


// Corregido: Acceso directo a la variable de entorno para evitar errores de compilación
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

interface ProfileOnboardingProps {
  user: User;
  db: Firestore; // Se mantiene por tipado, aunque no se usa para guardar en el Frontend
}

const ProfileOnboarding: FC<ProfileOnboardingProps> = ({ user }) => {
    // Datos personales
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState(''); 
    const [height, setHeight] = useState(''); 
    
    // Datos de entrenamiento
    const [weight, setWeight] = useState('');
    const [goal, setGoal] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('');
    // *** MODIFICADO: Ahora es un array de strings con los días seleccionados ***
    const [selectedTrainingDays, setSelectedTrainingDays] = useState<string[]>([]);
    const [focusArea, setFocusArea] = useState(''); 
    const [injuries, setInjuries] = useState(''); 

    // *** ESTADOS PARA EL EQUIPO ***
    const [trainingLocation, setTrainingLocation] = useState('');
    const [homeEquipmentSelections, setHomeEquipmentSelections] = useState<string[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    /**
     * Maneja la selección/deselección de los días de entrenamiento.
     */
    const handleDaySelection = (day: string) => {
        setSelectedTrainingDays(prev => {
            if (prev.includes(day)) {
                return prev.filter(d => d !== day);
            } else {
                return [...prev, day];
            }
        });
    };

    /**
     * Maneja el cambio en la ubicación principal (Gimnasio, Peso Corporal, Equipo Limitado).
     */
    const handleTrainingLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const location = e.target.value;
        setTrainingLocation(location);
        // Resetear las selecciones de equipo detallado si la opción no es 'Equipo Limitado en Casa'
        if (location !== 'En Casa (Con Equipo Limitado)') {
            setHomeEquipmentSelections([]);
        }
    };

    /**
     * Maneja los cambios en los detalles del equipo en casa.
     * Incluye la lógica para manejar las opciones de peso junto con el nombre del equipo.
     */
    const handleDetailedEquipmentChange = (equipmentName: string, weight?: number | null) => {
        const key = weight ? `${equipmentName} (${weight}kg)` : equipmentName;
        const baseKey = equipmentName;
        
        setHomeEquipmentSelections(prev => {
            if (weight) {
                if (prev.includes(key)) {
                    return prev.filter(item => item !== key);
                } else {
                    const isBaseSelected = prev.some(item => item.startsWith(baseKey) && !item.includes('kg'));
                    const newSelections = isBaseSelected ? [...prev, key] : [...prev, baseKey, key];
                    return Array.from(new Set(newSelections)); 
                }
            } else {
                if (prev.includes(key)) {
                    return prev.filter(item => !item.startsWith(baseKey));
                } else {
                    return [...prev, key];
                }
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!BACKEND_URL) {
            setError("Error de configuración: La variable VITE_BACKEND_URL no está definida.");
            setIsLoading(false);
            return;
        }

        const parsedWeight = parseFloat(weight);
        const parsedAge = parseInt(age, 10);
        const trainingDaysCount = selectedTrainingDays.length; // Usamos el conteo de días seleccionados
        const parsedHeight = parseInt(height, 10); 

        // 1. Construir la lista final de equipo para el backend
        let finalEquipment: string[] = [];

        if (!trainingLocation) {
             setError('Por favor, selecciona tu ubicación de entrenamiento (*).');
             setIsLoading(false);
             return;
        }

        if (trainingLocation === 'En Casa (Con Equipo Limitado)') {
             if (homeEquipmentSelections.length === 0) {
                setError('Por favor, selecciona al menos un equipo disponible en casa.');
                setIsLoading(false);
                return;
             }
             finalEquipment = [trainingLocation, ...homeEquipmentSelections];
        } else {
            finalEquipment = [trainingLocation];
        }

        // 2. Validación extendida
        if (!name.trim() || !goal || !experienceLevel || !gender || finalEquipment.length === 0) {
            setError('Por favor, completa todos los campos requeridos (*).');
            setIsLoading(false);
            return;
        }
        // *** MODIFICADO: Validamos que se haya seleccionado al menos un día ***
        if (trainingDaysCount === 0) {
            setError('Por favor, selecciona al menos un día de la semana para entrenar (*).');
            setIsLoading(false);
            return;
        }

        if (!parsedWeight || parsedWeight <= 0 || 
            !parsedAge || parsedAge < 15 || 
            !parsedHeight || parsedHeight < 100 || parsedHeight > 250 
        ) {
            setError('Por favor, ingresa valores válidos para peso, edad y estatura (cm).');
            setIsLoading(false);
            return;
        }

        try {
            // 3. Obtener el ID Token para la validación en el Backend
            const idToken = await user.getIdToken(true); 

            // 4. Preparar los datos del perfil
            const profileData = {
                name: name.trim(),
                age: parsedAge,
                gender, 
                heightCm: parsedHeight, 
                experienceLevel,
                // ** MODIFICADOS **
                trainingDaysPerWeek: trainingDaysCount, 
                preferredTrainingDays: selectedTrainingDays, // <--- NUEVO CAMPO
                // *****************
                availableEquipment: finalEquipment, 
                initialWeight: parsedWeight,
                fitnessGoal: goal,
                focusArea: focusArea.trim() || 'General', 
                injuriesOrLimitations: injuries.trim() || 'Ninguna', 
                dateCompleted: new Date().toISOString(),
            };

            // 5. Llamar al endpoint del Backend
            const response = await fetch(`${BACKEND_URL}/api/profile/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`, 
                },
                body: JSON.stringify({ 
                    userId: user.uid,
                    userEmail: user.email,
                    profileData: profileData
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al guardar el perfil en el servidor.');
            }
            
            // Si todo fue bien, podrías redirigir al dashboard (lógica pendiente)

        } catch (e) {
            console.error("Error al guardar el perfil:", e);
            const errorMessage = (e as Error).message.includes('Failed to fetch') 
                ? "No se pudo conectar al Backend. Revisa la URL de Vercel."
                : (e as Error).message || "Error desconocido al guardar tu perfil. Inténtalo de nuevo.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-white p-4">
            <div className="w-full max-w-2xl bg-zinc-800 p-8 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-bold mb-6 text-lime-400 text-center">
                    Configuración Inicial
                </h1>
                <p className="text-zinc-400 mb-6 text-center">
                    ¡Bienvenido! Necesitamos datos precisos (*) para generar un plan de entrenamiento inteligente.
                </p>
                
                {error && (
                    <div className="p-3 mb-4 text-sm font-medium text-red-100 bg-red-600 rounded-lg text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* CAMPO: Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Nombre (*)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-lime-500 focus:border-lime-500 text-white"
                            placeholder="Tu nombre o apodo"
                        />
                    </div>
                    
                    {/* CAMPOS: Edad, Peso y Estatura (en una fila de 3) */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Edad (*)</label>
                            <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                required
                                min="15"
                                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-lime-500 focus:border-lime-500 text-white"
                                placeholder="Años"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Peso (kg) (*)</label>
                            <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                required
                                min="1"
                                step="0.1"
                                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-lime-500 focus:border-lime-500 text-white"
                                placeholder="Ej: 75.5"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Estatura (cm) (*)</label>
                            <input
                                type="number"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                required
                                min="100"
                                max="250"
                                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-lime-500 focus:border-lime-500 text-white"
                                placeholder="Ej: 175"
                            />
                        </div>
                    </div>
                    
                    {/* CAMPO: Meta y Nivel */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Meta Principal (*)</label>
                            <select
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-lime-500 focus:border-lime-500 text-white appearance-none"
                            >
                                <option value="" disabled>Selecciona objetivo</option>
                                {goals.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Nivel de Experiencia (*)</label>
                            <select
                                value={experienceLevel}
                                onChange={(e) => setExperienceLevel(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-lime-500 focus:border-lime-500 text-white appearance-none"
                            >
                                <option value="" disabled>Selecciona nivel</option>
                                {experienceLevels.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* CAMPO: Género */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Género (*)</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-lime-500 focus:border-lime-500 text-white appearance-none"
                        >
                            <option value="" disabled>Selecciona género</option>
                            {genderOptions.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>

                    {/* *** MODIFICADO: DÍAS DE ENTRENAMIENTO ESPECÍFICOS *** */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Días de Entrenamiento Semanal (Mínimo 1) (*)
                        </label>
                        <p className="text-xs text-zinc-400 mb-3">
                            Selecciona los días **fijos** de la semana para tu plan de fuerza. Cualquier día libre puede usarse para sesiones de movilidad/regeneración.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center p-3 bg-zinc-700 rounded-lg">
                            {daysOfWeek.map(day => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleDaySelection(day)}
                                    className={`
                                        px-3 py-2 text-sm font-semibold rounded-full transition-colors duration-150 ease-in-out
                                        ${selectedTrainingDays.includes(day)
                                            ? 'bg-lime-500 text-zinc-900 shadow-md'
                                            : 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500'
                                        }
                                    `}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* ****************************************************** */}

                    {/* CAMPO PRINCIPAL: DÓNDE ENTRENAS */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Ubicación Principal de Entrenamiento (*)
                        </label>
                        <select
                            value={trainingLocation}
                            onChange={handleTrainingLocationChange}
                            required
                            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-lime-500 focus:border-lime-500 text-white appearance-none"
                        >
                            <option value="" disabled>Selecciona una opción</option>
                            {trainingLocationOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    {/* RENDERIZADO CONDICIONAL: EQUIPO EN CASA DETALLADO */}
                    {trainingLocation === 'En Casa (Con Equipo Limitado)' && (
                        <div className="p-4 bg-zinc-700 rounded-lg border border-zinc-600">
                            <h3 className="text-lg font-semibold text-lime-400 mb-3">
                                Selecciona el equipo disponible en casa
                            </h3>
                            <div className="space-y-4">
                                {homeEquipmentList.map((item) => (
                                    <div key={item.key} className="p-3 bg-zinc-600 rounded-lg shadow-md">
                                        <div className="flex items-start">
                                            {/* Imagen Placeholder */}
                                            <img 
                                                src={item.imagePath} 
                                                alt={item.name} 
                                                className="w-10 h-10 rounded-md object-cover mr-4 border border-zinc-500"
                                                // Fallback simple: si la imagen no carga, muestra un icono
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    // Usamos un div invisible para el espacio en caso de fallo
                                                    target.nextElementSibling!.classList.remove('hidden'); 
                                                }}
                                            />
                                            {/* Icono de Fallback (visible solo si la imagen falla) */}
                                            <span className="text-2xl mr-4 hidden" aria-hidden="true">🏋️</span>
                                            
                                            <div className="flex-grow">
                                                {/* Checkbox principal del equipo */}
                                                <div className="flex items-center mb-1">
                                                    <input
                                                        id={item.key}
                                                        type="checkbox"
                                                        checked={homeEquipmentSelections.some(s => s.startsWith(item.name))}
                                                        onChange={() => handleDetailedEquipmentChange(item.name, null)}
                                                        className="h-5 w-5 text-lime-600 bg-zinc-700 border-zinc-600 rounded focus:ring-lime-500"
                                                    />
                                                    <label htmlFor={item.key} className="ml-3 text-base font-medium text-zinc-300 cursor-pointer select-none">
                                                        {item.name}
                                                    </label>
                                                </div>
                                                <p className="text-xs text-zinc-400">{item.description}</p>
                                            </div>
                                        </div>

                                        {/* Opciones de Peso Condicional */}
                                        {item.isWeightBased && homeEquipmentSelections.some(s => s.startsWith(item.name)) && (
                                            <div className="mt-2 pl-14 flex flex-wrap gap-2 pt-2 border-t border-zinc-700">
                                                <span className="text-sm font-medium text-zinc-400 w-full mb-1">Pesos (kg) disponibles:</span>
                                                {item.weightOptions?.map(weight => (
                                                    <div key={`${item.key}-${weight}`} className="flex items-center">
                                                        <input
                                                            id={`${item.key}-${weight}`}
                                                            type="checkbox"
                                                            value={weight}
                                                            checked={homeEquipmentSelections.includes(`${item.name} (${weight}kg)`)}
                                                            onChange={() => handleDetailedEquipmentChange(item.name, weight)}
                                                            className="h-4 w-4 text-lime-600 bg-zinc-500 border-zinc-400 rounded focus:ring-lime-500"
                                                        />
                                                        <label htmlFor={`${item.key}-${weight}`} className="ml-1 text-sm text-zinc-300 cursor-pointer select-none">
                                                            {weight} kg
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* CAMPO: Áreas de Enfoque (Texto Opcional) */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Áreas de Enfoque o Prioridad (Opcional)
                            <span className="text-zinc-500 text-xs ml-2">(Ej: "Quiero priorizar hombros y glúteos")</span>
                        </label>
                        <textarea
                            value={focusArea}
                            onChange={(e) => setFocusArea(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-lime-500 focus:border-lime-500 text-white resize-none"
                            placeholder="Escribe aquí si tienes músculos específicos que quieres desarrollar más."
                        />
                    </div>

                    {/* CAMPO: Lesiones o Restricciones (Texto Opcional y Crítico) */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Lesiones o Restricciones Físicas (Opcional pero Importante)
                            <span className="text-red-400 text-xs ml-2">(Para excluir ejercicios y prevenir riesgos)</span>
                        </label>
                        <textarea
                            value={injuries}
                            onChange={(e) => setInjuries(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-lime-500 focus:border-lime-500 text-white resize-none"
                            placeholder="Ej: Dolor crónico en rodilla izquierda, No puedo hacer ejercicios por encima de la cabeza."
                        />
                    </div>


                    <button
                        type="submit"
                        // *** MODIFICADO: Se valida que haya al menos 1 día seleccionado (selectedTrainingDays.length) ***
                        disabled={isLoading || !goal || !weight || !name || !age || !experienceLevel || selectedTrainingDays.length === 0 || !trainingLocation || !gender || !height || (trainingLocation === 'En Casa (Con Equipo Limitado)' && homeEquipmentSelections.length === 0)}
                        className="w-full bg-lime-500 text-zinc-900 font-bold py-3 px-4 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-400 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-zinc-900 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            'Completar y Acceder al Dashboard'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileOnboarding;