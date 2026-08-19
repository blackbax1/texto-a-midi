# Texto a MIDI — app de escritorio

Esta carpeta convierte tu página (`index.html`, `style.css`, `script.js`) en una
app de escritorio con Electron. La app funciona 100% sin internet: todo el
código (fuente bitmap y generador de MIDI) corre local, no hay llamadas a APIs.

## Opción A — Compilar en tu propia máquina (recomendado si solo quieres el .exe)

Requisitos: tener instalado [Node.js](https://nodejs.org) (versión 18 o más nueva).

```bash
cd texto-a-midi
npm install
npm run dist:win     # genera el instalador .exe en /dist
```

`electron-builder` puede compilar el `.exe` desde Windows, Mac o Linux sin
problema. Lo único que **no** se puede hacer desde Windows o Linux es el
`.dmg` de Mac: Apple exige que ese paso corra en macOS.

Para el `.dmg`, en una Mac:

```bash
npm install
npm run dist:mac     # genera el instalador .dmg en /dist
```

## Opción B — Que GitHub Actions compile los dos automáticamente (recomendado)

Ya incluí el workflow `.github/workflows/build.yml`, que compila el `.exe` en
una máquina Windows y el `.dmg` en una Mac, ambas provistas gratis por GitHub
— no necesitas tener ninguno de los dos sistemas operativos vos mismo.

1. Subí esta carpeta a un repositorio de GitHub (puede ser privado).
2. Andá a la pestaña **Actions** del repo y corré el workflow "Build
   installers" (o simplemente hacé push a `main`, se dispara solo).
3. Cuando termine, bajá los artefactos `instalador-windows-latest` e
   `instalador-macos-latest` — ahí están el `.exe` y el `.dmg` listos.

## Notas

- El ícono de la app usa el genérico de Electron por ahora. Si querés uno
  propio, agregá `build/icon.ico` (Windows) y `build/icon.icns` (Mac) y sumá
  `"icon": "build/icon.ico"` / `"icon": "build/icon.icns"` a las secciones
  `win` / `mac` de `package.json`.
- El `.exe` que genera NSIS no está firmado digitalmente, así que Windows va
  a mostrar el aviso de "Editor desconocido" la primera vez que alguien lo
  instale (es normal en apps sin certificado de firma de código; no afecta el
  funcionamiento).
- Todo lo que ya tenías en `index.html` / `style.css` / `script.js` está
  copiado sin cambios dentro de `renderer/`.
