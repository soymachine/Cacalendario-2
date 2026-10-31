# Imágenes para App Store y Google Play

Imágenes promocionales de **PA** (Fluxia) y **MA** (Fluxia Pro), generadas a partir
de capturas reales de cada app.

```
capturas/pa/01.png …     capturas de iPhone de PA (las de slides.json, en orden)
capturas/ma/01.png …     capturas de iPhone de MA
capturas/ma/ipad/01.png  capturas de iPad de MA (MA admite iPad: Apple las exige)
generador/slides.json    títulos y subtítulos de cada imagen
generador/generar.mjs    el generador
salida/<app>/            resultado, listo para subir
```

## Qué se sube y dónde

| Archivo | Tienda | Dónde |
|---|---|---|
| `salida/<app>/apple-iphone-6.3/*.jpg` (1206×2622) | App Store Connect | Versión → Capturas → iPhone 6,1"/6,3" (obligatorio) |
| `salida/<app>/apple-iphone-6.9/*.jpg` (1320×2868) | App Store Connect | Versión → Capturas → iPhone 6,9" (opcional) |
| `salida/ma/apple-ipad-13/*.jpg` (2064×2752) | App Store Connect | Versión → Capturas → iPad 13" |
| `salida/<app>/play-phone/*.jpg` (1080×1920) | Play Console | Ficha de Play Store principal → Capturas de pantalla del teléfono |
| `salida/<app>/play-feature-graphic.jpg` (1024×500) | Play Console | Ficha de Play Store principal → Gráfico de funciones |
| `salida/<app>/play-icon-512.png` | Play Console | Ficha de Play Store principal → Icono de la aplicación |

Desde octubre de 2026, App Store Connect exige las de iPhone 6,1"/6,3" (rechaza otros tamaños con
"File dimensions are invalid"). Las de 6,9" son opcionales; el resto de iPhone se escala.

## Regenerar

Cambia textos en `generador/slides.json` o sustituye capturas y ejecuta, desde la raíz del repo:

```bash
npm i --no-save playwright && npx playwright install chromium
node store-assets/generador/generar.mjs        # las dos apps
node store-assets/generador/generar.mjs pa     # solo una
```

Consejos para las capturas: hazlas en el iPhone (o en el Simulador de un iPhone de 6,9")
con datos de ejemplo realistas, sin notificaciones ni iconos de otras apps en la barra de
estado, y pásalas sin recortar ni reducir (1179×2556 en un iPhone de 6,1"; si llegan más
pequeñas, el generador las amplía y se ven algo suaves).

**Nada de datos reales**: las imágenes de las tiendas son públicas. Nombres, emails y
notas de pacientes (o de cuentas de prueba con tu email) tienen que ser ficticios antes
de copiar la captura aquí. Las de `capturas/ma/` están retocadas así: los pacientes son
los del simulador (Laura Martín, Javier Ruiz…) y los emails usan `@ejemplo.com`.

La tipografía es Lexend (`generador/fonts/`, licencia OFL).
