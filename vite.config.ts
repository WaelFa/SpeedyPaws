import { defineConfig, build } from 'vite';
import { resolve } from 'path';

// Configure for Chrome extension - each entry point as separate IIFE bundle
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/content.ts'),
        background: resolve(__dirname, 'src/background/background.ts'),
        popup: resolve(__dirname, 'src/popup/popup.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name].[ext]',
        format: 'es',
        // Key: prevent chunking by inlining everything
        manualChunks: () => undefined,
      },
      // Treeshake to remove unused exports
      treeshake: {
        moduleSideEffects: true,
      },
    },
    // Don't minify for debugging
    minify: false,
    sourcemap: false,
    target: 'chrome88',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  publicDir: 'public',
});
