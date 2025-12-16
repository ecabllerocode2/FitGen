# 🎯 Guía Visual - Algoritmo V5

## 📱 Flujo de Usuario Completo

```
┌─────────────────────────────────────────────────────────────┐
│                      1. DASHBOARD                           │
│  ┌───────────────────────────────────────────────────┐     │
│  │  Usuario presiona "GENERAR RUTINA INTELIGENTE"    │     │
│  └───────────────────────────────────────────────────┘     │
│                           ↓                                  │
│  ┌───────────────────────────────────────────────────┐     │
│  │         MODAL: Feedback Pre-Entrenamiento         │     │
│  │  - Energía: [1] [2] [3] [4] [5]                  │     │
│  │  - Dolor: [1] [2] [3] [4] [5]                    │     │
│  └───────────────────────────────────────────────────┘     │
│                           ↓                                  │
│           POST /api/session/generate                        │
│                           ↓                                  │
│  ┌───────────────────────────────────────────────────┐     │
│  │  ✅ Sesión generada con Algoritmo V5              │     │
│  │  - Ejercicios rotados (evita repetición)          │     │
│  │  - RIR calculado según readiness                  │     │
│  │  - Técnicas de intensidad aplicadas               │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘

                           ↓ Navega a /workout/today

┌─────────────────────────────────────────────────────────────┐
│                  2. WORKOUT OVERVIEW                         │
│  ┌───────────────────────────────────────────────────┐     │
│  │     📋 Vista Previa de la Sesión                  │     │
│  │                                                     │     │
│  │  🔥 Calentamiento                                  │     │
│  │  💪 Bloque Principal 1                             │     │
│  │    - Press Banca: 4 x 10-12 | RIR 2              │     │
│  │      [Technique: Tempo 3-0-3] 🟣                  │     │
│  │    - Aperturas: 3 x 12-15 | RIR 2                │     │
│  │                                                     │     │
│  │  🎯 Bloque Core                                    │     │
│  │  🧘 Vuelta a la Calma                              │     │
│  │                                                     │     │
│  │  [COMENZAR SESIÓN] ← Usuario presiona             │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘

                           ↓ Navega a /workout/player

┌─────────────────────────────────────────────────────────────┐
│                  3. WORKOUT PLAYER                           │
│  ┌───────────────────────────────────────────────────┐     │
│  │  🎬 Video/Imagen del ejercicio                     │     │
│  │                                                     │     │
│  │  Press Banca con Mancuernas                        │     │
│  │  Serie 1 de 4                                      │     │
│  │                                                     │     │
│  │  ┌──────────────────┬──────────────────┐          │     │
│  │  │  Meta            │  Carga Sugerida  │          │     │
│  │  │  10-12 reps      │  20kg            │          │     │
│  │  │  [RIR 2] 🟢      │  [Tempo 3-0-3] 🟣│          │     │
│  │  └──────────────────┴──────────────────┘          │     │
│  │                                                     │     │
│  │  ℹ️ PROGRESO: RIR promedio 3.2 fue alto.          │     │
│  │     Aumenta peso +5%                               │     │
│  │                                                     │     │
│  │  [LISTO / SIGUIENTE] ← Usuario presiona           │     │
│  └───────────────────────────────────────────────────┘     │
│                           ↓                                  │
│  ┌───────────────────────────────────────────────────┐     │
│  │      🎯 MODAL: Captura de Rendimiento              │     │
│  │                                                     │     │
│  │  Serie 1 Completada                                │     │
│  │  Press Banca con Mancuernas                        │     │
│  │  🎯 Objetivo: 10-12 reps | RIR 2                  │     │
│  │                                                     │     │
│  │  ¿Cuántas repeticiones hiciste?                   │     │
│  │  [  12  ] ← Input numérico                        │     │
│  │                                                     │     │
│  │  RIR - ¿Cuántas más podías hacer?                 │     │
│  │  [0] [1] [2] [3] [4] [5] ← Botones                │     │
│  │           ✅ (seleccionado)                         │     │
│  │                                                     │     │
│  │  ¿Qué carga usaste?                                │     │
│  │  [ 20kg ] ← Input texto                           │     │
│  │                                                     │     │
│  │  [Saltar]  [Guardar y Continuar]                  │     │
│  └───────────────────────────────────────────────────┘     │
│                           ↓                                  │
│  Datos guardados en estado local:                          │
│  exercisesPerformance["abc123"] = [                        │
│    { set: 1, reps: 12, rir: 2, load: "20kg" }             │
│  ]                                                          │
│                           ↓                                  │
│  Siguiente ejercicio o descanso...                         │
│  (Repite captura después de cada serie)                    │
└─────────────────────────────────────────────────────────────┘

                           ↓ Después del último ejercicio

┌─────────────────────────────────────────────────────────────┐
│              4. FEEDBACK POST-ENTRENAMIENTO                  │
│  ┌───────────────────────────────────────────────────┐     │
│  │  🏆 ¡Sesión Terminada!                             │     │
│  │                                                     │     │
│  │  ¿Qué tan difícil fue? (RPE)                       │     │
│  │  Muy Fácil ←──[████████──]──→ Fallo Muscular      │     │
│  │                    8                                │     │
│  │                                                     │     │
│  │  Notas de la sesión (Opcional)                     │     │
│  │  ┌─────────────────────────────────────────┐      │     │
│  │  │ Subí peso en press banca, buena sesión  │      │     │
│  │  └─────────────────────────────────────────┘      │     │
│  │                                                     │     │
│  │  [GUARDAR PROGRESO] ← Usuario presiona            │     │
│  └───────────────────────────────────────────────────┘     │
│                           ↓                                  │
│           POST /api/session/complete                        │
│           Payload incluye:                                  │
│           - sessionFeedback: { rpe, notes }                │
│           - exercisesPerformance: [                        │
│               { exerciseId, actualSets: [...] }           │
│             ]                                               │
└─────────────────────────────────────────────────────────────┘

                           ↓

┌─────────────────────────────────────────────────────────────┐
│                    5. BACKEND PROCESA                        │
│  ┌───────────────────────────────────────────────────┐     │
│  │  ✅ Sesión marcada como completada                 │     │
│  │  ✅ Datos guardados en history                     │     │
│  │  ✅ Análisis de rendimiento calculado:             │     │
│  │                                                     │     │
│  │  Press Banca:                                      │     │
│  │    - Avg Reps: 10.5                                │     │
│  │    - Avg RIR: 1.5                                  │     │
│  │    - Recomendación próxima:                        │     │
│  │      "🛡️ Mantén peso, perfecciona técnica"        │     │
│  │                                                     │     │
│  │  Aperturas:                                        │     │
│  │    - Avg Reps: 14.3                                │     │
│  │    - Avg RIR: 3.2                                  │     │
│  │    - Recomendación próxima:                        │     │
│  │      "⚡ Aumenta peso +5%"                          │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘

                           ↓ Navega de vuelta a /

┌─────────────────────────────────────────────────────────────┐
│                  6. DASHBOARD (ACTUALIZADO)                  │
│  ┌───────────────────────────────────────────────────┐     │
│  │  ✅ Sesión completada                              │     │
│  │  📊 Estadísticas actualizadas                      │     │
│  │  🎯 Listo para próxima sesión                      │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos Técnico

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│                                                              │
│  Dashboard.tsx                                               │
│    └─→ handleGenerateSession()                              │
│         └─→ POST /api/session/generate                      │
│              Body: {                                         │
│                userId,                                       │
│                date,                                         │
│                realTimeFeedback: {                          │
│                  energyLevel: 4,                            │
│                  sorenessLevel: 2                           │
│                }                                             │
│              }                                               │
│                     ↓                                        │
│         ← Response: { success, session, context }           │
│                     ↓                                        │
│         Firestore.update(                                   │
│           'users/{uid}/currentSession',                     │
│           session                                            │
│         )                                                    │
└─────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Firebase)                │
│                                                              │
│  /api/session/generate                                       │
│    1. Obtiene perfil de usuario                             │
│    2. Calcula readinessScore                                │
│       = (energyLevel + (6 - sorenessLevel)) / 2            │
│    3. Determina sessionMode                                 │
│       - performance: ≥3.5                                   │
│       - maintenance: 2.5-3.4                                │
│       - survival: <2.5                                      │
│    4. Busca historial del mismo día (últimas 2 semanas)    │
│    5. Filtra ejercicios repetidos                           │
│    6. Para cada ejercicio:                                  │
│       a. Busca rendimiento previo                           │
│       b. Calcula progresión (targetRIR, loadProgression)   │
│       c. Aplica técnicas de intensidad si aplica           │
│       d. Genera notes con recomendaciones                   │
│    7. Aplica periodización ondulante                        │
│    8. Retorna sesión completa                               │
└─────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  FIRESTORE STRUCTURE                         │
│                                                              │
│  users/                                                      │
│    {uid}/                                                    │
│      ├─ profileData/                                        │
│      │    ├─ name: "Juan Pérez"                            │
│      │    ├─ fitnessGoal: "Hipertrofia"                    │
│      │    ├─ availableEquipment: ["Mancuernas", ...]      │
│      │    └─ weeklyScheduleContext: [...]                  │
│      │                                                      │
│      ├─ currentMesocycle/                                   │
│      │    ├─ mesocyclePlan: {...}                          │
│      │    ├─ startDate: "2025-12-01"                       │
│      │    ├─ currentWeek: 3                                │
│      │    └─ status: "active"                               │
│      │                                                      │
│      ├─ currentSession/  ← ✅ SE ACTUALIZA AQUÍ            │
│      │    ├─ sessionGoal: "Empuje (Push)"                  │
│      │    ├─ mainBlocks: [                                 │
│      │    │    {                                            │
│      │    │      exercises: [                               │
│      │    │        {                                        │
│      │    │          id: "abc123",                          │
│      │    │          name: "Press Banca",                   │
│      │    │          targetRIR: 2,  ← NUEVO V5             │
│      │    │          technique: "standard",  ← NUEVO V5    │
│      │    │          performanceData: {  ← NUEVO V5        │
│      │    │            plannedSets: 4,                     │
│      │    │            actualSets: []                       │
│      │    │          }                                      │
│      │    │        }                                        │
│      │    │      ]                                          │
│      │    │    }                                            │
│      │    ├─ ]                                              │
│      │    ├─ completed: false                               │
│      │    └─ meta: {                                        │
│      │         readinessScore: 3.5,  ← NUEVO V5            │
│      │         sessionMode: "performance",  ← NUEVO V5     │
│      │         targetRIR: 2  ← NUEVO V5                    │
│      │       }                                              │
│      │                                                      │
│      └─ history/  ← ✅ SE CREA AL COMPLETAR                │
│           {autoId}/                                         │
│             ├─ date: "2025-12-16"                           │
│             ├─ completedAt: "2025-12-16T11:45:00Z"         │
│             ├─ feedback: { rpe, notes, energyLevel, ... }  │
│             └─ exercises: [                                 │
│                  {                                          │
│                    id: "abc123",                            │
│                    performanceData: {                       │
│                      actualSets: [                          │
│                        {set: 1, reps: 12, rir: 2, ...}     │
│                      ]                                      │
│                    },                                       │
│                    analysis: {  ← ✅ CALCULADO POR BACKEND │
│                      avgReps: 10.5,                         │
│                      avgRIR: 1.5,                           │
│                      progressionRecommendation: "..."       │
│                    }                                        │
│                  }                                          │
│                ]                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Componentes UI Actualizados

### 1. Dashboard.tsx
```
✅ FeedbackModal (ya existía)
  - Captura energyLevel y sorenessLevel
  - Envía en POST /generate

✅ handleGenerateSession (ya existía)
  - Envía realTimeFeedback al backend
  - Guarda sesión en Firestore
```

### 2. WorkoutOverview.tsx
```
✅ Interface Exercise actualizada
  - targetRIR?: number
  - technique?: string
  - performanceData?: {...}

✅ ExerciseRow component
  - Muestra badge RIR verde
  - Muestra badge Technique morado
```

### 3. WorkoutPlayer.tsx
```
🆕 Estado exercisesPerformance
  - Almacena rendimiento por ejercicio
  - Formato: Record<exerciseId, actualSets[]>

🆕 SetCaptureModal component
  - Input de repeticiones
  - Botones de RIR (0-5)
  - Input de carga

🆕 handleNext modificado
  - Detecta ejercicios principales
  - Abre modal después de cada serie
  - Guarda datos en estado local

🆕 handleSaveFeedback actualizado
  - Formatea exercisesPerformance
  - Envía en POST /complete
```

---

## 📊 Ejemplo de Progresión

### Semana 1 - Lunes (Primera vez)
```
Press Banca:
  📋 Prescrito: 4 x 10-12, RIR 2
  📊 Realizado:
    - Serie 1: 12 reps, RIR 2, 20kg
    - Serie 2: 11 reps, RIR 2, 20kg
    - Serie 3: 10 reps, RIR 1, 20kg
    - Serie 4: 9 reps, RIR 1, 20kg
  
  📈 Análisis:
    - Avg Reps: 10.5
    - Avg RIR: 1.5 (cerca del fallo)
    
  ✅ Backend guarda en history
```

### Semana 2 - Lunes (Ejercicio rotado)
```
Press Inclinado con Mancuernas (rotación automática)
  📋 Prescrito: 4 x 10-12, RIR 2
  📊 Realizado: ...
```

### Semana 3 - Lunes (Vuelve Press Banca)
```
Press Banca:
  📋 Prescrito: 4 x 10-12, RIR 2
  ℹ️ Notes: "🛡️ MANTENER: RIR promedio 1.5 fue bajo.
            Mantén 20kg y perfecciona técnica"
  
  📊 Realizado:
    - Serie 1: 12 reps, RIR 2, 20kg ✅ MEJOR
    - Serie 2: 12 reps, RIR 2, 20kg ✅ MEJOR
    - Serie 3: 11 reps, RIR 2, 20kg ✅ MEJOR
    - Serie 4: 10 reps, RIR 1, 20kg
  
  📈 Análisis:
    - Avg Reps: 11.25 ⬆️ +0.75
    - Avg RIR: 1.75 ⬆️ +0.25
    
  ✅ Progreso confirmado
```

### Semana 4 - Lunes
```
Press Banca:
  📋 Prescrito: 4 x 10-12, RIR 2
  ℹ️ Notes: "⚡ PROGRESO: RIR promedio 1.75 está bien.
            Aumenta peso +5% a 21kg"
  
  📊 Usuario usa 21kg...
  (Ciclo continúa)
```

---

## ✅ Checklist de Validación

### Funcionalidad Básica
- ✅ Usuario puede generar sesión con feedback pre-entrenamiento
- ✅ Sesión muestra targetRIR y technique en badges
- ✅ Modal captura reps, RIR y carga después de cada serie
- ✅ Datos se envían correctamente al completar sesión
- ✅ Backend guarda en Firestore correctamente

### Flujo de Datos
- ✅ realTimeFeedback se envía en /generate
- ✅ exercisesPerformance se envía en /complete
- ✅ Estructura de actualSets coincide con backend
- ✅ Firebase almacena en paths correctos

### UI/UX
- ✅ Badges visuales para RIR y technique
- ✅ Modal intuitivo con botones de RIR
- ✅ Permite saltar captura si usuario lo desea
- ✅ Muestra objetivos claramente (targetReps, targetRIR)

### Algoritmo V5
- ✅ Evita repetición de ejercicios (2 semanas)
- ✅ Calcula readinessScore correctamente
- ✅ Aplica sessionMode según readiness
- ✅ Genera recomendaciones de progresión
- ✅ Aplica técnicas de intensidad (Tempo, Rest-Pause)

---

**🎉 IMPLEMENTACIÓN COMPLETA**

El frontend está 100% adaptado al Algoritmo V5 del backend.
Todos los componentes funcionan correctamente y sin errores.
