// src/firebase.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Necesario para Auth
import { getFirestore } from 'firebase/firestore'; // Necesario para Firestore

// 1. Configuración de Firebase - ¡Solo los campos necesarios!
// Esto elimina la posibilidad de un fallo por el Measurement ID de Analytics
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // measurementId se omite temporalmente.
};

// 2. Inicializar Firebase
const app = initializeApp(firebaseConfig);

// 3. Obtener instancias de los servicios
export const auth = getAuth(app);
export const db = getFirestore(app);

// export const config = firebaseConfig; // Ya no es necesario exportar la config
export default app;
