// Los síntomas y características que guarda PA tienen que tener etiqueta en
// el panel del médico (MW y MA). Si no, el médico ve la clave en bruto
// (pasó con "weight_loss ×1" en las estadísticas de MA).
//   npm test   (node --test --experimental-strip-types)
//
// Se leen como texto: mobile/src/lib/formOptions.ts carga imágenes con
// require() y no se puede importar desde Node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

/** Pares { key, label } de un array `export const NAME = [...]` de formOptions.ts. */
function paOptions(name: string): Map<string, string> {
  const src = read('mobile/src/lib/formOptions.ts');
  const block = src.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\];`))?.[1];
  assert.ok(block, `no se encuentra ${name} en formOptions.ts`);
  return new Map([...block.matchAll(/key: '([^']+)', label: '([^']+)'/g)].map((m) => [m[1], m[2]]));
}

/** Entradas `clave: 'Etiqueta'` de un mapa `NAME: Record<string, string> = {...}`. */
function labelMap(path: string, name: string): Map<string, string> {
  const src = read(path);
  const block = src.match(new RegExp(`${name}: Record<string, string> = \\{([\\s\\S]*?)\\};`))?.[1];
  assert.ok(block, `no se encuentra ${name} en ${path}`);
  return new Map([...block.matchAll(/(\w+): '([^']+)'/g)].map((m) => [m[1], m[2]]));
}

// Síntomas que PA añade aparte de la lista SYMPTOMS (interruptores propios).
const PA_EXTRA_SYMPTOMS = new Map([['weight_loss', 'Pérdida de peso']]);

test('PA solo añade weight_loss fuera de la lista SYMPTOMS', () => {
  const pushed = new Set<string>();
  for (const f of ['mobile/src/components/RegisterScreen.tsx', 'mobile/src/components/EditScreen.tsx']) {
    for (const m of read(f).matchAll(/finalSymptoms\.push\('([^']+)'\)/g)) pushed.add(m[1]);
  }
  assert.deepEqual([...pushed].sort(), [...PA_EXTRA_SYMPTOMS.keys()].sort(),
    'PA guarda un síntoma nuevo fuera de SYMPTOMS: añádelo a PA_EXTRA_SYMPTOMS y a las etiquetas de MW y MA');
});

const PANELS = [
  { app: 'MW', path: 'src/components/MedicsPanel.tsx' },
  { app: 'MA', path: 'mobile-medics/src/lib/entryLabels.ts' },
];

for (const { app, path } of PANELS) {
  test(`${app} tiene etiqueta para cada síntoma de PA, con el mismo texto`, () => {
    const labels = labelMap(path, 'SYMPTOM_LABEL');
    for (const [key, label] of [...paOptions('SYMPTOMS'), ...PA_EXTRA_SYMPTOMS]) {
      assert.equal(labels.get(key), label, `${app}: SYMPTOM_LABEL.${key}`);
    }
  });

  test(`${app} tiene etiqueta para cada característica de micción de PA`, () => {
    const labels = labelMap(path, 'URINE_CHAR_LABEL');
    for (const [key, label] of paOptions('URINE_CHARACTERISTICS')) {
      assert.equal(labels.get(key), label, `${app}: URINE_CHAR_LABEL.${key}`);
    }
  });
}
