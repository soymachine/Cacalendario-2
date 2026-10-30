// Render de un vídeo corto: Playwright dibuja cada frame de index.html?id=…
// y FFmpeg lo codifica con su banda sonora (mix.mjs).
//
//   node render.mjs recordatorios            → out/recordatorios.mp4
//   node render.mjs memoria --stills 5,12    → PNGs en out/stills/
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { startServer } from '../server.mjs';
import { SHORTS, FPS, WIDTH, HEIGHT } from './shorts.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out');
const id = process.argv[2];
if (!SHORTS[id]) throw new Error(`Uso: node render.mjs <${Object.keys(SHORTS).join('|')}> [--stills t1,t2]`);
const { duration } = SHORTS[id];
const stillsArg = process.argv.indexOf('--stills');
const stills = stillsArg > -1 ? process.argv[stillsArg + 1].split(',').map(Number) : null;
mkdirSync(OUT, { recursive: true });

// Frames del vídeo original (compartidos con v2).
const SRC = join(HERE, '..', 'v2', 'out', 'src');
mkdirSync(SRC, { recursive: true });
if (readdirSync(SRC).length === 0) {
  execFileSync('ffmpeg', ['-loglevel', 'error', '-i', join(HERE, '..', '..', 'public', 'video', 'Marketing_Fluxia_Video.mp4'), '-q:v', '2', join(SRC, 'f%05d.jpg')]);
}

const chromiumPath = process.env.CHROMIUM_PATH
  || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].find((p) => existsSync(p));
const server = await startServer();
const browser = await chromium.launch({ executablePath: chromiumPath });
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
page.on('pageerror', (e) => console.error('[página]', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/video/cortos/index.html?render&id=${id}`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
const frame = async (t) => Buffer.from((await page.evaluate((t) => window.renderAt(t), t)).split(',')[1], 'base64');

if (stills) {
  mkdirSync(join(OUT, 'stills'), { recursive: true });
  for (const t of stills) {
    const f = join(OUT, 'stills', `${id}-t${t.toFixed(2)}.png`);
    writeFileSync(f, await frame(t)); console.log(f);
  }
} else {
  const audio = join(OUT, `${id}.wav`);
  if (!existsSync(audio)) throw new Error(`Falta ${audio}: ejecuta antes \`node mix.mjs ${id}\`.`);
  const mp4 = join(OUT, `${id}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-i', audio, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-t', String(duration), '-movflags', '+faststart', mp4],
  { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c}`)))));
  const total = Math.round(duration * FPS);
  for (let i = 0; i < total; i++) {
    const png = await frame(i / FPS);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await done;
  console.log(`✔ ${mp4}`);
}
await browser.close();
server.close();
