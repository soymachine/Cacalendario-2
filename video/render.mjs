// Renderiza el vídeo a MP4: genera la música, abre index.html en Chromium
// headless con Playwright, dibuja cada frame en el instante exacto t = i/FPS
// y lo envía por tubería a FFmpeg, que lo codifica junto al audio.
//
//   node render.mjs                 → out/fluxia-explicativo-30s.mp4
//   node render.mjs marketing       → out/fluxia-marketing-50s.mp4 (carpeta marketing/)
//   FPS=30 node render.mjs          → otra cadencia (por defecto 60)
//   node render.mjs --stills 5,12.7 → sólo PNGs de esos instantes (out/stills/)
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { startServer } from './server.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out');
// Cada vídeo vive en su carpeta (timeline.js, scene.js, music.mjs, index.html).
const VIDEOS = {
  explicativo: { dir: '.', file: 'fluxia-explicativo-30s' },
  marketing: { dir: 'marketing', file: 'fluxia-marketing-50s' },
};
const name = process.argv.slice(2).find((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--stills') || 'explicativo';
const video = VIDEOS[name];
if (!video) throw new Error(`Vídeo desconocido: ${name} (opciones: ${Object.keys(VIDEOS).join(', ')})`);
const { DURATION, WIDTH, HEIGHT } = await import(`./${video.dir}/timeline.js`);
const FPS = Number(process.env.FPS) || 60;
const stillsArg = process.argv.indexOf('--stills');
const stills = stillsArg > -1 ? process.argv[stillsArg + 1].split(',').map(Number) : null;
mkdirSync(OUT, { recursive: true });

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const candidates = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'];
  return candidates.find((p) => existsSync(p)); // undefined → el Chromium propio de Playwright
}

// La música se sintetiza antes de abrir Chromium: la síntesis bloquea Node
// durante decenas de segundos y el navegador se cerraría mientras tanto.
const wav = join(OUT, `${video.file}.wav`);
if (!stills) {
  console.log('♪ Generando música…');
  const { renderMusic } = await import(`./${video.dir}/music.mjs`); // la síntesis corre al importar
  writeFileSync(wav, renderMusic());
}

const server = await startServer();
const url = `http://127.0.0.1:${server.address().port}/video/${video.dir === '.' ? '' : video.dir + '/'}index.html?render`;
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('[página]', e.message));
await page.goto(url);
await page.waitForFunction(() => window.ready === true, null, { timeout: 30000 });

const frame = async (t) => Buffer.from((await page.evaluate((t) => window.renderAt(t), t)).split(',')[1], 'base64');

if (stills) {
  mkdirSync(join(OUT, 'stills'), { recursive: true });
  for (const t of stills) {
    const file = join(OUT, 'stills', `${name}-t${t.toFixed(2)}.png`);
    writeFileSync(file, await frame(t));
    console.log(file);
  }
} else {
  const mp4 = join(OUT, `${video.file}.mp4`);
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k',
    '-t', String(DURATION), '-movflags', '+faststart', mp4,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg salió con código ${c}`)))));

  const total = Math.round(DURATION * FPS);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const png = await frame(i / FPS);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % FPS === 0 || i === total - 1) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r🎞  frame ${i + 1}/${total} · ${(el / (i + 1) * (total - i - 1)).toFixed(0)} s restantes   `);
    }
  }
  ff.stdin.end();
  await done;
  console.log(`\n✔ ${mp4}`);
}

await browser.close();
server.close();
