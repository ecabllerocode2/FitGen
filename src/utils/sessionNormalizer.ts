import type { GeneratedSession } from '../types/session';
import { formatLoadLabel, resolveLoadConvention } from './loadConvention';
import { resolveExerciseMediaFromFields } from './exerciseMedia';
import { enrichExerciseCoachingFields } from './exerciseCoachingLookup';
import { normalizeWeightUnit, type WeightUnit } from './weightUnits';

function buildPesoLabel(ex: any, unit: WeightUnit = 'kg'): string | undefined {
  if (ex.loadMode === 'bodyweight' || ex.isBodyweight === true) return undefined;
  const convention = resolveLoadConvention(ex);
  if (ex.loadMode === 'exploratory' && ex.prescribedLoadKg == null) {
    return formatLoadLabel(ex.suggestedLoadKg, convention, { approximate: true, exploratory: !ex.suggestedLoadKg, unit }) ?? 'Exploratorio';
  }
  if (ex.prescribedLoadKg != null) {
    return formatLoadLabel(ex.prescribedLoadKg, convention, { unit }) ?? undefined;
  }
  if (ex.suggestedLoadKg != null) {
    return formatLoadLabel(ex.suggestedLoadKg, convention, { approximate: true, unit }) ?? undefined;
  }
  if (ex.loadMode === 'exploratory') return 'Exploratorio';
  return ex.peso;
}

function mapExerciseFields(ex: any, unit: WeightUnit = 'kg') {
  const enriched = enrichExerciseCoachingFields(ex);
  const { imageUrl, imageUrl2 } = resolveExerciseMediaFromFields(enriched);
  const loadConvention = enriched.loadConvention ?? resolveLoadConvention(enriched);
  const mapped = {
    ...enriched,
    id: ex.exerciseId ?? ex.id,
    nombre: ex.exerciseName ?? ex.nombre ?? ex.name,
    parteCuerpo: ex.muscleGroup ?? ex.parteCuerpo,
    patronMovimiento: ex.movementPattern ?? ex.patronMovimiento,
    imageUrl: imageUrl ?? null,
    imageUrl2: imageUrl2 ?? null,
    url_img_0: imageUrl ?? null,
    url_img_1: imageUrl2 ?? null,
    sets: ex.sets,
    reps: ex.repRange ?? ex.reps,
    restSeconds: ex.restSeconds,
    descripcion: enriched.descripcion,
    correcciones: enriched.correcciones,
    instrucciones: enriched.instrucciones,
    loadMode: ex.loadMode,
    loadConvention,
    equipo: ex.equipo,
    isUnilateral: ex.isUnilateral,
    isBodyweight: ex.isBodyweight ?? ex.loadMode === 'bodyweight',
    emphasisTag: ex.emphasisTag ?? null,
    prescribedLoadKg: ex.prescribedLoadKg,
    suggestedLoadKg: ex.suggestedLoadKg,
    peso: buildPesoLabel({ ...ex, loadConvention }, unit),
    prescripcion: ex.prescripcion ?? {
      series: ex.sets,
      reps: ex.repRange ?? ex.reps,
      rirObjetivo: ex.rirTarget,
      pesoSugerido: ex.prescribedLoadKg ?? ex.suggestedLoadKg,
      descanso: ex.restSeconds,
      tempo: ex.tempo,
    },
  };
  return mapped;
}

function mapCooldownExercise(ex: any) {
  const enriched = enrichExerciseCoachingFields(ex);
  const { imageUrl, imageUrl2 } = resolveExerciseMediaFromFields(enriched);
  return {
    ...enriched,
    id: ex.id ?? ex.exerciseId,
    nombre: ex.nombre ?? ex.name,
    tiempo: ex.tiempo ?? (ex.durationSeconds ? `${ex.durationSeconds}s` : ex.reps),
    imageUrl: imageUrl ?? null,
    imageUrl2: imageUrl2 ?? null,
    url_img_0: imageUrl ?? null,
    url_img_1: imageUrl2 ?? null,
    musculoObjetivo: ex.musculoObjetivo ?? ex.muscleGroup,
    descripcion: ex.descripcion,
    instrucciones: ex.instrucciones ?? ex.descripcion,
    correcciones: ex.correcciones,
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
export function normalizeSession(raw: any, options: { weightUnit?: WeightUnit } = {}): GeneratedSession | null {
  if (!raw) return null;
  const weightUnit = normalizeWeightUnit(options.weightUnit);

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
    session.warmup = session.warmup.map((item: any) => {
      const enriched = enrichExerciseCoachingFields(item);
      const media = resolveExerciseMediaFromFields(enriched);
      return {
      ...enriched,
      id: item.id ?? item.exerciseId,
      nombre: item.nombre ?? item.name,
      duracion: item.isRampSet
        ? undefined
        : item.duracion ?? (item.durationSeconds ? `${item.durationSeconds} seg` : item.reps),
      faseRAMP: item.faseRAMP ?? item.phase,
      patronMovimiento: item.patronMovimiento ?? item.movementPattern,
      imageUrl: media.imageUrl ?? null,
      imageUrl2: media.imageUrl2 ?? null,
      url_img_0: media.imageUrl ?? null,
      url_img_1: media.imageUrl2 ?? null,
      descripcion: item.descripcion ?? item.instrucciones,
      correcciones: item.correcciones,
    };
    });
  }

  // NORMALIZAR MAINBLOCK: soporta { bloques: [...] } | { estaciones: [...] } | array
  // Normalize v3 flat mainBlock array from new backend
  if (Array.isArray(session.mainBlock)) {
    const exercises = session.mainBlock;
    session.mainBlock = {
      tipo: 'estaciones',
      descripcion: '',
      bloques: [{ ejercicios: exercises.map((exercise: any) => mapExerciseFields(exercise, weightUnit)) }],
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
          ejercicios: (block.ejercicios ?? []).map((exercise: any) => mapExerciseFields(exercise, weightUnit)),
        })),
      };
    } else if (Array.isArray(mb.estaciones)) {
      session.mainBlock = {
        ...mb,
        bloques: mb.estaciones.map((block: any) => ({
          ...block,
          ejercicios: (block.ejercicios ?? []).map((exercise: any) => mapExerciseFields(exercise, weightUnit)),
        })),
      };
    } else if (Array.isArray(mb.blocks)) {
      session.mainBlock = {
        ...mb,
        bloques: mb.blocks.map((block: any) => ({
          ...block,
          ejercicios: (block.ejercicios ?? []).map((exercise: any) => mapExerciseFields(exercise, weightUnit)),
        })),
      };
    } else if (mb.ejercicios && Array.isArray(mb.ejercicios)) {
      // un único bloque representado como objeto con ejercicios
      session.mainBlock = {
        tipo: 'estaciones',
        descripcion: '',
        bloques: [{ ejercicios: mb.ejercicios.map((exercise: any) => mapExerciseFields(exercise, weightUnit)) }],
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
    session.coreBlock.ejercicios = (session.coreBlock.ejercicios || []).map((exercise: any) => mapExerciseFields(exercise, weightUnit));
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
  session.finisher = session.finisher ?? null;
  session.coachingBrief = session.coachingBrief ?? null;

  return session as GeneratedSession;
}
