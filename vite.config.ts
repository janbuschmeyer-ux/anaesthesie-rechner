import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const packageVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH || '/';
  const buildId = env.VITE_BUILD_ID || packageVersion.version;

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(buildId),
      __APP_BASE__: JSON.stringify(base)
    },
    plugins: [
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        injectRegister: false,
        registerType: 'prompt',
        manifest: false,
        injectManifest: {
          globPatterns: ['**/*.{html,js,css,svg,png,webmanifest}'],
          maximumFileSizeToCacheInBytes: 2_000_000
        },
        devOptions: { enabled: false }
      })
    ],
    build: {
      target: 'es2022',
      sourcemap: false
    }
  };
});
