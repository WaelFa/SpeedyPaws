/**
 * SpeedyPaws Multi-Build Script
 * Builds each entry point separately to ensure self-contained bundles
 */

import { build } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const entries = [
  { name: 'content', path: 'src/content/content.ts' },
  { name: 'background', path: 'src/background/background.ts' },
  { name: 'popup', path: 'src/popup/popup.ts' },
];

async function buildAll() {
  console.log('🐾 Building SpeedyPaws extension...\n');

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isFirst = i === 0;
    
    console.log(`📦 Building ${entry.name}...`);
    
    await build({
      configFile: false,
      root: rootDir,
      build: {
        outDir: 'dist',
        emptyOutDir: isFirst, // Only empty on first build
        lib: {
          entry: resolve(rootDir, entry.path),
          name: entry.name,
          fileName: () => `${entry.name}.js`,
          formats: ['iife'],
        },
        rollupOptions: {
          output: {
            // Extend the IIFE to make it execute immediately
            extend: true,
          },
        },
        minify: false,
        sourcemap: false,
        target: 'chrome88',
      },
      resolve: {
        alias: {
          '@': resolve(rootDir, 'src'),
        },
      },
      publicDir: false,
      logLevel: 'warn',
    });
    
    console.log(`   ✓ ${entry.name}.js built\n`);
  }

  console.log('✅ All bundles built!\n');
}

buildAll().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});

