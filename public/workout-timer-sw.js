/* FitGen workout timer alarms — imported by the generated service worker. */
const timers = {
  rest: null,
  exercise: null,
};

function clearKind(kind) {
  const id = timers[kind];
  if (id != null) {
    clearTimeout(id);
    timers[kind] = null;
  }
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'CANCEL_REST_ALARM') {
    clearKind(data.kind === 'exercise' ? 'exercise' : 'rest');
    return;
  }

  if (data.type !== 'SCHEDULE_REST_ALARM') return;

  const kind = data.kind === 'exercise' ? 'exercise' : 'rest';
  clearKind(kind);

  const endsAt = Number(data.endsAt);
  if (!Number.isFinite(endsAt)) return;

  const delay = Math.max(0, endsAt - Date.now());
  const title =
    data.title ||
    (kind === 'rest' ? '¡Descanso terminado!' : '¡Tiempo terminado!');
  const body =
    data.body ||
    (kind === 'rest'
      ? 'Vuelve a FitGen para continuar tu serie.'
      : 'Vuelve a FitGen para continuar el ejercicio.');
  const tag = data.tag || (kind === 'rest' ? 'fitgen-rest-timer' : 'fitgen-exercise-timer');
  const url = data.url || '/workout/player';

  timers[kind] = setTimeout(() => {
    timers[kind] = null;
    self.registration
      .showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag,
        renotify: true,
        requireInteraction: true,
        silent: false,
        vibrate: [220, 100, 220, 100, 220],
        data: { url, kind },
      })
      .catch(() => {
        // Notification may fail if permission was revoked.
      });
  }, delay);
});

self.addEventListener('notificationclick', (event) => {
  const url = (event.notification && event.notification.data && event.notification.data.url) || '/workout/player';
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            try {
              client.navigate(url);
            } catch (_) {
              // ignore navigate failures
            }
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
      return undefined;
    }),
  );
});
