// Render del vídeo v2: Chromium headless (Playwright) dibuja cada frame en
// index.html y lo pasa por tubería a FFmpeg junto con la banda sonora
// (locución + música generada, ver mix.mjs).
//
//   node render.mjs                     → out/fluxia-v2.mp4
//   node render.mjs --stills 12.5,40    → PNGs sueltos en out/stills/
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { startServer } from '../server.mjs';
import { DURATION, FPS, WIDTH, HEIGHT } from './timeline.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out');
const SRC_VIDEO = join(HERE, '..', '..', 'public', 'video', 'Marketing_Fluxia_Video.mp4');
const stillsArg = process.argv.indexOf('--stills');
const stills = stillsArg > -1 ? process.argv[stillsArg + 1].split(',').map(Number) : null;
mkdirSync(join(OUT, 'src'), { recursive: true });

// Frames del vídeo original (una sola vez).
if (readdirSync(join(OUT, 'src')).length === 0) {
  console.log('Extrayendo frames del vídeo original…');
  execFileSync('ffmpeg', ['-loglevel', 'error', '-i', SRC_VIDEO, '-q:v', '2', join(OUT, 'src', 'f%05d.jpg')]);
}

const chromiumPath = process.env.CHROMIUM_PATH
  || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].find((p) => existsSync(p));
const server = await startServer();
const browser = await chromium.launch({ executablePath: chromiumPath });
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
page.on('pageerror', (e) => console.error('[página]', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/video/v2/index.html?render`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
const frame = async (t, type = 'image/png') =>
  Buffer.from((await page.evaluate(([t, type]) => window.renderAt(t, type, 0.95), [t, type])).split(',')[1], 'base64');

if (stills) {
  mkdirSync(join(OUT, 'stills'), { recursive: true });
  for (const t of stills) {
    const f = join(OUT, 'stills', `t${t.toFixed(2)}.png`);
    writeFileSync(f, await frame(t));
    console.log(f);
  }
} else {
  const audio = join(OUT, 'soundtrack.wav');
  if (!existsSync(audio)) throw new Error('Falta out/soundtrack.wav: ejecuta antes `node mix.mjs`.');
  const mp4 = join(OUT, 'fluxia-v2.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-i', audio, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-t', String(DURATION), '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c}`)))));
  const total = Math.round(DURATION * FPS), t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const png = await frame(i / FPS);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % FPS === 0) process.stdout.write(`\rframe ${i + 1}/${total} · ${((Date.now() - t0) / (i + 1) * (total - i) / 1000).toFixed(0)} s restantes   `);
  }
  ff.stdin.end(); await done;
  console.log(`\n✔ ${mp4}`);
}
await browser.close();
server.close();
