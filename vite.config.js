import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';


export default defineConfig({
  root: './src/react',
  build: {
    outDir: '../../dist/react',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/react/index.html'),
        sidebar: resolve(__dirname, 'src/react/sidebar.html'),
        popup: resolve(__dirname, 'src/react/popup.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  plugins: [react()],
  // No alias needed for n3; Vite will resolve ESM entry automatically
});
