/**
 * Tipos para la nueva API de generación de sesiones V2
 * Basado en FRONTEND_INTEGRATION.md
 */

// ==================== PROFILE DATA ====================

export type Gender = 'Masculino' | 'Femenino' | 'Otro';

export type ExperienceLevel = 'Principiante' | 'Intermedio' | 'Avanzado';

export type FitnessGoal = 'Fuerza' | 'Hipertrofia' | 'Resistencia' | 'Perdida_Grasa';

export type FocusArea = 'General' | 'Tren_Superior' | 'Tren_Inferior' | 'Core';

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export type ExternalLoad = 'none' | 'light' | 'moderate' | 'heavy';

export type InjuryType = 
  | 'Ninguna'
  | 'Hombro'
  | 'Rodilla'
  | 'Espalda Baja'
  | 'Muñeca'
  | 'Cuello'
  | 'Cadera'
  | 'Tobillo'
  | 'Codo';

export type Equipment = 
  | 'mancuernas'
  | 'barra_olimpica'
  | 'kettlebell'
  | 'bandas_elasticas'
  | 'banco_ajustable'
  | 'rack_sentadillas'
  | 'polea'
  | 'barra_dominadas'
  | 'step_plataforma'
  | 'pelota_suiza'
  | 'rueda_abdominal'
  | 'TRX';

export type Location = 'gym' | 'home' | 'outdoor';

export interface DayContext {
  day: DayOfWeek;
  canTrain: boolean;
  externalLoad: ExternalLoad;
}

export interface ProfileData {
  // Datos personales
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  initialWeight: number;
  
  // Experiencia y objetivos
  experienceLevel: ExperienceLevel;
  fitnessGoal: FitnessGoal;
  focusArea: FocusArea;
  
  // Configuración de entrenamiento
  trainingDaysPerWeek: number;
  preferredTrainingDays: DayOfWeek[];
  weeklyScheduleContext: DayContext[];
  
  // Equipamiento y limitaciones
  hasHomeEquipment: boolean;
  homeEquipment?: Equipment[];
  injuriesOrLimitations: InjuryType | string;
  
  // Metadatos
  dateCompleted: string;
}

// ==================== PRE-SESSION REQUEST ====================

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;
export type SorenessLevel = 1 | 2 | 3 | 4 | 5;
export type SleepQuality = 1 | 2 | 3 | 4 | 5;
export type StressLevel = 1 | 2 | 3 | 4 | 5;

export interface GenerateSessionRequest {
  userId: string;
  energyLevel: EnergyLevel;
  sorenessLevel: SorenessLevel;
  sleepQuality: SleepQuality;
  stressLevel: StressLevel;
  location?: Location;
  availableTime?: number;
  microcycleIndex?: number;
  sessionIndex?: number;
  equipmentOverride?: string[];
  saveToFirestore?: boolean;
}

// ==================== SESSION RESPONSE ====================

export interface GenerateSessionResponse {
  success: true;
  session: GeneratedSession;
}

export interface GeneratedSession {
  // Metadatos
  id: string;
  generatedAt: string;
  generationTimeMs: number;
  version: string;
  
  // Contexto
  userId: string;
  mesocycleId: string;
  microcycleIndex: number;
  sessionIndex: number;
  
  // Información de sesión
  sessionFocus: string;
  dayOfWeek: string;
  phase: string;
  weekNumber: number;
  
  // Parámetros de entrenamiento
  trainingParameters: TrainingParameters;
  
  // Bloques de entrenamiento - ESTRUCTURA REAL
  warmup: WarmupExercise[]; // Array directo, no WarmupBlock
  mainBlock: {
    tipo: string;
    descripcion?: string;
    bloques: Station[]; // Se llama 'bloques' en el backend, no 'estaciones'
  };
  coreBlock: CoreBlock | null;
  cooldown: CooldownBlock;
  
  // Contenido educativo
  education: EducationContent;
  tipOfTheDay: string;
  
  // Resumen
  summary: SessionSummary;
}

export interface TrainingParameters {
  rpeTarget: number;
  rirTarget: number;
  volumeConfig: {
    setsPerMuscleGroup: { min: number; max: number };
    setsPerExercise: { compound: number; isolation: number };
    totalExercises: { min: number; max: number };
    repsRange: { strength: string; hypertrophy: string; endurance: string };
  };
  restProtocol: {
    compound: { min: number; max: number };
    isolation: { min: number; max: number };
    betweenExercises: number;
  };
  ambiente: 'gym' | 'home_equipped' | 'home_minimal' | 'bodyweight';
  readinessCategory: 'suboptimal' | 'reduced' | 'normal' | 'enhanced' | 'optimal';
  adjustmentsApplied: string[];
}

// ==================== WARMUP BLOCK ====================

export interface WarmupBlock {
  tipo: 'warmup';
  nombre: string;
  duracionEstimada: number;
  fases: RAMPPhase[];
}

export interface RAMPPhase {
  fase: 'Raise' | 'Activate' | 'Mobilize' | 'Potentiate' | 'Prehab';
  duracion: string;
  descripcion: string;
  ejercicios: WarmupExercise[];
}

export interface WarmupExercise {
  id: string;
  nombre: string;
  duracion?: string;
  reps?: number;
  instrucciones: string;
  imagenUrl?: string;
}

// ==================== MAIN BLOCK ====================

export interface MainBlock {
  tipo: 'main_block';
  nombre: string;
  duracionEstimada: number;
  estructura: 'estaciones' | 'superseries' | 'circuito';
  estaciones: Station[];
}

export interface Station {
  numero: number;
  tipo: 'simple' | 'superset' | 'triset';
  ejercicios: MainExercise[];
}

export interface MainExercise {
  id: string;
  nombre: string;
  parteCuerpo: string;
  patronMovimiento: string;
  equipo: string[];
  imagenUrl?: string;
  videoUrl?: string;
  
  prescripcion: ExercisePrescription;
  notas?: string;
}

export interface ExercisePrescription {
  series: number;
  reps: number | string;
  peso?: string;
  rpeObjetivo: number;
  rirObjetivo: number;
  descanso: number;
  tempo?: string;
  tecnicaEspecial?: string;
  notaUnilateral?: string;
}

// ==================== CORE BLOCK ====================

export interface CoreBlock {
  tipo: 'core';
  nombre: string;
  duracionEstimada: number;
  estructura: 'secuencial' | 'circuito';
  instrucciones: string;
  rondas?: number;
  ejercicios: CoreExercise[];
}

export interface CoreExercise {
  id: string;
  nombre: string;
  prescripcion: {
    series: number;
    reps?: number;
    tiempo?: string;
    repsOTiempo: string;
    descanso: number;
    rpeObjetivo: number;
    notaUnilateral?: string;
    tipo: 'isometrico' | 'dinamico';
  };
  notas: string;
  imagenUrl?: string;
}

// ==================== COOLDOWN BLOCK ====================

export interface CooldownBlock {
  tipo: 'cooldown';
  nombre: string;
  duracionEstimada: number;
  fases: CooldownPhase[];
}

export interface CooldownPhase {
  fase: string;
  duracion: number;
  icono: string;
  descripcion: string;
  contenido: {
    tipo: string;
    ejercicios?: StretchExercise[];
    opciones?: string[];
    instrucciones?: string;
    nombre?: string;
    duracion?: number;
    beneficio?: string;
  };
}

export interface StretchExercise {
  id: string;
  nombre: string;
  tiempo: string;
  musculoObjetivo?: string;
  instrucciones: string;
  imagenUrl?: string;
}

// ==================== EDUCATION CONTENT ====================

export interface EducationContent {
  resumenFisiologico: string;
  objetivoDelDia: string;
  consejoTecnico: string;
  fasesExplicadas: PhaseExplanation[];
  cienciaDestacada: {
    titulo: string;
    contenido: string;
    fuente: string;
  };
  motivacion: string;
  proximoEntrenamiento: {
    titulo: string;
    consejos: RecoveryTip[];
  };
}

export interface PhaseExplanation {
  fase: string;
  icono: string;
  explicacion: string;
  ciencia: string;
}

export interface RecoveryTip {
  icono: string;
  consejo: string;
  detalle: string;
}

// ==================== SESSION SUMMARY ====================

export interface SessionSummary {
  duracionEstimada: string;
  duracionMinutos: number;
  ejerciciosTotales: number;
  seriesTotales: number;
  musculosTrabajos: string[];
}

// ==================== ERROR RESPONSE ====================

export interface ErrorResponse {
  error: string;
  code?: 'MISSING_USER_ID' | 'NO_ACTIVE_MESOCYCLE' | 'SESSION_NOT_FOUND' | 'CONTEXT_ERROR' | 'INTERNAL_ERROR';
}
