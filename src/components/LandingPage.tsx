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
          <div className="aspect-video rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Dumbbell className="w-10 h-10 text-zinc-600" />
          </div>
          <h4 className="text-base font-bold text-white leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            Press banca con barra
          </h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-lime-400 tabular-nums">8–10</span>
            <span className="text-xs text-zinc-500">reps · 60 kg · RIR 2</span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Cómo realizar: controla la bajada 2s, empuja explosivo. No rebotes en el pecho.
          </p>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-2">
            <p className="text-[9px] font-semibold text-amber-300 uppercase tracking-wide mb-1">Puntos clave</p>
            <p className="text-[10px] text-zinc-400">Escápulas retraídas · pies firmes</p>
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
                Stela
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
            <p className="text-[11px] font-semibold text-red-200">Fallo muscular cuando el plan pedía reservas</p>
            <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
              RIR 0 en compuestos con objetivo ≥ 1.5. Suele indicar carga demasiado alta.
            </p>
            <div className="mt-2 rounded-lg border border-lime-500/15 bg-lime-500/5 px-2.5 py-2">
              <p className="text-[8px] uppercase tracking-wide text-lime-400/80 mb-0.5">Qué hace FitGen</p>
              <p className="text-[10px] text-lime-100/80 leading-relaxed">
                Recalibra e1RM y aplica topes de progresión (~+5%/sem). La siguiente sesión sale más conservadora.
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
              <p className="text-[8px] uppercase text-zinc-600 mb-2">RIR medio</p>
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
          ['PRs', '3'],
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
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(163,230,22,0.12),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(39,39,42,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(39,39,42,0.35)_1px,transparent_1px)] bg-size-[48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <a href="#top" className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            Fit<span className="text-lime-400">Gen</span>
          </a>
          <div className="hidden md:flex items-center gap-7 text-sm text-zinc-400">
            <a href="#motor" className="hover:text-white transition">Motor</a>
            <a href="#arena" className="hover:text-white transition">Arena</a>
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

      {/* Hero — one composition */}
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
              El motor que lee tu fatiga y reescribe tu plan.
            </h1>
            <p className="mt-4 text-zinc-400 text-base md:text-lg max-w-md leading-relaxed">
              Periodización viva, cargas honestas y una Arena que premia el estímulo real — solo o con tu coach.
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

      {/* Dual path — user's idea */}
      <section id="caminos" className="px-5 py-20 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div
            data-reveal
            className="opacity-0 translate-y-6 transition-all duration-700 mb-12 max-w-2xl"
          >
            <p className="text-[10px] uppercase tracking-[0.25em] text-lime-500/80 mb-3">Dos caminos, un motor</p>
            <h2
              className="text-3xl md:text-4xl font-bold text-white leading-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Resultados solos. Potencia máxima con tu coach.
            </h2>
            <p className="mt-4 text-zinc-400 leading-relaxed">
              FitGen ya decide volumen, RIR y progresión por ti. Si un coach te invita, su criterio se monta encima del motor: contexto fisiológico, exclusiones y supervisión en vivo — sin que pierdas la app.
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
                Onboarding completo, mesociclos, readiness diario, swap de ejercicios, Arena y check-ins de composición. El sistema te coachea con ciencia.
              </p>
              <ul className="space-y-2 text-sm text-zinc-300 mb-6">
                {[
                  'Periodización y deload automáticos',
                  'Cargas por e1RM + convención mancuerna/barra',
                  'Arena, rachas y recompensas por estímulo real',
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
                Mismo motor, pero tu coach define objetivo, días y seguridad. Ve tu sesión en vivo, pesos prescritos vs usados, alertas del motor y te escribe cuando hace falta.
              </p>
              <ul className="space-y-2 text-sm text-zinc-200 mb-6">
                {[
                  'Solo entras con el enlace /join de tu coach',
                  'No te registres en “Empezar”: perderías el vínculo',
                  'El conocimiento del coach + FitGen = mejor servicio',
                ].map((t) => (
                  <li key={t} className="flex gap-2 items-start">
                    <Shield className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Si eres coach, genera invitaciones desde tu panel. Tus clientes nunca deberían pasar por el registro libre.
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

      {/* Motor */}
      <section id="motor" className="px-5 py-20 bg-zinc-900/40 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700">
            <p className="text-[10px] uppercase tracking-[0.25em] text-lime-500/80 mb-3">El motor</p>
            <h2
              className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              No es una lista de ejercicios. Es una estrategia que se recalcula.
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Readiness, carga externa, RIR, e1RM, plateaus, dolor articular y deload semanal. Si fallas cuando el plan pedía reservas, FitGen no te premia el ego: recalibra.
            </p>
            <div className="space-y-4">
              {[
                {
                  icon: BatteryLow,
                  title: 'Readiness del día',
                  body: 'Energía baja o sueño pobre → menos volumen, RIR más alto. Nunca sube la demanda por fatiga.',
                },
                {
                  icon: Gauge,
                  title: 'Cargas con memoria',
                  body: 'Ledger de e1RM por ejercicio, convenciones mancuerna/unilateral y topes de progresión semanal.',
                },
                {
                  icon: Brain,
                  title: 'Autoregulación semanal',
                  body: 'Pump, dolor y fatiga residual mueven el volumen de la semana siguiente (±15–30%).',
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
              <span>Energía detectada</span>
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
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 font-mono text-xs leading-relaxed">
              <p className="text-lime-400 mb-3">// motor_de_decision</p>
              <p className="text-zinc-300">
                <span className="text-zinc-500">accion:</span>{' '}
                {energyAnim < 50 ? 'reducir_volumen(0.6)' : 'mantener_plan()'}
              </p>
              <p className="text-zinc-300 mt-1">
                <span className="text-zinc-500">rir_delta:</span> {energyAnim < 50 ? '+2' : '0'}
              </p>
              <p className="text-zinc-300 mt-1">
                <span className="text-zinc-500">objetivo:</span>{' '}
                {energyAnim < 50 ? '"proteger_recuperacion"' : '"progresion_controlada"'}
              </p>
            </div>
            <p className="text-[11px] text-zinc-600 mt-4 leading-relaxed">
              Lo mismo que ve tu coach en el panel: la señal, y qué hará FitGen a continuación.
            </p>
          </div>
        </div>
      </section>

      {/* UX + Arena */}
      <section id="arena" className="px-5 py-20">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 text-center max-w-2xl mx-auto mb-14">
            <p className="text-[10px] uppercase tracking-[0.25em] text-lime-500/80 mb-3">UX · Arena</p>
            <h2
              className="text-3xl md:text-4xl font-bold text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Se siente como una app premium. Premia el trabajo real.
            </h2>
            <p className="mt-4 text-zinc-400 leading-relaxed">
              Player con timers, swaps, descripciones y puntos clave. Al completar, FitCoins y logros solo si cumpliste el estímulo — no por tocar “terminar”.
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
                  { icon: Trophy, t: 'Temporadas y ranking', d: 'Compite por volumen y PRs de e1RM.' },
                  { icon: Sparkles, t: 'Recompensas honestas', d: 'Sin gate de volumen = sin FitCoins.' },
                  { icon: Activity, t: 'Historos de progreso', d: 'Avatar que evoluciona con tu cuerpo.' },
                  { icon: Smartphone, t: 'PWA instalable', d: 'En el home screen, offline-first.' },
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

      {/* Coaches */}
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
                Ves lo que el motor ve. Antes de que el cliente te escriba.
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Dashboard premium: sesión en vivo, historial prescrito vs usado, gráficas de volumen y RIR, check-ins de peso y alertas con la remediación automática de FitGen.
              </p>
              <ul className="space-y-3 text-sm text-zinc-300 mb-8">
                {[
                  'Invitas con enlace único — el cliente no pasa por la landing de registro libre',
                  'Editas contexto fisiológico y días; el mesociclo se adapta como en B2C',
                  '3 asientos free lifetime; premium cuando escalas tu roster',
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

      {/* Install */}
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
            PWA nativa en iOS y Android. Timers en segundo plano, sync offline y cero distracciones de tienda.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            <span className="px-3 py-1.5 rounded-full border border-zinc-800">iOS</span>
            <span className="px-3 py-1.5 rounded-full border border-zinc-800">Android</span>
            <span className="px-3 py-1.5 rounded-full border border-zinc-800">Offline-first</span>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-5 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
          <p style={{ fontFamily: 'Syne, sans-serif' }} className="text-zinc-400 font-semibold">
            Fit<span className="text-lime-500">Gen</span>
          </p>
          <p className="text-center text-xs max-w-md leading-relaxed">
            Invitado por coach → usa solo tu enlace <span className="text-zinc-400">/join/…</span>. Registro libre es para atletas independientes y coaches.
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
