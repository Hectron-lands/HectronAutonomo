# 🧱 El Leviatán — Sistema de Streaming Autónomo con Gemini

Sistema automatizado que conecta los "oídos" (chat de TikTok), el "cerebro"
(Google AI Studio / Gemini), la "voz" (ElevenLabs) y el "cuerpo" (avatar 3D
en VSeeFace vía OSC) para crear una tarotista o VTuber de TikTok.

## Arquitectura

```
TikTok Live ──► ojos.py ──► memoria.py ──► cerebro.py ──► voz.py
                   │             (SQLite)      (Gemini)     │
                   │                                        ▼
                   └────────────► cuerpo.py (OSC → VSeeFace 3D)
```

| Módulo     | Función                              | Tecnología            |
|------------|--------------------------------------|-----------------------|
| `config.py`| Configuración central                | Variables de entorno  |
| `ojos.py`  | Escucha chat + regalos               | TikTokLive            |
| `memoria.py`| Recuerda usuarios (hipocampo)       | SQLite local          |
| `cerebro.py`| Piensa respuestas + emociones       | Google AI Studio      |
| `voz.py`   | Síntesis de voz                      | ElevenLabs            |
| `cuerpo.py`| Expresiones faciales del avatar 3D  | OSC → VSeeFace        |
| `main.py`  | Orquestador                         | Python                |

## Inicio rápido (gratis)

### 1. Instalar dependencias

```bash
pip install -r leviatan/requirements.txt
```

### 2. Configurar

```bash
cp leviatan/.env.example .env
```

Edita `.env` y rellena:
- `GEMINI_API_KEY` — gratis en https://aistudio.google.com/apikey
- `TIKTOK_USERNAME` — tu usuario de TikTok sin la @
- `ELEVENLABS_API_KEY` — gratis en https://elevenlabs.io (opcional, sin voz funciona en modo texto)

### 3. Verificar configuración

```bash
python -m leviatan.main --check
```

### 4. Arrancar

```bash
python -m leviatan.main
```

El Leviatán empezará a escuchar el chat de TikTok y a responder con voz y
expresiones 3D en tiempo real.

## Cómo conectar a PRISM Live Studio

1. Abre **VSeeFace**, carga tu avatar `.vrm`.
2. En VSeeFace → Settings → activa **OSC receiver** (puerto 39000).
3. En VSeeFace → Lip-sync → selecciona el cable de audio virtual (o el audio del sistema).
4. Abre **PRISM Live Studio**, añade una **Captura de ventana** seleccionando VSeeFace
   (marca "permitir transparencia" para quitar el fondo).
5. Arranca el Leviatán: `python -m leviatan.main`.

## Comportamiento

- **Comentario con `?` o `@`**: el Leviatán recuerda al usuario, genera una respuesta
  mística con Gemini, cambia la expresión 3D según la emoción detectada y habla.
- **Regalo (rosa, león, etc.)**: el Leviatán se alegra (`[Joy]`), agradece por nombre
  y marca al usuario como VIP en la base de datos.
- **Usuario que vuelve**: si ya había comentado antes, el Leviatán lo saluda por nombre
  y referencia su último mensaje.

## Emociones

El cerebro (Gemini) añade al final de cada respuesta una emoción entre corchetes:
`[Joy]`, `[Angry]`, `[Sorrow]`, `[Fun]`, `[Neutral]`. Esta emoción se envía vía OSC
a VSeeFace para mover la cara del avatar 3D.
