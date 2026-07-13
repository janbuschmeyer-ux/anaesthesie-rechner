/// <reference lib="webworker" />

import { cacheNames, setCacheNameDetails } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope & {
  readonly __WB_MANIFEST: Array<{ url: string; revision?: string }>;
};

const cachePrefix = 'anaesthesie-rechner';

setCacheNameDetails({
  prefix: cachePrefix,
  suffix: __APP_VERSION__,
  precache: 'app-shell',
  runtime: 'runtime'
});

precacheAndRoute(self.__WB_MANIFEST, { cleanURLs: false });
cleanupOutdatedCaches();

const appShellUrl = `${__APP_BASE__}index.html`.replace(/\/+/g, '/');
registerRoute(
  new NavigationRoute(createHandlerBoundToURL(appShellUrl), {
    allowlist: [new RegExp(`^${__APP_BASE__.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)]
  })
);

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const current = new Set([cacheNames.precache, cacheNames.runtime]);
  event.waitUntil(
    caches.keys().then(async (names) => {
      await Promise.all(
        names
          .filter((name) => name.startsWith(`${cachePrefix}-`) && !current.has(name))
          .map((name) => caches.delete(name))
      );
    })
  );
});
