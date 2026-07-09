import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, 'apps/frontend/public/icons');
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

const icon = (size, maskable = false) => {
  const rx = maskable ? 0 : Math.round(size * 0.2);
  const cx = size / 2;
  const cy = size / 2;
  const pinTopY = cy * 0.38;
  const pinR = size * 0.28;
  const dotR = size * 0.12;
  const tailW = size * 0.16;
  const tailH = size * 0.18;
  const barW = size * 0.36;
  const barH = size * 0.055;
  const barY = cy * 1.52;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#1B5E20"/>
  <ellipse cx="${cx}" cy="${pinTopY + pinR}" rx="${pinR}" ry="${pinR}" fill="#4CAF50"/>
  <path d="M${cx - tailW} ${pinTopY + pinR * 1.6} L${cx} ${pinTopY + pinR * 2.65} L${cx + tailW} ${pinTopY + pinR * 1.6}" fill="#4CAF50"/>
  <circle cx="${cx}" cy="${pinTopY + pinR}" r="${dotR}" fill="white"/>
  <rect x="${cx - barW / 2}" y="${barY}" width="${barW}" height="${barH}" rx="${barH / 2}" fill="#81C784"/>
</svg>`;
};

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(s => writeFileSync(join(publicDir, `pwa-${s}x${s}.svg`), icon(s)));
writeFileSync(join(publicDir, 'maskable-512x512.svg'), icon(512, true));

console.log('Icons generated in apps/frontend/public/icons/');
