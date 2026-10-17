// Sustituye los nombres y correos reales de los pantallazos del panel por
// pacientes ficticios, tapando el texto original con el color de fondo
// muestreado alrededor y reescribiéndolo con Lexend (la fuente del panel).
// Sólo se versionan los pantallazos ya anonimizados (assets/web-*.webp).
//
//   node anonymize.mjs <carpeta con los originales>
//   (web-inicio.webp, web-pacientes.webp, web-detalle.webp, web-configuracion.webp)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(process.argv[2] || '.');

// Pacientes ficticios (mismo orden que en los pantallazos).
const P = {
  daniel: { name: 'Lucía Ferrer', mail: 'lucia.ferrer@example.com', ini: 'L' },
  danielinho: { name: 'Marcos Ruiz', mail: 'marcos.ruiz@example.com', ini: 'M' },
  eric: { name: 'Elena Vidal', mail: 'elena.vidal@example.com', ini: 'E' },
  pepe: { name: 'Pedro Sanz', mail: 'pedro.sanz@example.com', ini: 'P' },
  p2: { name: 'Carmen Ortega', ini: 'C' },
  p4: { name: 'Javier Molina', ini: 'J' },
  p6: { name: 'Ana Romero', ini: 'A' },
  p5: { mail: 'isabel.prieto@example.com', ini: 'I' },
};
const NAME = { size: 16.5, weight: 600, color: '#24272C' };
const MAIL = { size: 13, weight: 400, color: '#7F8794' };

// rect: zona a tapar [x, y, w, h]; text: [texto, x, baseline, estilo]; avatar: [cx, cy, r, letra]
const PATCHES = {
  'web-inicio.webp': [
    ...[['p2', 541], ['p4', 611], ['pepe', 681], ['daniel', 751], ['p6', 821], ['danielinho', 891], ['eric', 961]]
      .map(([k, y]) => ({ rect: [86, y - 17, 340, 23], text: [P[k].name, 89, y, NAME] })),
  ],
  'web-pacientes.webp': [
    ...[['daniel', 448, 468, 463], ['danielinho', 549, 571, 553], ['eric', 627, 649, 631], ['pepe', 705, 727, 709]].flatMap(([k, yn, ym, ya]) => [
      { rect: [152, yn - 17, 300, 23], text: [P[k].name, 156, yn, NAME] },
      { rect: [152, ym - 13, 330, 18], text: [P[k].mail, 156, ym, MAIL] },
      { avatar: [128, ya, 18, P[k].ini] },
    ]),
    ...[['p2', 793, 787], ['p4', 870, 864], ['p6', 947, 941]].flatMap(([k, y, ya]) => [
      { rect: [152, y - 18, 360, 25], text: [P[k].name, 156, y, NAME] },
      { avatar: [128, ya, 18, P[k].ini] },
    ]),
    { rect: [152, 1021 - 18, 360, 25], text: [P.p5.mail, 156, 1021, NAME] },
    { avatar: [128, 1015, 18, P.p5.ini] },
  ],
  'web-detalle.webp': [
    { rect: [566, 116, 184, 42], text: [P.daniel.name, 571, 147, { size: 30, weight: 700, color: '#2A2C30', maxWidth: 176 }] },
    { rect: [600, 160, 310, 26], text: [P.daniel.mail, 755, 180, { size: 17, weight: 400, color: '#4A4F57', align: 'center' }] },
  ],
  'web-configuracion.webp': [
    { rect: [566, 116, 184, 42], text: [P.daniel.name, 571, 147, { size: 30, weight: 700, color: '#2A2C2B', maxWidth: 176 }] },
    { rect: [600, 160, 310, 26], text: [P.daniel.mail, 755, 180, { size: 17, weight: 400, color: '#4A4E4C', align: 'center' }] },
    { rect: [1688, 20, 135, 28], text: [P.daniel.name, 1692, 41, { size: 19, weight: 700, color: '#FFFFFF' }] },
  ],
};

const font = (w) => join(HERE, '..', 'node_modules', '@fontsource', 'lexend', 'files', `lexend-latin-${w}-normal.woff2`);
const chromiumPath = process.env.CHROMIUM_PATH
  || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].find((p) => existsSync(p));
const browser = await chromium.launch({ executablePath: chromiumPath });
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
await page.evaluate(async (fonts) => {
  for (const [w, b64] of fonts) {
    const f = new FontFace('Lexend', `url(data:font/woff2;base64,${b64})`, { weight: String(w) });
    document.fonts.add(await f.load());
  }
}, [400, 600, 700].map((w) => [w, readFileSync(font(w)).toString('base64')]));

for (const [file, patches] of Object.entries(PATCHES)) {
  const b64 = readFileSync(join(SRC, file)).toString('base64');
  const out = await page.evaluate(async ({ b64, patches }) => {
    const img = new Image();
    img.src = `data:image/webp;base64,${b64}`;
    await img.decode();
    const c = document.getElementById('c');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const px = (x, y) => { const d = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data; return `rgb(${d[0]},${d[1]},${d[2]})`; };
    for (const p of patches) {
      if (p.rect) {
        const [x, y, w, h] = p.rect;
        // degradado horizontal con el fondo muestreado a ambos lados
        const g = ctx.createLinearGradient(x, 0, x + w, 0);
        g.addColorStop(0, px(x - 2, y + h / 2)); g.addColorStop(1, px(x + w + 2, y + h / 2));
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      }
      if (p.avatar) {
        const [cx, cy, r, letter] = p.avatar;
        const col = px(cx - r * 0.72, cy);
        ctx.beginPath(); ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
        ctx.font = '600 13px Lexend'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(letter, cx, cy + 0.5);
      }
      if (p.text) {
        const [s, x, y, st] = p.text;
        let size = st.size;
        ctx.font = `${st.weight} ${size}px Lexend`;
        if (st.maxWidth && ctx.measureText(s).width > st.maxWidth) { size *= st.maxWidth / ctx.measureText(s).width; ctx.font = `${st.weight} ${size}px Lexend`; }
        ctx.fillStyle = st.color; ctx.textAlign = st.align || 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(s, x, y);
      }
    }
    return c.toDataURL('image/webp', 0.95);
  }, { b64, patches });
  writeFileSync(join(HERE, 'assets', file), Buffer.from(out.split(',')[1], 'base64'));
  console.log('✔', file);
}
await browser.close();
