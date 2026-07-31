import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});
