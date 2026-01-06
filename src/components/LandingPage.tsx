// src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  BatteryCharging, 
  Layers, 
  Smartphone, 
  CheckCircle,
  Sliders
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-lime-500 selection:text-slate-900">
      
      {/* --- NAVBAR --- */}
      <nav className="flex justify-between items-center px-6 py-5 max-w-7xl mx-auto backdrop-blur-md sticky top-0 z-50 bg-slate-950/80">
        <div className="text-2xl font-black tracking-tighter text-white">
          Fit<span className="text-lime-400">Gen</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition">El Motor</a>
          <a href="#adaptability" className="hover:text-white transition">Tu Estilo de Vida</a>
          <a href="#pricing" className="hover:text-white transition">Planes</a>
        </div>
        <Link 
          to="/login" 
          className="text-sm font-bold text-white hover:text-lime-400 transition"
        >
          Entrar
        </Link>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative px-6 pt-12 pb-24 text-center max-w-5xl mx-auto mt-8">
        {/* Glow de fondo */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-lime-500/10 to-transparent blur-[120px] rounded-full -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800 text-lime-400 text-xs font-bold uppercase tracking-wide mb-8 backdrop-blur-sm">
          <Activity size={14} />
          Ingeniería Deportiva V2.0
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Entrenamiento que se adapta <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">
            al ritmo de tu vida.
          </span>
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Olvídate de las rutinas estáticas. <strong>FitGen</strong> utiliza un Motor de Periodización que ajusta tu entrenamiento día a día según tu fatiga, tu equipo disponible y tus otras actividades.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            to="/register" 
            className="w-full sm:w-auto px-8 py-4 bg-lime-500 hover:bg-lime-400 text-slate-950 font-black rounded-xl text-lg transition-all transform hover:scale-[1.02] shadow-[0_0_30px_rgba(132,204,22,0.3)]"
          >
            Comenzar mi Plan
          </Link>
          <p className="text-xs text-slate-500 font-medium mt-2 sm:mt-0">
            Prueba Premium de 7 Días incluida
          </p>
        </div>
      </header>

      {/* --- VALUE PROP: STATIC VS DYNAMIC --- */}
      <section className="px-6 py-20 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">¿Por qué FitGen es diferente?</h2>
            <p className="text-slate-400">La mayoría de apps te dan una lista de ejercicios. Nosotros te damos una estrategia.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Columna Izquierda: El problema (Genérico) */}
            <div className="space-y-8">
              <div className="flex gap-4 items-start opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <div className="mt-1 bg-slate-800 p-3 rounded-lg">
                  <Layers className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-300">Rutinas Estáticas</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    No saben si dormiste mal, si tuviste un día pesado en el trabajo o si te duele la rodilla. Simplemente te piden "cumplir".
                  </p>
                </div>
              </div>

              {/* Columna Derecha: La solución FitGen */}
              <div className="flex gap-4 items-start bg-slate-900 p-6 rounded-2xl border border-lime-500/20 shadow-lg shadow-lime-900/10">
                <div className="mt-1 bg-lime-500/10 p-3 rounded-lg">
                  <Sliders className="w-6 h-6 text-lime-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Periodización Dinámica</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Nuestro motor recalcula tu volumen e intensidad en tiempo real. Si tu carga externa es alta, ajustamos el entrenamiento para maximizar recuperación y progreso.
                  </p>
                </div>
              </div>
            </div>

            {/* Visualización Abstracta */}
            <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 relative overflow-hidden h-full flex flex-col justify-center">
               <div className="space-y-4">
                  <div className="flex justify-between text-sm text-slate-400 mb-1">
                    <span>Nivel de Energía detectado</span>
                    <span className="text-orange-400">Bajo (Día ocupado)</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div className="bg-orange-400 h-2 rounded-full w-[30%]"></div>
                  </div>
                  
                  <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 mt-4">
                    <p className="text-lime-400 text-xs font-mono mb-2">// MOTOR DE DECISIÓN</p>
                    <p className="text-slate-300 text-sm">
                      <span className="text-purple-400">Acción:</span> Reducir volumen del Mesociclo.<br/>
                      <span className="text-purple-400">Enfoque:</span> Mantenimiento técnico.<br/>
                      <span className="text-purple-400">Objetivo:</span> Evitar sobreentrenamiento.
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- INCLUSIVIDAD / CARGA EXTERNA --- */}
      <section id="adaptability" className="px-6 py-24">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Tu vida fuera del gym cuenta</h2>
          <p className="text-slate-400 text-lg">
            Cualquier actividad suma fatiga. FitGen integra tu contexto laboral y recreativo en la ecuación de tu progreso.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {/* Caso 1: Deporte */}
          <div className="group p-8 bg-slate-900 rounded-2xl border border-slate-800 hover:border-lime-500/50 transition duration-300">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition">
              <Activity className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Deportes y Hobbies</h3>
            <p className="text-slate-400 text-sm">
              ¿Juegas pádel, corres los domingos o practicas artes marciales? Ajustamos tus días de pierna para que llegues fresco a tu práctica.
            </p>
          </div>

          {/* Caso 2: Trabajo Físico */}
          <div className="group p-8 bg-slate-900 rounded-2xl border border-slate-800 hover:border-lime-500/50 transition duration-300">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500/20 transition">
              <BatteryCharging className="text-orange-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Trabajo Exigente</h3>
            <p className="text-slate-400 text-sm">
              Si tu trabajo requiere esfuerzo físico o estar mucho tiempo de pie, el motor gestiona el volumen para no sobrecargar tu sistema nervioso.
            </p>
          </div>

          {/* Caso 3: Equipo Limitado */}
          <div className="group p-8 bg-slate-900 rounded-2xl border border-slate-800 hover:border-lime-500/50 transition duration-300">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition">
              <Sliders className="text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Flexibilidad de Equipo</h3>
            <p className="text-slate-400 text-sm">
              ¿Hoy entrenas en casa? ¿El gym está lleno? Cambia tu entorno en un clic y recalculamos la sesión para mantener el estímulo exacto.
            </p>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="px-6 py-20 bg-slate-900 relative border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Personalización Profesional Accesible</h2>
          <p className="text-slate-400 mb-12">Mucho más que una app, mucho más accesible que un entrenador personal.</p>
          
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Plan Mensual */}
            <div className="p-8 rounded-2xl border border-slate-700 bg-slate-950/30 flex flex-col">
              <h3 className="text-xl font-semibold text-slate-300">Mensual Flexible</h3>
              <div className="my-6">
                <span className="text-4xl font-bold text-white">$149</span>
                <span className="text-slate-500"> / mes</span>
              </div>
              <ul className="text-left space-y-3 mb-8 text-sm text-slate-400 flex-grow">
                <li className="flex gap-2"><CheckCircle size={16} className="text-slate-500"/> Acceso total al Motor</li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-slate-500"/> Ajuste por fatiga diaria</li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-slate-500"/> Cancela cuando quieras</li>
              </ul>
              <Link to="/register" className="block w-full py-3 rounded-lg border border-slate-600 text-white font-semibold hover:bg-slate-800 transition">
                Seleccionar Mensual
              </Link>
            </div>

            {/* Plan Anual (Best Value) */}
            <div className="p-8 rounded-2xl border-2 border-lime-500 bg-slate-900/80 relative shadow-2xl shadow-lime-900/20 flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lime-500 text-slate-900 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Recomendado
              </div>
              <h3 className="text-xl font-semibold text-white">Plan Anual</h3>
              <div className="my-6">
                <span className="text-5xl font-bold text-white">$99</span>
                <span className="text-slate-500"> / mes</span>
              </div>
              <p className="text-lime-400/90 text-sm mb-6 font-medium bg-lime-400/10 py-1 px-2 rounded w-fit mx-auto">
                Facturado como $1,188 anuales
              </p>
              
              <ul className="text-left space-y-3 mb-8 text-sm text-slate-300 flex-grow">
                <li className="flex gap-2"><CheckCircle size={16} className="text-lime-400"/> <strong>Ahorras un 33%</strong></li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-lime-400"/> Compromiso con tus resultados</li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-lime-400"/> Todas las actualizaciones futuras</li>
              </ul>

              <Link to="/register" className="block w-full py-3 rounded-lg bg-lime-500 text-slate-900 font-bold hover:bg-lime-400 transition shadow-lg shadow-lime-500/20">
                Empezar Prueba Gratis
              </Link>
              <p className="text-xs text-slate-500 mt-4">7 días gratis sin cargo automático.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- APP INSTALL CTA --- */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl border border-slate-700">
          <Smartphone className="w-12 h-12 text-lime-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Lleva el Motor en tu bolsillo</h2>
          <p className="text-slate-400 mb-8">
            FitGen funciona como una app nativa. Instálala directamente desde el navegador, úsala offline y mantén tu enfoque sin distracciones.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-mono text-slate-500">
            <span className="px-3 py-1 bg-slate-950 rounded border border-slate-800">iOS Compatible</span>
            <span className="px-3 py-1 bg-slate-950 rounded border border-slate-800">Android Compatible</span>
            <span className="px-3 py-1 bg-slate-950 rounded border border-slate-800">Offline-First</span>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-slate-600 text-sm bg-slate-950 border-t border-slate-900">
        <p>© 2026 FitGen. Ingeniería aplicada al rendimiento humano.</p>
      </footer>
    </div>
  );
};

export default LandingPage;