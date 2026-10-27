// Genera las imágenes promocionales de App Store y Google Play para PA (Fluxia)
// y MA (Fluxia Pro) a partir de las capturas de store-assets/capturas/<app>/ y
// de los textos de slides.json. Ver store-assets/README.md.
//
//   node store-assets/generador/generar.mjs            # las dos apps
//   node store-assets/generador/generar.mjs pa         # solo una
//
// Necesita Playwright (no es dependencia del repo):
//   npm i --no-save playwright-core   y   CHROMIUM=/ruta/a/chrome
//   o bien  npm i --no-save playwright && npx playwright install chromium

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, mkdtempSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const require = createRequire(join(process.cwd(), 'package.json'));
const pw = (() => {
  for (const m of [process.env.PLAYWRIGHT_MODULE, 'playwright-core', 'playwright'].filter(Boolean)) {
    try { return require(m); } catch { /* siguiente */ }
  }
  throw new Error('Falta Playwright: npm i --no-save playwright-core (y CHROMIUM=/ruta/a/chrome) o playwright');
})();

const config = JSON.parse(readFileSync(join(HERE, 'slides.json'), 'utf8'));
const fileUrl = (p) => pathToFileURL(p).href;
const FONT = fileUrl(join(HERE, 'fonts', 'Lexend.ttf'));
const LOGO = fileUrl(resolve(ROOT, '..', 'public', 'Logo-Icon.png'));

// Tamaños que piden las tiendas (px)
const FORMATS = {
  'apple-iphone-6.9': { w: 1320, h: 2868, device: 'phone' },  // obligatorio en App Store
  'apple-ipad-13': { w: 2064, h: 2752, device: 'tablet' },    // solo MA (admite iPad)
  'play-phone': { w: 1080, h: 1920, device: 'phone' },
};

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const BASE_CSS = `
  @font-face { font-family: Lexend; src: url('${FONT}'); font-weight: 100 900; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; font-family: Lexend, sans-serif; }
`;

// Ancho y alto de un PNG/JPEG leyendo su cabecera (sin dependencias)
function imageSize(path) {
  const b = readFileSync(path);
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  for (let i = 2; i < b.length;) {
    const marker = b[i + 1], len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    i += 2 + len;
  }
  throw new Error(`No se puede leer el tamaño de ${path}`);
}

function slideHtml({ w, h, device }, app, slide, shotPath) {
  const tablet = device === 'tablet';
  const u = w / 100; // 1 % del ancho
  // Cabecera de altura fija (marca + 2 líneas de título + 2 de subtítulo) para
  // que el móvil quede a la misma altura en todas las imágenes.
  const brandH = (tablet ? 3.4 : 5.6) * u;
  const titleSize = (tablet ? 5.2 : 8.2) * u;
  const subSize = (tablet ? 2.7 : 4.3) * u;
  const padTop = 0.05 * h;
  const headerH = brandH + 3.2 * u + titleSize * 1.12 * 2 + 2.6 * u + subSize * 1.4 * 2;
  const phoneTop = padTop + headerH + (tablet ? 4 : 5) * u;
  const bottom = 0.035 * h;
  // El móvil ocupa lo que quede, sin pasar del 78 % del ancho
  const aspect = shotPath ? (({ w: sw, h: sh }) => sw / sh)(imageSize(shotPath)) : (tablet ? 3 / 4 : 9 / 19.5);
  const bezelRatio = tablet ? 0.02 : 0.032;
  const maxW = (tablet ? 82 : 78) * u;
  const availH = h - phoneTop - bottom;
  // frameH = frameW·(1−2·bezelRatio)/aspect + 2·bezelRatio·frameW
  const frameW = Math.min(maxW, availH / ((1 - 2 * bezelRatio) / aspect + 2 * bezelRatio));
  const bezel = frameW * bezelRatio;
  const radius = frameW * (tablet ? 0.045 : 0.13);
  const shot = shotPath
    ? `<img class="shot" src="${fileUrl(shotPath)}">`
    : `<div class="shot missing">Falta la captura<br><b>capturas/${esc(app.key)}/${tablet ? 'ipad/' : ''}${esc(slide.file)}</b></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
    body {
      background:
        radial-gradient(ellipse 80% 45% at 85% 8%, rgba(216,218,86,.28), transparent 70%),
        radial-gradient(ellipse 90% 50% at 5% 35%, rgba(83,157,159,.22), transparent 70%),
        linear-gradient(170deg, #EEF4FB 0%, #EAF4EE 100%);
      position: relative;
    }
    header {
      position: absolute; top: ${padTop}px; left: 0; right: 0; height: ${headerH}px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .brand { display: flex; align-items: center; gap: ${1.6 * u}px; margin-bottom: ${3.2 * u}px; }
    .brand img { height: ${brandH}px; }
    .brand span { font-size: ${(tablet ? 2.6 : 4.4) * u}px; font-weight: 700; color: #274867; letter-spacing: -0.02em; }
    h1 {
      font-size: ${titleSize}px; font-weight: 700; color: #1F3A53; text-align: center;
      line-height: 1.12; letter-spacing: -0.02em; max-width: ${(tablet ? 80 : 88) * u}px;
    }
    p {
      margin-top: ${2.6 * u}px; font-size: ${subSize}px; font-weight: 400; color: #4A5D70;
      text-align: center; line-height: 1.4; max-width: ${(tablet ? 70 : 84) * u}px;
    }
    .frame {
      position: absolute; top: ${phoneTop}px; left: ${(w - frameW) / 2}px; width: ${frameW}px; padding: ${bezel}px;
      background: #1D2430; border-radius: ${radius}px;
      box-shadow: 0 ${3 * u}px ${8 * u}px rgba(31,58,83,.28), inset 0 0 0 ${0.35 * u}px #3A4352;
    }
    .shot { display: block; width: 100%; border-radius: ${radius - bezel}px; }
    .missing {
      aspect-ratio: ${aspect}; background: #E3ECF5; color: #6A7E92;
      display: flex; align-items: center; justify-content: center; text-align: center;
      font-size: ${(tablet ? 2.4 : 3.8) * u}px; line-height: 1.5;
    }
  </style></head><body>
    <header>
      <div class="brand"><img src="${LOGO}"><span>${esc(app.name)}</span></div>
      <h1>${esc(slide.title)}</h1>
      <p>${esc(slide.subtitle)}</p>
    </header>
    <div class="frame">${shot}</div>
  </body></html>`;
}

function featureHtml(app, shotPath) {
  const phone = shotPath
    ? `<div class="phone"><img src="${fileUrl(shotPath)}"></div>`
    : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
    body {
      background: linear-gradient(105deg, #3E78B5 0%, #539D9F 36%, #78AD89 62%, #D8DA56 100%);
      display: flex; align-items: center; padding: 0 0 0 72px; position: relative;
    }
    .text { position: relative; z-index: 1; max-width: ${shotPath ? 600 : 880}px; }
    .logo { display: flex; align-items: center; gap: 22px; }
    .logo .mark { width: 104px; height: 104px; border-radius: 26px; background: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(31,58,83,.25); }
    .logo .mark img { width: 72px; }
    .logo span { font-size: 76px; font-weight: 700; color: #fff; letter-spacing: -0.02em; text-shadow: 0 2px 16px rgba(31,58,83,.25); }
    p { margin-top: 26px; font-size: 34px; font-weight: 500; color: #fff; line-height: 1.3; text-shadow: 0 2px 12px rgba(31,58,83,.3); }
    .phone {
      position: absolute; right: 64px; top: 46px; width: 270px; padding: 9px; background: #1D2430;
      border-radius: 38px; box-shadow: 0 20px 50px rgba(31,58,83,.4);
    }
    .phone img { display: block; width: 100%; border-radius: 30px; }
  </style></head><body>
    <div class="text">
      <div class="logo"><div class="mark"><img src="${LOGO}"></div><span>${esc(app.name)}</span></div>
      <p>${esc(app.tagline)}</p>
    </div>
    ${phone}
  </body></html>`;
}

const browser = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const tmp = mkdtempSync(join(tmpdir(), 'fluxia-store-'));
let missing = 0;

async function render(html, w, h, out) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const file = join(tmp, 'page.html');
  writeFileSync(file, html);
  await page.goto(fileUrl(file));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  mkdirSync(dirname(out), { recursive: true });
  // JPEG: las tiendas rechazan imágenes con canal alfa
  await page.screenshot({ path: out, type: 'jpeg', quality: 95 });
  await page.close();
}

const only = process.argv[2];
for (const [key, app] of Object.entries(config)) {
  if (only && only !== key) continue;
  app.key = key;
  const capDir = join(ROOT, 'capturas', key);
  const outDir = join(ROOT, 'salida', key);
  rmSync(outDir, { recursive: true, force: true });

  for (const [fmt, size] of Object.entries(FORMATS)) {
    const tablet = size.device === 'tablet';
    if (tablet && key !== 'ma') continue; // PA no admite iPad
    for (const [i, slide] of app.slides.entries()) {
      const shot = join(capDir, tablet ? 'ipad' : '', slide.file);
      const has = existsSync(shot);
      if (!has) missing++;
      const name = `${String(i + 1).padStart(2, '0')}.jpg`;
      await render(slideHtml(size, app, slide, has ? shot : null), size.w, size.h, join(outDir, fmt, name));
    }
  }

  const first = join(capDir, app.slides[0].file);
  await render(featureHtml(app, existsSync(first) ? first : null), 1024, 500, join(outDir, 'play-feature-graphic.jpg'));
  // Icono de Google Play (512×512): el de la app
  copyFileSync(resolve(HERE, app.icon), join(outDir, 'play-icon-512.png'));
  console.log(`✔ ${app.name} → store-assets/salida/${key}/`);
}

await browser.close();
rmSync(tmp, { recursive: true, force: true });
if (missing) console.log(`⚠ ${missing} imágenes sin captura (se ha puesto un hueco): añade los archivos de store-assets/capturas/`);
