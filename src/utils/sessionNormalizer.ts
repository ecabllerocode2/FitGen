import type { GeneratedSession } from '../types/session';

function mapExerciseFields(ex: any) {
  const imageUrl = ex.imageUrl ?? ex.url_img_0 ?? ex.imagenUrl ?? null;
  const imageUrl2 = ex.imageUrl2 ?? ex.url_img_1 ?? null;
  return {
    ...ex,
    id: ex.exerciseId ?? ex.id,
    nombre: ex.exerciseName ?? ex.nombre ?? ex.name,
    parteCuerpo: ex.muscleGroup ?? ex.parteCuerpo,
    patronMovimiento: ex.movementPattern ?? ex.patronMovimiento,
    imageUrl,
    imageUrl2,
    url_img_0: imageUrl,
    url_img_1: imageUrl2,
    sets: ex.sets,
    reps: ex.repRange ?? ex.reps,
    restSeconds: ex.restSeconds,
    descripcion: ex.descripcion,
    correcciones: ex.correcciones,
    instrucciones: ex.instrucciones,
    loadMode: ex.loadMode,
    isBodyweight: ex.isBodyweight ?? ex.loadMode === 'bodyweight',
    prescribedLoadKg: ex.prescribedLoadKg,
    suggestedLoadKg: ex.suggestedLoadKg,
    peso:
      ex.loadMode === 'bodyweight' || ex.isBodyweight === true
        ? undefined
        : ex.prescribedLoadKg != null
          ? `${ex.prescribedLoadKg} kg`
          : ex.suggestedLoadKg != null
            ? `~${ex.suggestedLoadKg} kg`
            : ex.loadMode === 'exploratory'
              ? 'Exploratorio'
              : ex.peso,
    prescripcion: ex.prescripcion ?? {
      series: ex.sets,
      reps: ex.repRange ?? ex.reps,
      rirObjetivo: ex.rirTarget,
      pesoSugerido: ex.prescribedLoadKg ?? ex.suggestedLoadKg,
      descanso: ex.restSeconds,
      tempo: ex.tempo,
    },
  };
}

function mapCooldownExercise(ex: any) {
  const imageUrl = ex.imageUrl ?? ex.url_img_0 ?? null;
  return {
    ...ex,
    id: ex.id ?? ex.exerciseId,
    nombre: ex.nombre ?? ex.name,
    tiempo: ex.tiempo ?? (ex.durationSeconds ? `${ex.durationSeconds}s` : ex.reps),
    imageUrl,
    imageUrl2: ex.imageUrl2 ?? ex.url_img_1 ?? null,
    url_img_0: imageUrl,
    url_img_1: ex.imageUrl2 ?? ex.url_img_1 ?? null,
    musculoObjetivo: ex.musculoObjetivo ?? ex.muscleGroup,
  };
}

function wrapCooldownExercises(exercises: any[]) {
  const mapped = exercises.map(mapCooldownExercise);
  const totalSeconds = mapped.reduce((sum, ex) => sum + (ex.durationSeconds ?? 45), 0);
  return {
    tipo: 'cooldown',
    nombre: 'Enfriamiento',
    duracionEstimada: Math.max(1, Math.ceil(totalSeconds / 60)),
    fases: [
      {
        fase: 'General',
        duracion: Math.max(1, Math.ceil(totalSeconds / 60)),
        icono: '',
        descripcion: '',
        contenido: { tipo: 'estiramientos', ejercicios: mapped },
      },
    ],
  };
}

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

  // NORMALIZAR WARMUP -> array directo con campos UI
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

  if (Array.isArray(session.warmup)) {
    session.warmup = session.warmup.map((item: any) => ({
      ...item,
      id: item.id ?? item.exerciseId,
      nombre: item.nombre ?? item.name,
      duracion: item.isRampSet
        ? undefined
        : item.duracion ?? (item.durationSeconds ? `${item.durationSeconds} seg` : item.reps),
      faseRAMP: item.faseRAMP ?? item.phase,
      patronMovimiento: item.patronMovimiento ?? item.movementPattern,
      imageUrl: item.imageUrl ?? item.url_img_0 ?? null,
      imageUrl2: item.imageUrl2 ?? item.url_img_1 ?? null,
      url_img_0: item.url_img_0 ?? item.imageUrl ?? null,
      url_img_1: item.url_img_1 ?? item.imageUrl2 ?? null,
      descripcion: item.descripcion ?? item.instrucciones,
      correcciones: item.correcciones,
    }));
  }

  // NORMALIZAR MAINBLOCK: soporta { bloques: [...] } | { estaciones: [...] } | array
  // Normalize v3 flat mainBlock array from new backend
  if (Array.isArray(session.mainBlock)) {
    const exercises = session.mainBlock;
    session.mainBlock = {
      tipo: 'estaciones',
      descripcion: '',
      bloques: [{ ejercicios: exercises.map(mapExerciseFields) }],
    };
  } else if (session.mainBlock) {
    const mb = session.mainBlock;
    if (Array.isArray(mb)) {
      session.mainBlock = { tipo: 'estaciones', descripcion: '', bloques: mb };
    } else if (Array.isArray(mb.bloques)) {
      session.mainBlock = {
        ...mb,
        bloques: mb.bloques.map((block: any) => ({
          ...block,
          ejercicios: (block.ejercicios ?? []).map(mapExerciseFields),
        })),
      };
    } else if (Array.isArray(mb.estaciones)) {
      session.mainBlock = {
        ...mb,
        bloques: mb.estaciones.map((block: any) => ({
          ...block,
          ejercicios: (block.ejercicios ?? []).map(mapExerciseFields),
        })),
      };
    } else if (Array.isArray(mb.blocks)) {
      session.mainBlock = {
        ...mb,
        bloques: mb.blocks.map((block: any) => ({
          ...block,
          ejercicios: (block.ejercicios ?? []).map(mapExerciseFields),
        })),
      };
    } else if (mb.ejercicios && Array.isArray(mb.ejercicios)) {
      // un único bloque representado como objeto con ejercicios
      session.mainBlock = {
        tipo: 'estaciones',
        descripcion: '',
        bloques: [{ ejercicios: mb.ejercicios.map(mapExerciseFields) }],
      };
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

  // NORMALIZAR COOLDOWN — backend v3 devuelve array plano
  if (!session.cooldown) {
    session.cooldown = { tipo: 'cooldown', nombre: 'Enfriamiento', duracionEstimada: 0, fases: [] } as any;
  } else if (Array.isArray(session.cooldown)) {
    session.cooldown = wrapCooldownExercises(session.cooldown);
  } else if (!Array.isArray(session.cooldown.fases)) {
    if (Array.isArray(session.cooldown.ejercicios)) {
      session.cooldown = wrapCooldownExercises(session.cooldown.ejercicios);
    } else {
      session.cooldown.fases = session.cooldown.fases || [];
    }
  } else if (Array.isArray(session.cooldown.fases)) {
    session.cooldown = {
      ...session.cooldown,
      fases: session.cooldown.fases.map((fase: any) => ({
        ...fase,
        contenido: fase.contenido
          ? {
              ...fase.contenido,
              ejercicios: (fase.contenido.ejercicios ?? []).map(mapCooldownExercise),
            }
          : fase.contenido,
      })),
    };
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
