import "dotenv/config";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { bigqueryClient } from "./bigquery-client.mjs";
import { call as prismCall, connect as prismConnect, disconnect as prismDisconnect, SELECTORS } from "./prism-controller.mjs";

const app = express();
// PRISM Live Studio (Games & IRL) se controla automatizando su interfaz web
// con Playwright (versión web de PRISM, no OBS WebSocket).
const PRISM_URL = process.env.PRISM_URL || "https://prismlive.com";

const PORT = Number(process.env.PORT || 8787);
const TOKEN = process.env.AGENT_TOKEN || "";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

let connected = false;
let lastError = null;
let brainWss = null;

// Middleware
app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Agent-Token"],
  })
);
app.use(express.json({ limit: "64kb" }));

// Middleware para logging en BigQuery
app.use(async (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', async () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api/') || req.path.startsWith('/status') || req.path.startsWith('/scenes')) {
      try {
        await bigqueryClient.saveChatLog({
          id: req.id,
          userId: req.headers['x-user-id'] || 'system',
          userName: req.headers['x-user-name'] || 'LocalAgent',
          message: req.body?.message || req.method + ' ' + req.path,
          response: JSON.stringify(res.statusCode),
          processingTimeMs: duration,
        });
      } catch (e) {
        console.error('❌ Error guardando log en BigQuery:', e.message);
      }
    }
  });
  
  next();
});

// Autenticación
function auth(req, res, next) {
  if (!TOKEN || req.get("X-Agent-Token") === TOKEN) return next();
  return res.status(401).json({ error: "Unauthorized agent token" });
}

// Conectar a PRISM Live Studio (versión web, vía Playwright)
async function connect() {
  if (connected) return true;
  try {
    const ok = await prismConnect();
    if (!ok) throw new Error(lastError || "No se pudo abrir PRISM Live Studio en el navegador");
    connected = true;
    lastError = null;
    console.log("✅ PRISM Live Studio conectado (versión web vía Playwright)");
    
    // Guardar evento en BigQuery
    await bigqueryClient.saveAutonomousDecision({
      type: 'obs-connection',
      value: { status: 'connected', url: PRISM_URL },
      context: 'Conexión inicial a PRISM Live Studio (versión web vía Playwright)',
      confidence: 1.0,
      success: true,
    });
    
    return true;
  } catch (e) {
    connected = false;
    lastError = e?.message || String(e);
    console.error("❌ Error al conectar con PRISM Live Studio:", lastError);
    
    // Guardar error en BigQuery
    await bigqueryClient.saveAutonomousDecision({
      type: 'obs-connection',
      value: { status: 'failed', error: lastError },
      context: 'Error de conexión a PRISM Live Studio (versión web vía Playwright)',
      confidence: 0.0,
      success: false,
    });
    
    return false;
  }
}

// Llamar a PRISM Live Studio (delegado al controlador Playwright)
async function call(requestType, requestData = {}) {
  if (!(await connect())) {
    throw new Error(lastError || "PRISM Live Studio no está conectado");
  }
  return prismCall(requestType, requestData);
}

// Snapshot de estado
async function snapshot() {
  try {
    const [stream, scene, version] = await Promise.all([
      call("GetStreamStatus"),
      call("GetCurrentProgramScene"),
      call("GetVersion"),
    ]);
    
    const state = {
      online: true,
      obs: true,
      streaming: Boolean(stream.outputActive),
      scene: scene.currentProgramSceneName || "—",
      obsVersion: version.obsVersion || "—",
      websocketVersion: version.obsWebSocketVersion || "—",
    };
    
    // Guardar estado en BigQuery
    await bigqueryClient.savePsycheState({
      machiavellianism: 5.0,
      stoicism: 7.0,
      emotionalWeight: 3.0,
      creativeDrive: 8.0,
      analyticalDepth: 6.0,
      dominantTrait: state.streaming ? 'creative_drive' : 'stoicism',
      sessionId: `obs-${Date.now()}`,
    });
    
    return state;
  } catch {
    connected = false;
    return { online: true, obs: false, streaming: false, scene: "—", error: lastError };
  }
}

// Endpoints
app.get("/health", (_req, res) => {
  // prismConnected es el nombre preferido; obsConnected se mantiene por retrocompatibilidad.
  res.json({ ok: true, service: "hectron-local-agent", prismConnected: connected, obsConnected: connected });
});

app.get("/status", auth, async (_req, res) => {
  const state = await snapshot();
  
  // Guardar en BigQuery que se consultó el estado
  await bigqueryClient.saveAutonomousDecision({
    type: 'status-check',
    value: state,
    context: 'Consulta de estado del Local Agent',
    confidence: 1.0,
    success: true,
  });
  
  res.json(state);
});

app.get("/scenes", auth, async (_req, res) => {
  try {
    const result = await call("GetSceneList");
    const scenes = (result.scenes || []).map((x) => x.sceneName);
    
    // Guardar en BigQuery
    await bigqueryClient.saveAutonomousDecision({
      type: 'scenes-list',
      value: scenes,
      context: 'Lista de escenas obtenida de PRISM Live Studio',
      confidence: 1.0,
      success: true,
    });
    
    res.json({ ok: true, scenes });
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
});

app.post("/scene", auth, async (req, res) => {
  try {
    const scene = String(req.body?.scene || "").trim();
    if (!scene) throw new Error("scene is required");
    
    await call("SetCurrentProgramScene", { sceneName: scene });
    
    // Guardar en BigQuery
    await bigqueryClient.saveAutonomousDecision({
      type: 'scene-change',
      value: scene,
      context: `Cambio manual a escena: ${scene}`,
      confidence: 1.0,
      success: true,
    });
    
    res.json({ ok: true, scene });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/live/start", auth, async (_req, res) => {
  try {
    if (process.env.STREAM_SERVER && process.env.STREAM_KEY) {
      await call("SetStreamServiceSettings", {
        streamServiceType: "rtmp_custom",
        streamServiceSettings: {
          server: process.env.STREAM_SERVER,
          key: process.env.STREAM_KEY,
        },
      });
    }
    await call("StartStream");
    
    // Guardar en BigQuery
    await bigqueryClient.saveAutonomousDecision({
      type: 'stream-start',
      value: { server: process.env.STREAM_SERVER },
      context: 'Inicio manual del stream',
      confidence: 1.0,
      success: true,
    });
    
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/live/stop", auth, async (_req, res) => {
  try {
    await call("StopStream");
    
    // Guardar en BigQuery
    await bigqueryClient.saveAutonomousDecision({
      type: 'stream-stop',
      value: {},
      context: 'Parada manual del stream',
      confidence: 1.0,
      success: true,
    });
    
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Endpoint para métricas del Local Agent
app.get("/metrics", auth, async (_req, res) => {
  try {
    const metrics = await bigqueryClient.getAllMetrics(7);
    res.json({ ok: true, ...metrics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket para el cerebro
brainWss = new WebSocketServer({ noServer: true });

brainWss.on("connection", (ws) => {
  console.log("🔗 Nuevo cliente conectado al agente local");

  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data);
      if (message.token !== TOKEN) {
        ws.close(1008, "Token inválido");
        return;
      }

      switch (message.type) {
        case "scene-change":
          await call("SetCurrentProgramScene", { sceneName: message.scene });
          
          // Guardar en BigQuery
          await bigqueryClient.saveAutonomousDecision({
            type: 'scene-change',
            value: message.scene,
            context: `Cambio remoto a escena: ${message.scene}`,
            confidence: 1.0,
            success: true,
          });
          
          ws.send(JSON.stringify({ type: "scene-changed", scene: message.scene }));
          break;
        case "start-stream":
          await call("StartStream");
          
          await bigqueryClient.saveAutonomousDecision({
            type: 'stream-start',
            value: {},
            context: 'Inicio remoto del stream',
            confidence: 1.0,
            success: true,
          });
          
          ws.send(JSON.stringify({ type: "stream-started" }));
          break;
        case "stop-stream":
          await call("StopStream");
          
          await bigqueryClient.saveAutonomousDecision({
            type: 'stream-stop',
            value: {},
            context: 'Parada remota del stream',
            confidence: 1.0,
            success: true,
          });
          
          ws.send(JSON.stringify({ type: "stream-stopped" }));
          break;
        case "autonomous-action":
          // Acción autónoma desde el cerebro
          console.log('🤖 Acción autónoma recibida:', message.action);
          
          // Ejecutar la acción
          switch (message.action.type) {
            case 'scene-change':
              await call("SetCurrentProgramScene", { sceneName: message.action.value });
              break;
            case 'emotion':
              // Enviar emoción al overlay (si está conectado)
              break;
          }
          
          // Guardar en BigQuery
          await bigqueryClient.saveAutonomousDecision({
            type: message.action.type,
            value: message.action.value,
            context: `Acción autónoma: ${message.action.type}`,
            confidence: message.action.confidence || 0.8,
            success: true,
          });
          
          break;
        default:
          ws.send(JSON.stringify({ error: "Tipo de mensaje desconocido" }));
      }
    } catch (error) {
      console.error("❌ Error en WebSocket:", error);
      ws.send(JSON.stringify({ error: "Error procesando mensaje" }));
    }
  });

  ws.on("close", () => {
    console.log("🔴 Cliente WebSocket desconectado");
  });
});

// Montar WebSocket en el servidor HTTP
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 HECTRON Local Agent: http://0.0.0.0:${PORT}`);
  connect();
});

server.on("upgrade", (request, socket, head) => {
  brainWss.handleUpgrade(request, socket, head, (ws) => {
    brainWss.emit("connection", ws, request);
  });
});

// Reconexión automática
setInterval(() => {
  connect().catch(() => {});
}, 5000);

// Manejar cierre de PRISM Live Studio: al no haber eventos de obs-websocket-js,
// se comprueba periódicamente si el navegador/page sigue activo.
setInterval(async () => {
  if (connected) {
    // El controlador reintenta la conexión internamente; si falla, marcamos desconectado.
    const ok = await connect().catch(() => false);
    if (!ok) {
      console.log("⚠️ PRISM Live Studio desconectado; reintentando...");
      bigqueryClient.saveAutonomousDecision({
        type: 'obs-disconnection',
        value: {},
        context: 'Desconexión no planeada de PRISM Live Studio (versión web)',
        confidence: 0.0,
        success: false,
      }).catch(() => {});
    }
  }
}, 15000);

// Cierre limpio: cerrar el navegador de Playwright al detener el agente.
process.on("SIGINT", async () => {
  console.log("⏹ Cerrando PRISM Live Studio y agente local...");
  await prismDisconnect().catch(() => {});
  process.exit(0);
});

export { app, call, snapshot, prismCall };