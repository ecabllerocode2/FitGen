# 🏗️ Configuración de Entornos - FitGen

## Variables de Entorno

FitGen utiliza diferentes configuraciones para desarrollo y producción:

### Desarrollo Local
Para desarrollo, el backend debe ejecutarse en `http://localhost:3000`

```bash
# Copiar el archivo de ejemplo
cp .env.example .env.development

# Editar las variables según sea necesario
VITE_BACKEND_URL=http://localhost:3000
```

### Producción
```bash
# Copiar el archivo de ejemplo
cp .env.example .env.production

# Configurar la URL de producción
VITE_BACKEND_URL=https://fit-gen-backend.vercel.app
```

## Comandos de Desarrollo

```bash
# Desarrollo (usa .env.development)
npm run dev

# Build para desarrollo
npm run build:dev

# Build para producción (usa .env.production)
npm run build

# Preview del build
npm run preview
```

## Configuración Centralizada

Todos los endpoints están centralizados en `src/config/api.ts`:

```typescript
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';

// Ejemplo de uso
const response = await authenticatedFetch(API_ENDPOINTS.SESSION_GENERATE, token, {
  method: 'POST',
  body: JSON.stringify(data)
});
```

## Endpoints Disponibles

- `SESSION_GENERATE`: Generación de sesiones
- `SESSION_COMPLETE`: Completar sesiones
- `SESSION_SWAP_EXERCISE`: Intercambio de ejercicios
- `MESOCYCLE_GENERATE`: Generación de mesociclos
- `MESOCYCLE_EVALUATE`: Evaluación de mesociclos
- `USER_PROFILE_SAVE`: Guardar perfil de usuario

## Desarrollo del Backend

Cuando desarrolles el backend localmente:

1. Ejecuta tu servidor backend en el puerto 3000
2. Usa `npm run dev` para el frontend
3. El frontend automáticamente se conectará a `http://localhost:3000`

## Deployment

### Desarrollo
```bash
npm run build:dev
```

### Producción
```bash
npm run build
```

Los builds utilizarán automáticamente las variables de entorno correspondientes (.env.development o .env.production).