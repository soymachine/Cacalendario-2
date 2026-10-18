# Fluxia — vídeo explicativo v2 (≈97 s, 16:9)

Une el vídeo de marketing original (animación con una sanitaria y una paciente,
`public/video/Marketing_Fluxia_Video.mp4`) con demos animadas construidas sobre
los **pantallazos actuales** de la app del paciente (`assets/app-*.png`) y del
panel del profesional (`assets/web-*.webp`). El guion y la locución se han
ampliado para contar que Fluxia registra **deposiciones, micciones y
alimentación**, y los grafismos lo refuerzan (pictos de la app, pestañas,
filtros del historial y cierre).

Resultado: [`fluxia-explicativo-v2.mp4`](fluxia-explicativo-v2.mp4) — 1920×1080, 30 fps, H.264 + AAC.

## Montaje

| Tiempo | Plano | Fuente |
|---|---|---|
| 0–14 s | Consulta y paciente (+ icono de comida nuevo) | original |
| 14–24 s | La sanitaria y sus dudas | original |
| 24–33 s | Invitación y paciente con el móvil | original |
| 33–42 s | App: deposiciones, micciones y alimentación | canvas + pantallazos PA |
| 42–51 s | Panel: configuración del seguimiento | canvas + pantallazos MW |
| 51–58 s | Recordatorios automáticos | original |
| 58–63 s | Cada registro llega al panel | canvas |
| 63–71 s | Semáforo en la lista de pacientes | canvas |
| 71–85 s | Historial, estadísticas, comidas y PDF | canvas |
| 85–97 s | Sanitaria tranquila y cierre (+ chips de los tres registros) | original |

## Archivos

| Archivo | Qué hace |
|---|---|
| `script.json` | Guion de la locución (frases, voz y pronunciación). |
| `voz/` | Locución definitiva (ElevenLabs, voz «Marina») y `cortes.json` con el inicio/fin de cada frase. |
| `split-voice.mjs` | Corta la locución de `voz/` en una pista por frase → `out/vo/`. |
| `voice.py` | (Alternativa) | Locución con TTS local (sherpa-onnx): voz Piper `es_ES-sharvard`, locutora F, acento castellano de España. |
| `anonymize.mjs` | Sustituye nombres y correos reales de los pantallazos del panel por pacientes ficticios. |
| `timeline.js` | Planos, mapeo de tiempo de los planos originales, inicio de cada frase y momentos clave. |
| `scene.js` | Composición en canvas (planos originales + demos + grafismos). |
| `mix.mjs` | Música generada por código + locución con ducking + efectos → `out/soundtrack.wav`. |
| `render.mjs` | Playwright → PNG por frame → FFmpeg (+ banda sonora, loudnorm −16 LUFS). |
| `index.html` | Vista previa con barra para buscar instantes. |

## Uso

```bash
cd video && npm install                       # playwright-core + Lexend (una vez)
pip install sherpa-onnx soundfile             # TTS (una vez)
mkdir -p v2/models && curl -L https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-es_ES-sharvard-medium.tar.bz2 | tar xj -C v2/models
cd v2
node anonymize.mjs <carpeta-con-pantallazos-originales>   # sólo si cambian los pantallazos del panel
node split-voice.mjs                          # out/vo/*.wav desde voz/ (o python3 voice.py para la voz sintética local)
node mix.mjs                                  # out/soundtrack.wav
node render.mjs                               # out/fluxia-v2.mp4 (~3 min)
node render.mjs --stills 36,47.6,75.5         # PNGs sueltos para revisar
```

Si cambia la duración de alguna frase, ajusta `VO` y, si hace falta, los
planos y `CUES` en `timeline.js`.
