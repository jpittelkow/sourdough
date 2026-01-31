#!/usr/bin/env node
/**
 * Generate PWA PNG icons from icon.svg.
 * Run from project root: node scripts/generate-pwa-icons.mjs
 * Or from frontend: npm run generate-icons
 * Requires: npm install sharp --save-dev (in frontend)
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const frontendDir = join(rootDir, 'frontend');
const publicDir = join(frontendDir, 'public');
const svgPath = join(publicDir, 'icon.svg');

const require = createRequire(join(frontendDir, 'package.json'));

async function generateIcons() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('sharp is required. Run: cd frontend && npm install sharp --save-dev');
    process.exit(1);
  }

  const svg = readFileSync(svgPath);
  const sizes = [192, 512];

  for (const size of sizes) {
    const outputPath = join(publicDir, `icon-${size}.png`);
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${outputPath}`);
  }

  console.log('Done.');
}

generateIcons().catch((err) => {
  console.error(err);
  process.exit(1);
});
