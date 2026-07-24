import type { User } from 'firebase/auth';
import { Clock } from 'lucide-react';
import { AppShell } from '../ui/AppPrimitives';

interface CoachWaitingScreenProps {
  user: User;
  coachName?: string;
}

export default function CoachWaitingScreen({ coachName }: CoachWaitingScreenProps) {
  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center max-w-sm mx-auto">
        <Clock className="w-12 h-12 text-lime-500/80 mb-4" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-lime-500/80 mb-2">FitGen</p>
        <h1 className="text-2xl font-bold mb-3">Tu coach está configurando tu plan</h1>
        <p className="text-sm text-zinc-400">
          {coachName ? `${coachName} está` : 'Tu coach está'} completando la configuración técnica de tu
          entrenamiento. Te avisaremos cuando puedas empezar.
        </p>
        <p className="text-xs text-zinc-600 mt-6">
          Mientras tanto, asegúrate de tener la app instalada y tus notificaciones activas.
        </p>
      </div>
    </AppShell>
  );
}
