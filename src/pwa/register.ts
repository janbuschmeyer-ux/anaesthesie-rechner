import { registerSW } from 'virtual:pwa-register';

function notice(message: string, actions: readonly { label: string; action: () => void }[]): void {
  const region = document.querySelector<HTMLElement>('#pwa-status');
  if (!region) return;
  const wrapper = document.createElement('section');
  wrapper.className = 'pwa-notice';
  const text = document.createElement('p');
  text.textContent = message;
  wrapper.append(text);
  const actionRow = document.createElement('div');
  for (const item of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = item.label;
    button.addEventListener('click', item.action);
    actionRow.append(button);
  }
  wrapper.append(actionRow);
  region.replaceChildren(wrapper);
}

function dismissNotice(): void {
  document.querySelector<HTMLElement>('#pwa-status')?.replaceChildren();
}

export function registerPwa(): void {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      notice('Eine neue App-Version ist verfügbar. Beim Neuladen werden aktuelle Eingaben verworfen.', [
        { label: 'Jetzt neu laden', action: () => void updateSW(true) },
        { label: 'Später', action: dismissNotice }
      ]);
    },
    onOfflineReady() {
      notice('Die App ist jetzt vollständig offline verfügbar.', [{ label: 'OK', action: dismissNotice }]);
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      let lastCheck = 0;
      const checkForUpdate = (): void => {
        const now = Date.now();
        if (!navigator.onLine || now - lastCheck < 60 * 60 * 1000) return;
        lastCheck = now;
        void registration.update();
      };
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
    }
  });
}
