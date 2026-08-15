# 🚀 HECTRON Live Universe — Inicio Rápido Gratuito

Esta guía levanta todo el sistema **sin GCP, sin Vercel y sin pagar nada**. La telemetría se guarda en local y el overlay 3D se sirve desde la propia API.

---

## Requisitos (solo 2 cosas)

1. **Node.js 18+** — https://nodejs.org (incluye `npm`)
2. **PRISM Live Studio** instalado (para controlar escenas/stream desde el agente; opcional si solo quieres el overlay)

> Si vas a usar el control de PRISM Desktop, necesitas también **Python 3.9+** y `pip install pywinauto` (solo Windows). Sin eso, el overlay y la API funcionan igual.

---

## Pasos

### 1. Clona e instala

```bash
git clone https://github.com/Hectron-lands/HectronAutonomo.git
cd HectronAutonomo
npm install
cd local-agent && npm install && cd ..
```

### 2. Crea tu `.env` mínimo (gratis)

```bash
cp .env.example .env
```

Edita `.env` y deja **vacías** las variables de GCP/BigQuery (la telemetría caerá automáticamente a modo local gratuito). Solo necesitas:

```env
PORT=3000
AGENT_TOKEN=cualquier-cosa-que-quieras
PRISM_WINDOW_TITLE=PRISM Live Studio
```

### 3. Arranca todo con un comando

```bash
npm start
```

Verás algo así:

```
┌──────────────────────────────────────────────────────────────┐
│ HECTRON Live Universe — Modo gratuito                         │
└──────────────────────────────────────────────────────────────┘

  Overlay 3D :  http://localhost:3000/overlay/universe.html
  API        :  http://localhost:3000/health
  WebSocket  :  ws://localhost:3000/api/brain/ws
```

¡Listo! El universo virtual y la API ya están corriendo.

---

## Añadir el overlay a PRISM Live Studio

1. Abre **PRISM Live Studio**.
2. En la escena, añade una **fuente de Navegador** (Browser Source).
3. URL: `http://localhost:3000/overlay/universe.html`
4. Ancho/Alto: `1920×1080` (o tu resolución de stream).
5. El universo 3D aparecerá y reaccionará en tiempo real al chat y comandos.

---

## Comandos disponibles (para el chat)

Cuando el stream esté activo, los espectadores pueden escribir:

| Comando | Acción |
|---------|--------|
| `/explorar [planeta]` | Explora un planeta |
| `/construir [tipo] [planeta]` | Construye un edificio |
| `/minar [planeta]` | Extrae recursos |
| `/inventario` | Ver tu inventario |
| `/estados` | Ver estadísticas |
| `/ayuda` | Mostrar ayuda |

---

## Modos de arranque

| Comando | Qué levanta |
|---------|-------------|
| `npm start` | API + overlay + agente local (todo) |
| `npm run start:overlay` | Solo API + overlay (sin control de PRISM) |
| `npm run start:agent` | Solo el agente local de PRISM |

---

## Dónde se guardan los datos (gratis, en tu PC)

- **Telemetría:** `local-agent/data/telemetry.json` (logs de chat, decisiones, estado). No se envía a ningún sitio.
- **Memoria del universo:** en memoria de la API mientras corre.

---

## Activar control de PRISM Desktop (opcional)

Si quieres que el agente cambie escenas y arranque/pare el stream automáticamente en PRISM:

1. Instala Python: https://python.org
2. `pip install pywinauto`
3. Abre PRISM Live Studio.
4. En `.env`, configura:
   ```env
   PRISM_WINDOW_TITLE=PRISM Live Studio
   PRISM_PYTHON=python
   PRISM_LAUNCH_CMD=    # ruta al .exe de PRISM si quieres que lo abra solo
   ```
5. Arranca con `npm start`. El agente conectará con la ventana de PRISM.

> El agente usa los objectName reales de los widgets Qt de PRISM (`GoLiveShift` para Go Live, `scenesDock` para escenas), extraídos del código fuente público de PRISM.

---

## Solución de problemas

**El overlay no carga en PRISM:** asegúrate de que la API está corriendo (`http://localhost:3000/health` debe responder `{"ok":true}`). PRISM necesita poder acceder a `localhost`.

**El agente no conecta con PRISM:** verifica que PRISM está abierto y que el título de la ventana contiene "PRISM Live Studio". Si tu versión tiene otro título, ajusta `PRISM_WINDOW_TITLE` en `.env`.

**Error de Python/pywinauto:** si solo quieres el overlay, usa `npm run start:overlay` en lugar de `npm start` — no necesita Python.
