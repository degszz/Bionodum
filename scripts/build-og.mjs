// Build the Open Graph preview image (1200x630) using sharp.
// Renders brand teal background + Bionodum logo + 3 service logos (análisis,
// premezclas, aditivos) with labels. Run with: node scripts/build-og.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicImg = path.join(root, 'public', 'images');

const W = 1200;
const H = 630;
const BRAND = '#26AC87';

// --- Icon size + positions ---
const CARD = 220;
const ICON = 180;
const CARD_Y = 320;
const CARD_XS = [110, 490, 870];
const LABEL_Y = 580;
const LABELS = ['Análisis', 'Premezclas', 'Aditivos'];
const LOGO_TARGET_H = 150;
const LOGO_Y = 70;

// Helper: render an AVIF/PNG, preserving alpha, fit-contain into a target box.
async function fitContain(input, boxW, boxH) {
  return sharp(input)
    .resize(boxW, boxH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

// Get logo scaled so its height = LOGO_TARGET_H while preserving aspect.
async function fitHeight(input, h) {
  const meta = await sharp(input).metadata();
  const w = Math.round((meta.width / meta.height) * h);
  return {
    buffer: await sharp(input)
      .resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer(),
    width: w,
    height: h,
  };
}

// SVG text overlay
function svgText({ text, x, y, fontSize = 32, weight = 700, anchor = 'middle', color = '#ffffff' }) {
  return Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .t { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-weight: ${weight}; fill: ${color}; }
      </style>
      <text class="t" x="${x}" y="${y}" font-size="${fontSize}" text-anchor="${anchor}">${text}</text>
    </svg>
  `);
}

// White rounded cards for service icons
function cardsSvg() {
  const r = 24;
  const rects = CARD_XS.map(
    (x) => `<rect x="${x}" y="${CARD_Y}" width="${CARD}" height="${CARD}" rx="${r}" ry="${r}" fill="#ffffff" />`
  ).join('');
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`);
}

// Subtle inner panel like a frame around content
function framePanelSvg() {
  return Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="60" width="1080" height="510" rx="30" ry="30"
            fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" />
    </svg>
  `);
}

async function main() {
  // Start with brand-colored base
  const base = sharp({
    create: { width: W, height: H, channels: 3, background: BRAND },
  });

  // Logo
  const logo = await fitHeight(path.join(publicImg, 'logo.avif'), LOGO_TARGET_H);
  const logoX = Math.round((W - logo.width) / 2);

  // Service icons
  const icons = await Promise.all([
    fitContain(path.join(publicImg, 'services', 'analisis.avif'), ICON, ICON),
    fitContain(path.join(publicImg, 'services', 'premezclas.avif'), ICON, ICON),
    fitContain(path.join(publicImg, 'services', 'aditivos.avif'), ICON, ICON),
  ]);

  const composites = [
    // faint panel
    { input: framePanelSvg(), top: 0, left: 0 },
    // logo
    { input: logo.buffer, top: LOGO_Y, left: logoX },
    // tagline
    {
      input: svgText({
        text: 'Nutrición Animal',
        x: W / 2,
        y: LOGO_Y + LOGO_TARGET_H + 60,
        fontSize: 40,
        weight: 700,
      }),
      top: 0,
      left: 0,
    },
    // white cards
    { input: cardsSvg(), top: 0, left: 0 },
    // icons centered inside each card
    ...icons.map((buf, i) => ({
      input: buf,
      top: CARD_Y + Math.round((CARD - ICON) / 2),
      left: CARD_XS[i] + Math.round((CARD - ICON) / 2),
    })),
    // labels
    ...LABELS.map((text, i) => ({
      input: svgText({
        text,
        x: CARD_XS[i] + CARD / 2,
        y: LABEL_Y,
        fontSize: 32,
        weight: 700,
      }),
      top: 0,
      left: 0,
    })),
  ];

  const outPath = path.join(publicImg, 'og-image.jpg');
  await base.composite(composites).jpeg({ quality: 88, mozjpeg: true }).toFile(outPath);

  console.log(`✓ OG image written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
