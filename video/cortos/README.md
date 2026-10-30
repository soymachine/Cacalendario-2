# Fluxia — vídeos cortos (16:9, una funcionalidad cada uno)

Misma estética que el vídeo v2 (personajes del vídeo original + demos en
canvas con los pantallazos actuales) y la misma voz: la locución se monta con
frases de la grabación de ElevenLabs (voz Marina, `../v2/voz/`).

| Vídeo | Duración | Qué cuenta |
|---|---|---|
| [`fluxia-corto-recordatorios.mp4`](fluxia-corto-recordatorios.mp4) | 32 s | Contexto: qué registra el paciente desde la app. Si el paciente deja de registrar, Fluxia le envía un recordatorio (textos reales de las notificaciones); el profesional decide cuándo avisar; el paciente registra en unos toques y el semáforo vuelve a verde. |
| [`fluxia-corto-memoria-papel.mp4`](fluxia-corto-memoria-papel.mp4) | 36 s | Contexto: la consulta. La memoria falla y el papel se pierde; con Fluxia cada registro queda con fecha y hora en el historial (deposiciones, micciones y comidas). |

Cada corto abre con una intro breve: cabecera con el logo dibujándose, «Fluxia» letra a letra y el tema del vídeo, y una frase de contexto.

Locución de cada corto:

- **Recordatorios**: «Desde la app, el paciente registra sus deposiciones, sus micciones y su alimentación. ¿El paciente deja de hacerlo? Fluxia le envía recordatorios automáticos para mantener el seguimiento. Bastan unos toques. Cada registro llega al instante a tu panel. Fluxia. Datos reales, decisiones mejores.»
- **Memoria y papel**: «Cada paciente cuenta una historia. El problema es que, muchas veces, los detalles de esa historia se pierden entre visitas. Detalles que se olvidan, registros incompletos, información difícil de reconstruir. Fluxia te ayuda a cambiar eso: tienes el historial completo de cada paciente: deposiciones, micciones y comidas. Porque un buen seguimiento empieza con información fiable. Fluxia. Datos reales, decisiones mejores.»

## Archivos

| Archivo | Qué hace |
|---|---|
| `shorts.js` | Definición de cada corto: planos, frases de la locución (`PHRASES`), momentos clave e intensidad de la música. |
| `scene.js` | Escenas en canvas (pantalla de bloqueo con notificaciones, panel, libreta y memoria, historial, cierre). Reutiliza piezas de `../v2/scene.js`. |
| `mix.mjs` | Música generada por código + frases de la locución + efectos → `out/<id>.wav`. |
| `render.mjs` | Playwright + FFmpeg → `out/<id>.mp4`. |

## Uso

```bash
cd video/cortos
node mix.mjs recordatorios && node render.mjs recordatorios
node mix.mjs memoria && node render.mjs memoria
node render.mjs memoria --stills 5,12   # PNGs para revisar
```

Vista previa: `node ../server.mjs` y abrir `http://127.0.0.1:4321/video/cortos/?id=memoria`.
