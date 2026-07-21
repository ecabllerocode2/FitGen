const SW_SCHEDULE = 'SCHEDULE_REST_ALARM';
const SW_CANCEL = 'CANCEL_REST_ALARM';

export type TimerAlarmKind = 'rest' | 'exercise';

function alarmTag(kind: TimerAlarmKind) {
  return kind === 'rest' ? 'fitgen-rest-timer' : 'fitgen-exercise-timer';
}

export async function ensureNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export async function scheduleTimerAlarm(options: {
  kind: TimerAlarmKind;
  endsAt: number;
  title?: string;
  body?: string;
}) {
  const registration = await getServiceWorkerRegistration();
  const payload = {
    type: SW_SCHEDULE,
    kind: options.kind,
    endsAt: options.endsAt,
    title: options.title,
    body: options.body,
    tag: alarmTag(options.kind),
    url: '/workout/player',
  };

  if (registration?.active) {
    registration.active.postMessage(payload);
    return;
  }

  // Fallback if SW is not ready yet: page-level timeout (less reliable in background).
  const delay = Math.max(0, options.endsAt - Date.now());
  window.setTimeout(() => {
    void showTimerNotification({
      kind: options.kind,
      title: options.title,
      body: options.body,
    });
  }, delay);
}

export async function cancelTimerAlarm(kind: TimerAlarmKind = 'rest') {
  const registration = await getServiceWorkerRegistration();
  if (registration?.active) {
    registration.active.postMessage({ type: SW_CANCEL, kind, tag: alarmTag(kind) });
  }
}

export async function showTimerNotification(options: {
  kind: TimerAlarmKind;
  title?: string;
  body?: string;
}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const title =
    options.title ??
    (options.kind === 'rest' ? '¡Descanso terminado!' : '¡Tiempo terminado!');
  const body =
    options.body ??
    (options.kind === 'rest'
      ? 'Vuelve a FitGen para continuar tu serie.'
      : 'Vuelve a FitGen para continuar el ejercicio.');

  const registration = await getServiceWorkerRegistration();
  const notificationOptions = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: alarmTag(options.kind),
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: { url: '/workout/player', kind: options.kind },
    vibrate: [220, 100, 220, 100, 220],
  } as NotificationOptions;

  try {
    if (registration?.showNotification) {
      await registration.showNotification(title, notificationOptions);
      return;
    }
  } catch {
    // Fall through to page Notification.
  }

  try {
    new Notification(title, notificationOptions);
  } catch {
    // Ignore — some browsers block page notifications without SW.
  }
}

export function vibrateAlarmPattern() {
  try {
    navigator.vibrate?.([220, 100, 220, 100, 220, 100, 400]);
  } catch {
    // Ignore.
  }
}

export function remainingSecondsFromEndsAt(endsAt: number | null | undefined, now = Date.now()): number {
  if (!endsAt) return 0;
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}
