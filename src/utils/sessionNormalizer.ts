import type { GeneratedSession } from '../types/session';

// Normaliza distintas variantes de la sesión que pueden llegar desde Firestore
// Devuelve un objeto que cumple (de forma floja) con GeneratedSession
export function normalizeSession(raw: any): GeneratedSession | null {
  if (!raw) return null;

  // Algunos documentos pueden envolver la sesión en { session: {...} }
  let session = raw.session && typeof raw.session === 'object' ? raw.session : raw;

  // Si ya vino normalizada (tiene id y generatedAt), lo usamos directamente
  if (!session.id && session.sessionId) {
    session.id = session.sessionId;
  }

  // Normalizar timestamps
  if (!session.generatedAt && session.meta?.generatedAt) {
    session.generatedAt = session.meta.generatedAt;
  }

  // NORMALIZAR WARMUP -> array directo
  if (!Array.isArray(session.warmup)) {
    // Caso: { warmup: { fases: [...] } } o { warmup: { ejercicios: [...] } }
    if (session.warmup && Array.isArray(session.warmup.fases)) {
      // extraer ejercicios de fases
      const flat = session.warmup.fases.flatMap((f: any) => f.ejercicios || []);
      session.warmup = flat;
    } else if (session.warmup && Array.isArray(session.warmup.ejercicios)) {
      session.warmup = session.warmup.ejercicios;
    } else if (!session.warmup) {
      session.warmup = [];
    } else if (!Array.isArray(session.warmup)) {
      // Fallback a array vacio
      session.warmup = [];
    }
  }

  // NORMALIZAR MAINBLOCK: soporta { bloques: [...] } | { estaciones: [...] } | array
  // Normalize v3 flat mainBlock array from new backend
  if (Array.isArray(session.mainBlock)) {
    const exercises = session.mainBlock;
    session.mainBlock = {
      tipo: 'estaciones',
      descripcion: '',
      bloques: [{ ejercicios: exercises.map((ex: any) => ({
        id: ex.exerciseId ?? ex.id,
        nombre: ex.exerciseName ?? ex.nombre,
        parteCuerpo: ex.muscleGroup ?? ex.parteCuerpo,
        patronMovimiento: ex.movementPattern ?? ex.patronMovimiento,
        loadMode: ex.loadMode,
        prescribedLoadKg: ex.prescribedLoadKg,
        suggestedLoadKg: ex.suggestedLoadKg,
        peso: ex.prescribedLoadKg != null
          ? `${ex.prescribedLoadKg} kg`
          : ex.suggestedLoadKg != null
            ? `~${ex.suggestedLoadKg} kg`
            : ex.loadMode === 'exploratory'
              ? 'Exploratorio'
              : undefined,
        prescripcion: {
          series: ex.sets,
          reps: ex.repRange,
          rirObjetivo: ex.rirTarget,
          pesoSugerido: ex.prescribedLoadKg ?? ex.suggestedLoadKg,
          descanso: ex.restSeconds,
          tempo: ex.tempo,
        },
      })) }],
    };
  } else if (session.mainBlock) {
    const mb = session.mainBlock;
    if (Array.isArray(mb)) {
      session.mainBlock = { tipo: 'estaciones', descripcion: '', bloques: mb };
    } else if (Array.isArray(mb.bloques)) {
      // ok
    } else if (Array.isArray(mb.estaciones)) {
      session.mainBlock = { ...mb, bloques: mb.estaciones };
    } else if (Array.isArray(mb.blocks)) {
      session.mainBlock = { ...mb, bloques: mb.blocks };
    } else if (mb.ejercicios && Array.isArray(mb.ejercicios)) {
      // un único bloque representado como objeto con ejercicios
      session.mainBlock = { tipo: 'estaciones', descripcion: '', bloques: [ { ejercicios: mb.ejercicios } ] };
    } else {
      // Asegurar la forma minima
      session.mainBlock = session.mainBlock || { tipo: 'estaciones', descripcion: '', bloques: [] };
      session.mainBlock.bloques = session.mainBlock.bloques || [];
    }
  } else {
    session.mainBlock = { tipo: 'estaciones', descripcion: '', bloques: [] };
  }

  // NORMALIZAR CORE
  if (!session.coreBlock) {
    session.coreBlock = null;
  } else {
    // Si viene como { ejercicios: [...] } ok
    session.coreBlock.ejercicios = session.coreBlock.ejercicios || [];
  }

  // NORMALIZAR COOLDOWN
  if (!session.cooldown) {
    session.cooldown = { tipo: 'cooldown', nombre: 'Enfriamiento', duracionEstimada: 0, fases: [] } as any;
  } else if (!Array.isArray(session.cooldown.fases)) {
    if (Array.isArray(session.cooldown.ejercicios)) {
      session.cooldown.fases = [ { fase: 'General', duracion: session.cooldown.duracionEstimada || 0, icono: '', descripcion: session.cooldown.instrucciones || '', contenido: { tipo: 'estiramientos', ejercicios: session.cooldown.ejercicios } } ];
    } else {
      session.cooldown.fases = session.cooldown.fases || [];
    }
  }

  // EDUCATION
  session.education = session.education || (session.educationContent ? session.educationContent : {
    resumenFisiologico: '', objetivoDelDia: '', consejoTecnico: '', fasesExplicadas: [], cienciaDestacada: { titulo: '', contenido: '', fuente: '' }, motivacion: '', proximoEntrenamiento: { titulo: '', consejos: [] }
  });

  // TIP & SUMMARY defaults
  session.tipOfTheDay = session.tipOfTheDay || session.tip || '';
  session.summary = session.summary || { duracionEstimada: '0 min', duracionMinutos: 0, ejerciciosTotales: 0, seriesTotales: 0, musculosTrabajos: [] };

  return session as GeneratedSession;
}
