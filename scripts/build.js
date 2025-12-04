/**
 * SpeedyPaws Build Script
 * Handles post-build tasks: copy static files, generate icons
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateIcons } from './generate-icons.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');
const distDir = join(rootDir, 'dist');

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Copy file safely
 */
function copyFile(src, dest) {
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
  console.log(`  ✓ ${src.replace(rootDir, '.')} → ${dest.replace(rootDir, '.')}`);
}

/**
 * Main build function
 */
function build() {
  console.log('\n🐾 SpeedyPaws Post-Build\n');
  console.log('━'.repeat(40));
  
  // Ensure dist directory exists
  ensureDir(distDir);
  
  // Copy static files from public
  console.log('\n📁 Copying static files...\n');
  
  const staticFiles = [
    'manifest.json',
    'popup.html',
    'popup.css',
    'content.css'
  ];
  
  for (const file of staticFiles) {
    const src = join(publicDir, file);
    const dest = join(distDir, file);
    if (existsSync(src)) {
      copyFile(src, dest);
    } else {
      console.warn(`  ⚠ Missing: ${file}`);
    }
  }
  
  // Generate icons
  console.log('\n🎨 Generating icons...\n');
  const iconsDir = join(distDir, 'icons');
  generateIcons(iconsDir);
  
  console.log('\n━'.repeat(40));
  console.log('\n✅ Build complete!\n');
  console.log('📦 Extension ready in: ./dist\n');
  console.log('┌' + '─'.repeat(38) + '┐');
  console.log('│  To load in Chrome:                 │');
  console.log('│                                     │');
  console.log('│  1. Go to chrome://extensions       │');
  console.log('│  2. Enable "Developer mode"         │');
  console.log('│  3. Click "Load unpacked"           │');
  console.log('│  4. Select the ./dist folder        │');
  console.log('└' + '─'.repeat(38) + '┘\n');
}

// Run build
build();
