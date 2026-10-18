// Corta la locución grabada (voz/<fuente>.mp3) en una pista por frase
// según voz/cortes.json → out/vo/Lxx.wav + durations.json (lo que lee mix.mjs).
//
//   node split-voice.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const { fuente, cortes } = JSON.parse(readFileSync(join(HERE, 'voz', 'cortes.json'), 'utf8'));
const OUT = join(HERE, 'out', 'vo');
mkdirSync(OUT, { recursive: true });
const durations = {};
for (const [id, [a, b]] of Object.entries(cortes)) {
  const d = b - a;
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(a), '-t', String(d), '-i', join(HERE, 'voz', fuente),
    '-af', `afade=t=in:d=0.02,afade=t=out:st=${(d - 0.06).toFixed(3)}:d=0.06`, '-ar', '44100', '-ac', '1', join(OUT, `${id}.wav`)]);
  durations[id] = d;
  console.log(id, d.toFixed(2) + ' s');
}
writeFileSync(join(OUT, 'durations.json'), JSON.stringify(durations, null, 1));
