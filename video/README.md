# Fluxia — vídeo explicativo (30 s, 16:9)

Vídeo animado de cómo funciona Fluxia: el paciente registra en la app (**PA**)
y el registro aparece al instante en el panel web del profesional (**MW**),
con semáforo, detalle del paciente y exportación a PDF.

Resultado: [`fluxia-explicativo-30s.mp4`](fluxia-explicativo-30s.mp4) — 1920×1080, 60 fps, H.264 + AAC.

## Cómo está hecho

| Archivo | Qué hace |
|---|---|
| `timeline.js` | Duración, escenas y momentos clave (compartido por imagen y sonido). |
| `scene.js` | Toda la animación en `<canvas>`. `renderFrame(ctx, t)` es una función pura del tiempo. Reutiliza las ilustraciones reales de la escala de Bristol (`public/fluxia_N.svg`) y reconstruye el isotipo en vectorial. |
| `music.mjs` | Música 100 % generada por código (síntesis aditiva, bajo, batería, retardo, reverb tipo Freeverb y efectos sincronizados con `CUES`). Escribe un WAV. |
| `index.html` | Vista previa interactiva (reproducir / buscar) y página que usa el render. |
| `render.mjs` | Chromium headless con Playwright → un PNG por frame → FFmpeg (tubería) + música → MP4. |
| `server.mjs` | Servidor estático mínimo (raíz del repo) para fuentes e imágenes. |

## Uso

```bash
cd video
npm install                     # playwright-core + fuente Lexend
npm run render                  # → out/fluxia-explicativo-30s.mp4 (~5 min)
FPS=30 npm run render           # más rápido
node render.mjs --stills 6,13   # PNGs sueltos en out/stills/ para revisar
npm run music                   # sólo el audio → out/music.wav
npm run preview                 # http://127.0.0.1:4321/video/ (ejecuta antes `npm run music` para oírla)
```

Requiere `ffmpeg` en el PATH. Usa el Chromium de `/opt/pw-browsers` si existe;
si no, define `CHROMIUM_PATH` o instala el navegador de Playwright.
