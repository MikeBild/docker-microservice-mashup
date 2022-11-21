import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import env from 'vite-plugin-environment';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), env('all', { prefix: 'VITE_' })],
});
