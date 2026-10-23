import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }, // debe coincidir con CLIENT_URL del backend (CORS)
});
