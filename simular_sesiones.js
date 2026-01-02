import fetch from 'node-fetch';
import fs from 'fs';

// Configura tu token de usuario y URL del backend
const USER_TOKEN = 'AQUI_TU_TOKEN';
const BACKEND_URL = 'https://fit-gen-backend.vercel.app/api/session/complete';

// Simula datos de feedback y performance para 14 días
const generateSessionData = (day) => ({
  sessionFeedback: {
    rpe: Math.floor(Math.random() * 4) + 7, // 7-10
    notes: `Simulación día ${day}`,
    energyLevel: Math.floor(Math.random() * 5) + 6, // 6-10
    sorenessLevel: Math.floor(Math.random() * 5) + 1 // 1-5
  },
  exercisesPerformance: [
    {
      exerciseId: 'squat',
      actualSets: [
        { set: 1, reps: 10, rir: 2, load: '60kg' },
        { set: 2, reps: 10, rir: 2, load: '60kg' },
        { set: 3, reps: 10, rir: 1, load: '60kg' }
      ]
    },
    {
      exerciseId: 'bench',
      actualSets: [
        { set: 1, reps: 8, rir: 2, load: '40kg' },
        { set: 2, reps: 8, rir: 2, load: '40kg' },
        { set: 3, reps: 8, rir: 1, load: '40kg' }
      ]
    }
  ]
});

const main = async () => {
  const results = [];
  for (let day = 1; day <= 14; day++) {
    const body = generateSessionData(day);
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USER_TOKEN}`
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    results.push({ day, sent: body, response: data });
    console.log(`Día ${day} enviado, respuesta:`, data.success);
    await new Promise(r => setTimeout(r, 500)); // Espera para no saturar
  }
  fs.writeFileSync('simulacion_sesiones.json', JSON.stringify(results, null, 2));
  console.log('Simulación terminada. Resultados en simulacion_sesiones.json');
};

main();
