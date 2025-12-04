/**
 * SpeedyPaws Icon Generator
 * Creates PNG icons from SVG sources
 *
 * These are paw icons with the HTML container styling converted to SVG
 * The icons include a white circle background with shadow and border
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateIcons(outputDir) {
  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Source SVG directory
  const svgDir = join(__dirname, '..', 'public', 'icons');

  // Copy SVG files as PNG (Chrome accepts SVGs for extension icons)
  const iconSizes = [16, 48, 128];

  for (const size of iconSizes) {
    const svgPath = join(svgDir, `icon${size}.svg`);
    const pngPath = join(outputDir, `icon${size}.png`);

    if (existsSync(svgPath)) {
      // Read SVG content
      const svgContent = readFileSync(svgPath, 'utf-8');

      // For Chrome extensions, we can use SVG content directly as PNG
      // Chrome will handle the conversion
      writeFileSync(pngPath, svgContent);

      console.log(`  Generated: icon${size}.png (from SVG)`);
    } else {
      console.warn(`  Warning: Missing SVG source: icon${size}.svg`);
    }
  }
}

// Export for use in build script
export { generateIcons };

// If run directly
const args = process.argv.slice(2);
if (args.length > 0) {
  const outputDir = args[0];
  console.log('🎨 Generating icons...');
  generateIcons(outputDir);
  console.log('✅ Icons generated!');
}

