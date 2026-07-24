import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BatteryLow,
  Brain,
  Check,
  Dumbbell,
  Gauge,
  Shield,
  Smartphone,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

const BENCH_IMG_0 = '/landing-bench-0.webp';
const BENCH_IMG_1 = '/landing-bench-1.webp';
const AVATAR_MALE = '/assets/avatar/male/ectomorph/stage-3.png';
const AVATAR_FEMALE = '/assets/avatar/female/slender/stage-2.png';

function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-6');
          }
        });
      },
      { threshold: 0.12 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
}

function ExerciseMediaMock() {
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 1400);
    return () => window.clearInterval(id);
  }, []);

  if (failed) {
    return (
      <div className="aspect-video rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <Dumbbell className="w-10 h-10 text-zinc-600" />
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden relative">
      <img
        src={frame === 0 ? BENCH_IMG_0 : BENCH_IMG_1}
        alt="Press de banca con barra"
        className="w-full h-full object-contain transition-opacity duration-500"
        onError={() => setFailed(true)}
      />
      <div className="absolute bottom-2 right-2 flex gap-1">
        <span className={`w-1.5 h-1.5 rounded-full ${frame === 0 ? 'bg-lime-400' : 'bg-zinc-600'}`} />
        <span className={`w-1.5 h-1.5 rounded-full ${frame === 1 ? 'bg-lime-400' : 'bg-zinc-600'}`} />
      </div>
    </div>
  );
}

/** Phone frame mock — athlete session */
function AthleteSessionMock() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[280px]">
      <div className="absolute -inset-8 bg-lime-500/20 blur-3xl rounded-full pointer-events-none" />
      <div className="relative rounded-[2rem] border border-zinc-700/80 bg-zinc-950 shadow-2xl shadow-black/60 overflow-hidden ring-1 ring-white/5">
        <div className="h-7 bg-zinc-900 flex items-center justify-center">
          <div className="w-16 h-1 rounded-full bg-zinc-700" />
        </div>
        <div className="px-4 pb-5 pt-2 space-y-3">
          <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Principal · Serie 2/4</p>
          <ExerciseMediaMock />
          <h4 className="text-base font-bold text-white leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            Press de banca con barra
          </h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-lime-400 tabular-nums">8–10</span>
            <span className="text-xs text-zinc-500">reps · 60 kg · deja 2 en reserva</span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Cómo realizar: baja con control, empuja con fuerza. No rebotes la barra en el pecho.
          </p>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-2">
            <p className="text-[9px] font-semibold text-amber-300 uppercase tracking-wide mb-1">Puntos clave</p>
            <p className="text-[10px] text-zinc-400">Omóplatos juntos · pies firmes en el suelo</p>
          </div>
          <button
            type="button"
            className="w-full rounded-xl bg-lime-500 text-zinc-950 text-xs font-bold py-3"
          >
            Completar serie
          </button>
        </div>
      </div>
    </div>
  );
}

/** Desktop-ish mock — coach client dashboard */
function CoachDashboardMock() {
  return (
    <div className="relative rounded-2xl border border-zinc-700/70 bg-zinc-950 overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/5">
      <div className="flex">
        <div className="hidden sm:block w-14 shrink-0 border-r border-zinc-800 bg-zinc-950/90 py-4 px-2 space-y-3">
          <div className="h-2 w-8 mx-auto rounded bg-lime-500/40" />
          <div className="h-8 rounded-lg bg-lime-500/10 border border-lime-500/20" />
          <div className="h-8 rounded-lg bg-zinc-900" />
          <div className="h-8 rounded-lg bg-zinc-900" />
        </div>
        <div className="flex-1 p-4 sm:p-5 space-y-4 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">Panel de supervisión</p>
              <p className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                Camila R.
              </p>
              <p className="text-[11px] text-zinc-500">Hipertrofia · 5 días/sem · Semana 2/4</p>
            </div>
            <span className="rounded-full bg-red-500/10 text-red-300 text-[9px] font-semibold uppercase tracking-wide px-2.5 py-1 ring-1 ring-red-500/25">
              1 alerta crítica
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              ['7 días', '1'],
              ['Meta/sem', '5'],
              ['IMC', '21.5'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-2">
                <p className="text-[8px] uppercase text-zinc-600">{label}</p>
                <p className="text-sm font-bold text-white tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-3">
            <p className="text-[11px] font-semibold text-red-200">Llegó al fallo cuando el plan pedía dejar repeticiones</p>
            <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
              Usó más peso del necesario en ejercicios principales. El plan pedía terminar con algo de margen.
            </p>
            <div className="mt-2 rounded-lg border border-lime-500/15 bg-lime-500/5 px-2.5 py-2">
              <p className="text-[8px] uppercase tracking-wide text-lime-400/80 mb-0.5">Qué hace FitGen</p>
              <p className="text-[10px] text-lime-100/80 leading-relaxed">
                Ajusta la fuerza estimada y baja un poco las cargas de la próxima sesión, sin saltos bruscos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <p className="text-[8px] uppercase text-zinc-600 mb-2">Volumen</p>
              <div className="flex items-end gap-1 h-12">
                {[40, 55, 48, 70, 62, 80].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-lime-500/80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <p className="text-[8px] uppercase text-zinc-600 mb-2">Esfuerzo (margen)</p>
              <div className="flex items-end gap-1 h-12">
                {[70, 55, 30, 45, 20, 35].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-amber-400/80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArenaMock() {
  return (
    <div className="rounded-2xl border border-zinc-700/70 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 shadow-xl ring-1 ring-white/5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-violet-300/70">Arena FitGen</p>
          <p className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Temporada activa
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 ring-1 ring-amber-500/25">
          <Trophy className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-xs font-bold text-amber-200 tabular-nums">1.240</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-3">
        <div className="h-full w-[68%] bg-gradient-to-r from-lime-500 to-emerald-400 rounded-full" />
      </div>
      <p className="text-[11px] text-zinc-500 mb-4">Nivel 7 · 680 XP para el siguiente</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ['Racha', '12d'],
          ['Sesiones', '48'],
          ['Récords', '3'],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-zinc-950/70 border border-zinc-800 py-2.5">
            <p className="text-[9px] text-zinc-600">{l}</p>
            <p className="text-sm font-bold text-white tabular-nums">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const LandingPage = () => {
  useReveal();
  const [energyAnim, setEnergyAnim] = useState(30);

  useEffect(() => {
    const t = window.setInterval(() => {
      setEnergyAnim((v) => (v === 30 ? 78 : 30));
    }, 3200);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div
      className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-lime-500 selection:text-zinc-950 overflow-x-hidden"
      style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(163,230,22,0.12),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(39,39,42,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(39,39,42,0.35)_1px,transparent_1px)] bg-size-[48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <a href="#top" className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            Fit<span className="text-lime-400">Gen</span>
          </a>
          <div className="hidden md:flex items-center gap-7 text-sm text-zinc-400">
            <a href="#motor" className="hover:text-white transition">Motor</a>
            <a href="#arena" className="hover:text-white transition">Arena</a>
            <a href="#avatares" className="hover:text-white transition">Progreso</a>
            <a href="#coaches" className="hover:text-white transition">Coaches</a>
            <a href="#caminos" className="hover:text-white transition">Cómo empezar</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-zinc-300 hover:text-lime-400 transition">
              Entrar
            </Link>
            <Link
              to="/register"
              className="hidden sm:inline-flex text-sm font-bold px-3.5 py-2 rounded-lg bg-lime-500 text-zinc-950 hover:bg-lime-400 transition"
            >
              Empezar
            </Link>
          </div>
        </div>
      </nav>

      <header id="top" className="relative px-5 pt-10 pb-16 md:pt-16 md:pb-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[0.95] mb-5"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Fit<span className="text-lime-400">Gen</span>
            </p>
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-100 leading-tight max-w-lg"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              El entrenamiento que se adapta a cómo llegas hoy al gym.
            </h1>
            <p className="mt-4 text-zinc-400 text-base md:text-lg max-w-md leading-relaxed">
              Un sistema que ajusta tu plan según tu fatiga, te guía serie a serie y premia el trabajo bien hecho — solo o con tu coach.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-zinc-950 font-extrabold text-base transition shadow-[0_0_40px_rgba(163,230,22,0.25)]"
              >
                Entrenar solo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register/coach"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-zinc-700 hover:border-lime-500/40 text-zinc-100 font-bold text-base transition bg-zinc-900/50"
              >
                Soy coach
              </Link>
            </div>
            <p className="mt-4 text-xs text-zinc-600 max-w-sm leading-relaxed">
              ¿Tu coach te mandó un enlace? Ábrelo directamente — no te registres aquí. Así quedas vinculado a su panel.
            </p>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <div className="animate-[landing-float_6s_ease-in-out_infinite]">
              <AthleteSessionMock />
            </div>
          </div>
        </div>
      </header>

      <section id="caminos" className="px-5 py-20 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 mb-12 max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.25em] text-lime-500/80 mb-3">Dos caminos, un sistema</p>
            <h2
              className="text-3xl md:text-4xl font-bold text-white leading-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Resultados solos. Aún más lejos con tu coach.
            </h2>
            <p className="mt-4 text-zinc-400 leading-relaxed">
              FitGen ya decide cuánto entrenar y con qué peso. Si un coach te invita, su criterio se suma: objetivo, días, lesiones y seguimiento — sin perder la app.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div
              data-reveal
              className="opacity-0 translate-y-6 transition-all duration-700 delay-100 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-7 md:p-8"
            >
              <div className="w-11 h-11 rounded-2xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center mb-5">
                <Zap className="w-5 h-5 text-lime-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                Atleta directo
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                Configuras tu perfil, generas tu plan y entrenas con guía clara. El sistema te acompaña día a día.
              </p>
              <ul className="space-y-2 text-sm text-zinc-300 mb-6">
                {[
                  'Plan que cambia si llegas cansado o dormiste mal',
                  'Pesos que recuerdan lo que ya levantaste',
                  'Arena, rachas y recompensas por entrenar de verdad',
                ].map((t) => (
                  <li key={t} className="flex gap-2 items-start">
                    <Check className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="text-sm font-bold text-lime-400 hover:text-lime-300 inline-flex items-center gap-1">
                Crear cuenta atleta <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div
              data-reveal
              className="opacity-0 translate-y-6 transition-all duration-700 delay-200 rounded-3xl border border-lime-500/25 bg-gradient-to-br from-lime-500/10 via-zinc-900/60 to-zinc-950 p-7 md:p-8"
            >
              <div className="w-11 h-11 rounded-2xl bg-lime-500/15 border border-lime-500/30 flex items-center justify-center mb-5">
                <Users className="w-5 h-5 text-lime-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                Invitado por un coach
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed mb-5">
                Mismo sistema, pero tu coach define el camino. Ve tu sesión, tus pesos y las alertas — y te orienta cuando hace falta.
              </p>
              <ul className="space-y-2 text-sm text-zinc-200 mb-6">
                {[
                  'Entras solo con el enlace que te envió tu coach',
                  'No te registres en “Empezar”: perderías el vínculo',
                  'El criterio del coach + FitGen = mejor servicio',
                ].map((t) => (
                  <li key={t} className="flex gap-2 items-start">
                    <Shield className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Si eres coach, genera invitaciones desde tu panel. Tus clientes no deberían pasar por el registro libre.
              </p>
              <Link
                to="/register/coach"
                className="mt-4 inline-flex text-sm font-bold text-lime-300 hover:text-lime-200 items-center gap-1"
              >
                Registrar cuenta coach <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="motor" className="px-5 py-20 bg-zinc-900/40 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700">
            <p className="text-[10px] uppercase tracking-[0.25em] text-lime-500/80 mb-3">El motor</p>
            <h2
              className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              No es una lista fija. Es un plan que piensa contigo.
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Basado en cómo recuperas, cuánto duermes, si te duele algo y qué peso usaste la vez anterior. Si un día llegas agotado, FitGen suaviza la sesión. Si te pasas de intensidad, la próxima vez ajusta sola. Todo anclado a evidencia científica y fisiología del ejercicio de alta calidad: progresar de forma sostenida, con menos riesgo de lesión.
            </p>
            <div className="space-y-4">
              {[
                {
                  icon: BatteryLow,
                  title: 'Cómo llegas hoy',
                  body: 'Si tienes poca energía o dormiste mal, reduce el trabajo del día y te deja más margen. Nunca te exige más cuando llegas fatigado.',
                },
                {
                  icon: Gauge,
                  title: 'Pesos que aprenden de ti',
                  body: 'Recuerda lo que levantaste en cada ejercicio y propone la siguiente carga con sentido — distinta si es barra o mancuerna.',
                },
                {
                  icon: Brain,
                  title: 'Ajuste de semana en semana',
                  body: 'Si reportas buen estímulo o molestias, la siguiente semana sube o baja el volumen para que sigas progresando sin quemarte.',
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-lime-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{title}</p>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            data-reveal
            className="opacity-0 translate-y-6 transition-all duration-700 delay-150 rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8"
          >
            <div className="flex justify-between text-sm text-zinc-400 mb-2">
              <span>Tu energía hoy</span>
              <span className={energyAnim < 50 ? 'text-orange-400' : 'text-lime-400'}>
                {energyAnim < 50 ? 'Baja' : 'Alta'}
              </span>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-2.5 mb-6 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-[1600ms] ease-out ${
                  energyAnim < 50 ? 'bg-orange-400' : 'bg-lime-400'
                }`}
                style={{ width: `${energyAnim}%` }}
              />
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm leading-relaxed space-y-3">
              <p className="text-[10px] uppercase tracking-wide text-lime-400/90">Decisión del sistema</p>
              {energyAnim < 50 ? (
                <>
                  <p className="text-zinc-200">Bajamos la cantidad de series de hoy.</p>
                  <p className="text-zinc-400 text-xs">
                    Te pedimos dejar más repeticiones en reserva para proteger la recuperación.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-zinc-200">Mantenemos el plan del día.</p>
                  <p className="text-zinc-400 text-xs">
                    Vas recuperado: seguimos con la progresión prevista.
                  </p>
                </>
              )}
            </div>
            <p className="text-[11px] text-zinc-600 mt-4 leading-relaxed">
              Tu coach ve la misma lógica en su panel: qué pasó y qué hará FitGen después.
            </p>
          </div>
        </div>
      </section>

      <section id="arena" className="px-5 py-20">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 text-center max-w-2xl mx-auto mb-14">
            <p className="text-[10px] uppercase tracking-[0.25em] text-lime-500/80 mb-3">Experiencia · Arena</p>
            <h2
              className="text-3xl md:text-4xl font-bold text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Una experiencia completa. Premia el trabajo real.
            </h2>
            <p className="mt-4 text-zinc-400 leading-relaxed">
              Guía clara en cada serie, cambios de ejercicio si falta equipo, y recompensas solo cuando completaste el estímulo — no por tocar “terminar”.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 flex justify-center">
              <AthleteSessionMock />
            </div>
            <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 delay-100 space-y-5">
              <ArenaMock />
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: Trophy, t: 'Temporadas y ranking', d: 'Compite por volumen y marcas personales.' },
                  { icon: Sparkles, t: 'Recompensas honestas', d: 'Si no completas el trabajo, no hay monedas.' },
                  { icon: Activity, t: 'Avatar que evoluciona', d: 'Tu personaje refleja el progreso real.' },
                  { icon: Smartphone, t: 'App en tu pantalla', d: 'Instálala y úsala sin distracciones.' },
                ].map(({ icon: Icon, t, d }) => (
                  <div key={t} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <Icon className="w-4 h-4 text-lime-400 mb-2" />
                    <p className="text-sm font-semibold text-white">{t}</p>
                    <p className="text-xs text-zinc-500 mt-1">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Avatars */}
      <section id="avatares" className="px-5 py-20 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 text-center max-w-2xl mx-auto mb-12">
            <p className="text-[10px] uppercase tracking-[0.25em] text-lime-500/80 mb-3">Tu progreso visual</p>
            <h2
              className="text-3xl md:text-4xl font-bold text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Un avatar que crece contigo
            </h2>
            <p className="mt-4 text-zinc-400 leading-relaxed">
              Eliges tu punto de partida. Con cada bloque de entrenamiento, la figura avanza. Así se ven las etapas más avanzadas:
            </p>
          </div>

          <div
            data-reveal
            className="opacity-0 translate-y-6 transition-all duration-700 delay-100 grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto"
          >
            {[
              { src: AVATAR_MALE, label: 'Masculino · etapa avanzada' },
              { src: AVATAR_FEMALE, label: 'Femenino · etapa avanzada' },
            ].map(({ src, label }) => (
              <div
                key={label}
                className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 overflow-hidden"
              >
                <div className="aspect-[3/4] relative bg-black/40 flex items-end justify-center">
                  <img
                    src={src}
                    alt={label}
                    className="w-full h-full object-contain object-bottom"
                  />
                </div>
                <p className="text-center text-xs text-zinc-500 py-3 px-4">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="coaches" className="px-5 py-20 bg-zinc-900/40 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 order-2 lg:order-1">
              <CoachDashboardMock />
            </div>
            <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 delay-100 order-1 lg:order-2">
              <p className="text-[10px] uppercase tracking-[0.25em] text-lime-500/80 mb-3">Para coaches</p>
              <h2
                className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                Ves lo importante antes de que el cliente te escriba.
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Sesión en vivo, pesos planeados vs usados, gráficas de progreso, check-ins de peso y alertas con la explicación de qué hará FitGen automáticamente.
              </p>
              <ul className="space-y-3 text-sm text-zinc-300 mb-8">
                {[
                  'Invitas con un enlace único — el cliente no se registra por su cuenta',
                  'Ajustas objetivo, días y lesiones; el plan se adapta solo',
                  'Empiezas con 3 clientes gratis de por vida',
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register/coach"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-zinc-950 font-extrabold transition"
              >
                Abrir cuenta coach
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div
          data-reveal
          className="opacity-0 translate-y-6 transition-all duration-700 max-w-3xl mx-auto text-center rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-10"
        >
          <Smartphone className="w-10 h-10 text-lime-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
            Instálala. Entrena sin ruido.
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            En iOS y Android, desde el navegador. Timers que siguen en segundo plano y sincronización aunque pierdas señal un momento.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            <span className="px-3 py-1.5 rounded-full border border-zinc-800">iOS</span>
            <span className="px-3 py-1.5 rounded-full border border-zinc-800">Android</span>
            <span className="px-3 py-1.5 rounded-full border border-zinc-800">Sin tienda</span>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-5 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
          <p style={{ fontFamily: 'Syne, sans-serif' }} className="text-zinc-400 font-semibold">
            Fit<span className="text-lime-500">Gen</span>
          </p>
          <p className="text-center text-xs max-w-md leading-relaxed">
            Invitado por coach → usa solo tu enlace <span className="text-zinc-400">/join/…</span>. El registro libre es para atletas independientes y coaches.
          </p>
          <p className="text-xs">© 2026 FitGen</p>
        </div>
      </footer>

      <style>{`
        @keyframes landing-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
