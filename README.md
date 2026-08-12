# HECTRON AUTÓNOMO v3.2

**Sistema Autónomo de Streaming con Miku 3D, Gemini TTS, TikTok API y Control de OBS**

[![GitHub](https://img.shields.io/badge/GitHub-HectronAutonomo-blue)](https://github.com/Hectron-lands/HectronAutonomo)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com/)

---

## 📌 **¿Qué es HECTRON AUTÓNOMO?**

HECTRON es un **sistema de streaming autónomo** que integra:
- 🎤 **Modelo 3D de Miku** (cargado desde Sketchfab)
- 🗣️ **Voz TTS con Gemini** (síntesis de voz en español)
- 💬 **Chat de TikTok LIVE en tiempo real**
- 🎭 **Control de OBS Studio** (cambiar escenas, iniciar/detener stream)
- 🧠 **Cerebro Autónomo** (toma decisiones sin intervención humana)
- 📊 **BigQuery Integration** (almacenamiento y analítica de datos)
- 🚀 **GitHub CI/CD** (despliegue automático)

Cuando no hay interacción en el chat durante **2 minutos**, HECTRON **se activa automáticamente** y:
- Cambia de escena en OBS
- Habla con voz generada por IA
- Muestra emociones
- Mantiene el stream activo

---

## 🏗️ **Arquitectura del Sistema**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HECTRON AUTÓNOMO v3.2                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐  │
│  │  TikTok LIVE  │    │  OBS Studio   │    │         Cerebro Autónomo       │  │
│  │   (Chat)      │    │  (Streaming)  │    │  ┌──────────────────────────┐ │  │
│  └──────┬───────┘    └──────┬───────┘    │  │  • Routing semántico        │ │  │
│         │                   │              │  │  • Psique dinámica (Ω)      │ │  │
│         ▼                   ▼              │  │  • Memoria + BigQuery       │ │  │
│  ┌─────────────────────────────────────┐  │  │  • Generación autónoma      │ │  │
│  │         Local Agent (Node.js)         │  │  └──────────────────────────┘ │  │
│  │  • WebSocket (Port 8787)             │◄─┼─┤                                      │  │
│  │  • Control OBS                        │  │  ┌──────────────────────────┐ │  │
│  └─────────────────────────────────────┘  │  │  • GitHub Webhooks          │ │  │
│                                          │  │  • Auto-deploy (Vercel/AI S.)│ │  │
│  ┌─────────────────────────────────────┐  │  └──────────────────────────┘ │  │
│  │         BigQuery (GCP)                │  │                              │  │
│  │  • Tabla: chat_logs                   │  │  ┌──────────────────────────┐ │  │
│  │  • Tabla: psyche_state                │  │  │  • Almacenamiento de chat   │ │  │
│  │  • Tabla: autonomous_decisions        │  │  │  • Análisis de engagement    │ │  │
│  └─────────────────────────────────────┘  │  │  • Métricas de autonomía     │ │  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 **Instalación Rápida**

### 1️⃣ **Clonar el repositorio**

```bash
git clone https://github.com/Hectron-lands/HectronAutonomo.git
cd HectronAutonomo
```

### 2️⃣ **Instalar dependencias**

```bash
# Instalar dependencias raíz
npm install

# Instalar dependencias de la API
cd api && npm install

# Instalar dependencias del Local Agent
cd ../local-agent && npm install

# Volver a la raíz
cd ..
```

### 3️⃣ **Configurar variables de entorno**

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
nano .env  # o usa tu editor preferido
```

> ⚠️ **IMPORTANTE**: NUNCA subas el archivo `.env` a GitHub. Ya está en `.gitignore`.

### 4️⃣ **Configurar BigQuery**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Habilita la API de **BigQuery**
4. Crea un **Service Account** con permisos de **BigQuery Data Editor**
5. Descarga el JSON de credenciales y configúralo en `.env` como `GCP_CREDENTIALS_JSON`
6. El dataset `hectron_autonomo` se creará automáticamente al iniciar

### 5️⃣ **Configurar TikTok API**

1. Ve a [TikTok Developer Portal](https://developers.tiktok.com/)
2. Crea una nueva aplicación
3. Configura el **Redirect URI**: `https://hectron-3d-stream-studio.ai.studio/auth/tiktok`
4. Obtén tu **Client Key** y **Client Secret**
5. Configúralos en `.env`

### 6️⃣ **Configurar OBS Studio**

1. Abre OBS → Herramientas → Configuración de WebSocket
2. **Activar servidor WebSocket**: ✅
3. **Puerto**: `4455` (o el que configures en `.env`)
4. **Contraseña**: La misma que en `OBS_PASSWORD`

### 7️⃣ **Configurar GitHub Actions (Opcional)**

1. Ve a tu repositorio en GitHub
2. Settings → Secrets → Actions
3. Añade los siguientes secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_PROJECT_ID`
   - `VERCEL_TEAM_ID`
   - `GEMINI_API_KEY`
   - `GCP_PROJECT_ID`
   - `GCP_CREDENTIALS_JSON`

---

## 🏃 **Ejecutar el Sistema**

### Opción 1: Desarrollo Local

```bash
# En una terminal (API + Dashboard)
npm run dev:api

# En otra terminal (Local Agent)
npm run dev:agent
```

### Opción 2: Producción con PM2

```bash
# Instalar PM2 global
npm install -g pm2

# Iniciar todos los servicios
pm2 start api/src/index.js --name hectron-api
pm2 start local-agent/src/index.mjs --name hectron-agent
pm2 save
pm2 startup
```

### Opción 3: Usar el script PC

```bash
# En Windows o Linux
npm run pc
```

---

## 🎯 **Configuración de Autonomía**

### Umbral de Autonomía

El sistema se activa automáticamente cuando no hay interacción durante:
- **Default**: 2 minutos (`AUTONOMOUS_THRESHOLD_MS=120000`)
- **Recomendado**: 1-3 minutos

Para cambiarlo, edita `.env`:
```env
AUTONOMOUS_THRESHOLD_MS=180000  # 3 minutos
```

### Escenas Autónomas

Configura las escenas disponibles para autonomía en `.env`:
```env
AUTONOMOUS_SCENES=HAPPY_SCENE,SAD_SCENE,ANGRY_SCENE,SURPRISE_SCENE,FLIRT_SCENE,DEFAULT
```

> 💡 **Consejo**: Crea estas escenas en OBS antes de iniciar el sistema.

---

## 📊 **Dashboard y Monitoreo**

### Endpoints Disponibles

| **Endpoint** | **Descripción** | **Autenticación** |
|--------------|----------------|------------------|
| `GET /health` | Estado del servicio | No |
| `GET /api/status` | Estado completo | Sí (X-Agent-Token) |
| `GET /api/metrics/all` | Todas las métricas | Sí |
| `GET /api/metrics/chat` | Métricas de chat | Sí |
| `GET /api/metrics/psyche` | Métricas de psique | Sí |
| `GET /api/metrics/autonomy` | Métricas de autonomía | Sí |
| `GET /api/metrics/summary` | Resumen de métricas | Sí |
| `GET /api/metrics/dashboard` | Datos para dashboard | Sí |
| `GET /autonomy/status` | Estado de autonomía | No |

### WebSocket Endpoints

| **Endpoint** | **Descripción** |
|--------------|----------------|
| `ws://localhost:3000/api/brain/ws` | WebSocket del cerebro |
| `ws://localhost:3001/autonomy/ws` | WebSocket de autonomía |

---

## 🔧 **Integración con BigQuery**

### Tablas Creadas Automáticamente

1. **`chat_logs`** - Logs de todos los mensajes del chat
   - `id`, `timestamp`, `user_id`, `user_name`, `message`, `emotion`, `scene`, `response`, `tokens_used`, `processing_time_ms`
   - Partitionado por fecha
   - Clusterizado por `user_id` y `scene`

2. **`psyche_state`** - Estado de la psique (Ω) en cada interacción
   - `id`, `timestamp`, `machiavellianism`, `stoicism`, `emotional_weight`, `creative_drive`, `analytical_depth`, `dominant_trait`, `session_id`
   - Partitionado por fecha

3. **`autonomous_decisions`** - Decisiones tomadas por el sistema autónomo
   - `id`, `timestamp`, `decision_type`, `decision_value`, `context`, `confidence`, `execution_time_ms`, `success`
   - Partitionado por fecha

4. **`user_metrics`** - Métricas agregadas por usuario
   - `user_id`, `date`, `messages_sent`, `autonomous_interactions`, `avg_response_time_ms`, `favorite_emotion`, `engagement_score`, `last_seen`
   - Partitionado por fecha

---

## 🚀 **Despliegue en Producción**

### Opción 1: Vercel (Recomendado)

1. Ve a [Vercel](https://vercel.com/) e importa tu repositorio
2. Configura las variables de entorno en Vercel
3. Vercel detectará automáticamente y desplegará

### Opción 2: AI Studio

1. Sube todos los archivos a tu proyecto en AI Studio
2. Ejecuta:
   ```bash
   npm install
   cd api && npm install
   cd ../local-agent && npm install
   cd ..
   npm run start:prod
   ```

### Opción 3: Servidor Propio (PM2)

```bash
# Clonar el repositorio
git clone https://github.com/Hectron-lands/HectronAutonomo.git
cd HectronAutonomo

# Instalar dependencias
npm install
npm run install:agent

# Iniciar con PM2
pm2 start api/src/index.js --name hectron-api
pm2 start local-agent/src/index.mjs --name hectron-agent
pm2 save
pm2 startup
```

---

## 🎨 **Personalización**

### Cambiar el Modelo 3D

1. Ve a [Sketchfab](https://sketchfab.com/) y busca un modelo
2. Copia el embed URL
3. Actualiza el componente 3D en tu dashboard

### Cambiar la Voz (TTS)

El sistema usa **Gemini TTS** por defecto. Para cambiar:
1. Configura `ELEVENLABS_API_KEY` en `.env`
2. Modifica el cliente TTS para usar ElevenLabs

### Añadir Más Escenas

1. Crea la escena en OBS
2. Añádela a `AUTONOMOUS_SCENES` en `.env`
3. El sistema la usará automáticamente en modo autónomo

---

## 🛠️ **Solución de Problemas**

### ❌ OBS no se conecta

**Soluciones:**
- Verifica que OBS WebSocket esté activado
- Verifica `OBS_HOST`, `OBS_PORT` y `OBS_PASSWORD`
- Prueba la conexión: `telnet 127.0.0.1 4455`

### ❌ BigQuery no funciona

**Soluciones:**
- Verifica que `GCP_PROJECT_ID` sea correcto
- Verifica que las credenciales JSON sean válidas
- Habilita la API de BigQuery en Google Cloud Console

### ❌ TikTok API no se conecta

**Soluciones:**
- Verifica que `TIKTOK_CLIENT_KEY` y `TIKTOK_CLIENT_SECRET` sean correctos
- Verifica que el **Redirect URI** esté configurado correctamente
- Asegúrate de que la aplicación esté en modo **Live**

### ❌ Autonomía no se activa

**Soluciones:**
- Verifica que `AUTONOMOUS_THRESHOLD_MS` sea razonable (ej: 120000 = 2 min)
- Verifica que el WebSocket de autonomía esté conectado
- Prueba manualmente: `curl -X POST http://localhost:3001/autonomy/activity`

### ❌ GitHub Actions falla

**Soluciones:**
- Verifica que todos los secrets estén configurados
- Verifica que el workflow tenga permisos de escritura
- Revisa los logs en **Actions** → **Deploy**

---

## 📚 **Documentación Técnica**

- [Documentación de HECTRON-Ω](https://github.com/Hectron-lands/HectronAutonomo/blob/main/HECTRON-OMEGA.md)
- [API de TikTok LIVE](https://developers.tiktok.com/doc/live-streaming-api)
- [API de Google Gemini](https://ai.google.dev/docs)
- [BigQuery Documentation](https://cloud.google.com/bigquery/docs)

---

## 🤝 **Contribuir**

1. Haz un fork del repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 **Licencia**

MIT License - [LICENSE](LICENSE)

---

## 🙏 **Agradecimientos**

- [Google AI Studio](https://aistudio.google.com/) - Por la API de Gemini
- [TikTok Developers](https://developers.tiktok.com/) - Por la API de TikTok LIVE
- [OBS Project](https://obsproject.com/) - Por OBS Studio
- [Vercel](https://vercel.com/) - Por el hosting
- [Google Cloud](https://cloud.google.com/) - Por BigQuery

---

**Hecho con ❤️ por Héctron-lands**

*"Solve et Coagula"*
