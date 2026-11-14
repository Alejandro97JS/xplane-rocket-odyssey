import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const SERVER = 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': SERVER,
      '/health': SERVER,
    },
  },
  build: {
    outDir: 'dist',
    // PixiJS is large and only the launch screen needs it.
    chunkSizeWarningLimit: 700,
  },
});
