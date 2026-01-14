# Guía para usar Firebase Emulators

## Configuración completada ✅

### Puertos configurados:
- **Auth Emulator**: `localhost:9099`
- **Firestore Emulator**: `localhost:8080`
- **Emulator UI**: `http://localhost:4000`

## Pasos para iniciar el desarrollo con emuladores:

### 1. Iniciar los emuladores de Firebase
En una terminal, ejecuta:
```bash
npm run emulators
```

O directamente:
```bash
firebase emulators:start
```

### 2. Iniciar el servidor backend
En otra terminal, ejecuta:
```bash
npm run dev
```

## Verificar que todo funciona:

1. **Emulators UI**: Abre http://localhost:4000 en tu navegador
   - Deberías ver la interfaz del emulador con Auth y Firestore
   
2. **Backend Server**: Abre http://localhost:3000 en tu navegador
   - Deberías ver el health check con status OK

3. **Verificar conexión con emuladores**: En la consola del servidor deberías ver:
   ```
   Firebase Admin SDK: Inicializado...
   ```

## Configuración del Frontend

En tu aplicación frontend (React/Next.js), asegúrate de conectar a los emuladores:

```javascript
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Conectar a emuladores (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

## Solución de problemas:

### El login se queda cargando:
1. Verifica que los emuladores estén ejecutándose (`npm run emulators`)
2. Verifica que el frontend esté conectado a los emuladores (ver configuración arriba)
3. Abre la UI del emulador (http://localhost:4000) y verifica que aparezcan los usuarios creados

### No se crean usuarios/colecciones:
1. Verifica en la consola del backend que las variables de entorno estén configuradas:
   - `FIRESTORE_EMULATOR_HOST=localhost:8080`
   - `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`
2. Verifica que `NODE_ENV=development` en tu archivo `.env`
3. Reinicia el servidor backend después de iniciar los emuladores

### Errores de conexión:
- Asegúrate de que los puertos 9099, 8080 y 4000 no estén siendo usados por otros procesos
- Si cambias los puertos en firebase.json, actualiza también lib/firebaseAdmin.js

## Archivos de configuración:

- **firebase.json**: Configuración de puertos de emuladores
- **lib/firebaseAdmin.js**: Configuración del backend para conectarse a emuladores
- **.firebaserc**: ID del proyecto Firebase
- **.env**: Variables de entorno (NODE_ENV=development)
