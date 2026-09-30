// Android (maskable) and iOS (apple-touch) icons are cropped/rounded by the OS, so they
// need the gradient to reach the edges instead of the rounded square in favicon.svg.
// Runs after pwa-assets-generator (see "generate-pwa-assets" in package.json).
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');

function fullBleed(scale) {
  // Drop the first <rect> (the rounded background); keep everything after it as artwork.
  const bg = /<rect[^>]*\/>/.exec(svg);
  const head = svg.slice(0, bg.index);
  const body = svg.slice(bg.index + bg[0].length).replace('</svg>', '');
  return (
    `${head}<rect width="48" height="48" fill="url(#gv-bg)"/>` +
    `<g transform="translate(24 24) scale(${scale}) translate(-24 -24)">${body}</g></svg>`
  );
}

// Maskable: keep the artwork inside the 80% "safe zone" circle.
await sharp(Buffer.from(fullBleed(0.78))).resize(512, 512).png().toFile('public/maskable-icon-512x512.png');
await sharp(Buffer.from(fullBleed(0.95))).resize(180, 180).png().toFile('public/apple-touch-icon-180x180.png');
console.log('Full-bleed maskable and Apple icons generated');
