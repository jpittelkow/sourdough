# Icon Files

This directory should contain the following icon files for full PWA and favicon support:

- `favicon.ico` - Multi-size ICO file (16x16, 32x32) - can be generated from favicon.svg
- `icon-192.png` - 192x192 PNG for PWA
- `icon-512.png` - 512x512 PNG for PWA  
- `apple-icon.png` - 180x180 PNG for iOS home screen

Currently, SVG versions (`favicon.svg`, `icon.svg`) are provided as fallbacks for modern browsers.

To generate the PNG/ICO files:
1. Use an online tool like https://realfavicongenerator.net/
2. Or use ImageMagick: `convert favicon.svg -resize 192x192 icon-192.png`
3. For favicon.ico, use a tool that creates multi-size ICO files

The manifest.json references these files, but the app will work with just the SVG files for modern browsers.
