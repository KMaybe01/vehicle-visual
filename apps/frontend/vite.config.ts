import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    babel({
      presets: [reactCompilerPreset()],
    }),
    react(),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3100',
        ws: true,
      },
      '/api': {
        target: 'http://localhost:3100',
      },
    },
  },
  build: {
    outDir: 'dist',
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
          if (id.includes('/node_modules/three/') || id.includes('/node_modules/@react-three/')) {
            return 'vendor-three';
          }
          if (id.includes('/node_modules/echarts')) {
            return 'vendor-echarts';
          }
        },
      },
    },
  },
});
