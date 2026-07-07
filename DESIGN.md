# FitGen — Guía de Diseño Visual

**Versión:** 1.0  
**Estado:** Documento de referencia para todo desarrollo de UI  
**Regla:** Ningún cambio visual debe contradecir esta guía sin actualizarla explícitamente.

---

## 1. Filosofía visual

FitGen es una PWA móvil-first con estética **dark mode deportiva**: fondos oscuros, acento lime vibrante, tipografía bold para jerarquía, y animaciones sutiles que comunican actividad sin distraer durante el entrenamiento.

---

## 2. Paleta de colores

### App shell (autenticado)

| Token | Valor Tailwind | Uso |
|---|---|---|
| `bg-app` | `zinc-900` | Fondo principal de la app |
| `bg-card` | `zinc-800` | Tarjetas, modales, paneles |
| `bg-card-hover` | `zinc-700` | Hover en elementos interactivos |
| `text-primary` | `white` | Títulos, valores importantes |
| `text-secondary` | `zinc-400` | Texto secundario, labels |
| `text-muted` | `zinc-500` | Texto terciario, hints |
| `accent` | `lime-500` | CTAs primarios, highlights, progreso |
| `accent-hover` | `lime-400` | Hover en CTAs |
| `accent-text` | `zinc-900` | Texto sobre fondo accent |
| `border-default` | `zinc-700` | Bordes de tarjetas |
| `border-subtle` | `zinc-800` | Bordes sutiles |

### Landing page (marketing)

| Token | Valor Tailwind | Uso |
|---|---|---|
| `bg-landing` | `slate-950` | Fondo landing |
| `bg-landing-card` | `slate-900` | Tarjetas de features |
| `text-landing` | `slate-100` | Texto principal |
| `text-landing-muted` | `slate-400` | Texto secundario |
| `border-landing` | `slate-800` | Bordes |

### Acentos semánticos

| Contexto | Color | Uso |
|---|---|---|
| Evaluación / info | `blue-400` / `blue-500` | MesocycleEvaluate, tooltips educativos |
| Stats / éxito | `emerald-400` / `emerald-500` | StatsAndAchievements, completado |
| Alerta / warning | `orange-400` / `orange-500` | Readiness bajo, advertencias |
| Error / peligro | `red-400` / `red-500` | Errores, dolor articular |
| Descanso | `zinc-600` | Días de descanso |

### PWA

| Token | Valor |
|---|---|
| `theme-color` | `#18181B` (zinc-900) |

---

## 3. Tipografía

- **Familia:** System sans-serif (Tailwind default)
- **Títulos de pantalla:** `text-2xl font-bold` o `text-3xl font-bold`
- **Subtítulos de sección:** `text-lg font-bold`
- **Cuerpo:** `text-sm` o `text-base`
- **Labels secundarios:** `text-xs text-zinc-400`
- **Números de timer/reps:** `tabular-nums` (clase custom en index.css)
- **Idioma UI:** Español en todo el producto

---

## 4. Componentes reutilizables (patrones implícitos actuales)

### Botón primario (CTA)
```
bg-lime-500 text-zinc-900 font-bold py-3 px-4 rounded-lg hover:bg-lime-400 transition
```

### Botón secundario
```
bg-zinc-700 text-white font-semibold py-3 px-4 rounded-lg hover:bg-zinc-600 transition
```

### Botón outline
```
border border-zinc-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-zinc-800 transition
```

### Tarjeta
```
bg-zinc-800 rounded-xl p-4 border border-zinc-700
```

### Modal overlay
```
fixed inset-0 bg-black/70 flex items-center justify-center z-50
```

### Modal content
```
bg-zinc-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-zinc-700 shadow-2xl
```

### Input
```
bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-lime-500
```

### Progress bar
```
bg-zinc-700 rounded-full h-2 overflow-hidden
  → fill: bg-lime-500 h-full transition-all duration-1000
```

### Badge / pill
```
bg-lime-500/10 text-lime-400 text-xs font-bold px-3 py-1 rounded-full
```

---

## 5. Animaciones (definidas en `src/index.css`)

| Clase | Uso |
|---|---|
| `animate-pulse-subtle` | Imágenes de ejercicio en WorkoutPlayer |
| `animate-fade-in` | Transiciones de imagen |
| `animate-shake` | Alertas de validación |
| `animate-glow` | Timer circular activo |
| `animate-slide-up` | Entrada de paneles |
| `animate-scale-in` | Modales, celebraciones |
| `animate-breathe` | Estado de descanso en WorkoutPlayer |

---

## 6. Layout y espaciado

- **Padding de pantalla:** `px-4` o `px-6`
- **Gap entre secciones:** `space-y-4` o `space-y-6`
- **Safe areas móvil:** `safe-area-bottom`, `safe-area-top` (clases custom)
- **Scroll horizontal sin barra:** `scrollbar-hide`
- **Max width contenido:** `max-w-2xl mx-auto` en pantallas principales

---

## 7. Iconografía

- **Librería:** `lucide-react`
- **Tamaño estándar en UI:** `size={20}` o `size={24}`
- **Tamaño en landing/features:** `size={16}` en listas, iconos de feature `w-12 h-12`

---

## 8. Reglas de consistencia

1. **Nunca usar colores fuera de la paleta** sin documentarlos aquí primero.
2. **Landing usa slate-*, app usa zinc-*** — no mezclar en la misma pantalla.
3. **El acento lime solo se usa para acciones primarias y progreso** — no para texto de cuerpo.
4. **Modales siempre con overlay oscuro** (`bg-black/70`) y contenido `bg-zinc-800`.
5. **Durante el entrenamiento (WorkoutPlayer):** priorizar legibilidad y targets táctiles grandes; evitar animaciones distractoras excepto timer y transiciones de fase.
