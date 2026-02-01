#!/usr/bin/env node
/**
 * Generate PWA PNG icons from icon.svg.
 * Run from project root: node scripts/generate-pwa-icons.mjs
 * Or from frontend: npm run generate-icons
 * Requires: npm install sharp --save-dev (in frontend)
 *
 * Outputs to frontend/public/icons/ for manifest (48–512px) and shortcut icons (96px).
 * Also keeps icon-192.png and icon-512.png in public/ for backward compatibility.
 */

import { readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const frontendDir = join(rootDir, 'frontend');
const publicDir = join(frontendDir, 'public');
const iconsDir = join(publicDir, 'icons');
const svgPath = join(publicDir, 'icon.svg');

const require = createRequire(join(frontendDir, 'package.json'));

const MAIN_SIZES = [48, 72, 96, 128, 144, 152, 192, 384, 512];
const SHORTCUT_SIZE = 96;

async function generateIcons() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('sharp is required. Run: cd frontend && npm install sharp --save-dev');
    process.exit(1);
  }

  if (!existsSync(svgPath)) {
    console.error(`Missing ${svgPath}`);
    process.exit(1);
  }

  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
  }

  const svg = readFileSync(svgPath);

  for (const size of MAIN_SIZES) {
    const outputPath = join(iconsDir, `icon-${size}.png`);
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${outputPath}`);
  }

  for (const name of ['shortcut-dashboard', 'shortcut-settings']) {
    const outputPath = join(iconsDir, `${name}.png`);
    await sharp(svg)
      .resize(SHORTCUT_SIZE, SHORTCUT_SIZE)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${outputPath}`);
  }

  await sharp(svg)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'icon-192.png'));
  await sharp(svg)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'icon-512.png'));
  console.log('Generated public/icon-192.png and public/icon-512.png (backward compatibility)');

  console.log('Done.');
}

generateIcons().catch((err) => {
  console.error(err);
  process.exit(1);
});
