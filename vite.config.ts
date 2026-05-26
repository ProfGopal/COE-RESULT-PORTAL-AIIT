import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/COE-RESULT-PORTAL-AIIT/',
  plugins: [react()],
  build: {
    outDir: 'docs',
  },
  server: {
    port: 4173,
  },
});
