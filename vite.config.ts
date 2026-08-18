import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { telemetryPlugin } from './server/vitePluginTelemetry';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    telemetryPlugin(),
  ],
  server: {
    port: 3000,
    open: true
  }
});

