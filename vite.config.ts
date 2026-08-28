import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const releaseVersion = process.env.RELEASE_VERSION || JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;

export default defineConfig({
  build: {
    target: 'es2022',
    sourcemap: true,
    manifest: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      },
      input: {
        main: 'index.html',
        privacy: 'privacy/index.html',
        terms: 'terms/index.html'
      }
    }
  },
  define: { __RELEASE_VERSION__: JSON.stringify(releaseVersion) }
});
