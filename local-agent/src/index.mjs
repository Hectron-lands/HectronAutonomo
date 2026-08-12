import "dotenv/config";
import express from "express";
import cors from "cors";
import OBSWebSocket from "obs-websocket-js";
import { WebSocketServer } from "ws";

const app = express();
const obs = new OBSWebSocket();

const PORT = Number(process.env.PORT || 8787);
const TOKEN = process.env.AGENT_TOKEN || "";
const OBS_HOST = process.env.OBS_HOST || "127.0.0.1";
const OBS_PORT = Number(process.env.OBS_PORT || 4455);
const OBS_PASSWORD = process.env.OBS_PASSWORD || "";
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

// Autenticación
function auth(req, res, next) {
  if (!TOKEN || req.get("X-Agent-Token") === TOKEN) return next();
  return res.status(401).json({ error: "Unauthorized agent token" });
}

// Conectar a OBS
async function connect() {
  if (connected) return true;
  try {
    await obs.connect(`ws://${OBS_HOST}:${OBS_PORT}`, OBS_PASSWORD);
    connected = true;
    lastError = null;
    console.log("✅ OBS WebSocket conectado");
    return true;
  } catch (e) {
    connected = false;
    lastError = e?.message || String(e);
    console.error("❌ Error al conectar con OBS:", lastError);
    return false;
  }
}

// Llamar a OBS
async function call(requestType, requestData = {}) {
  if (!(await connect())) {
    throw new Error(lastError || "OBS no está conectado");
  }
  return obs.call(requestType, requestData);
}

// Snapshot de estado
async function snapshot() {
  try {
    const [stream, scene, version] = await Promise.all([
      call("GetStreamStatus"),
      call("GetCurrentProgramScene"),
      call("GetVersion"),
    ]);
    return {
      online: true,
      obs: true,
      streaming: Boolean(stream.outputActive),
      scene: scene.currentProgramSceneName || "—",
      obsVersion: version.obsVersion || "—",
      websocketVersion: version.obsWebSocketVersion || "—",
    };
  } catch {
    connected = false;
    return { online: true, obs: false, streaming: false, scene: "—", error: lastError };
  }
}

// Endpoints
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "hectron-local-agent", obsConnected: connected });
});

app.get("/status", auth, async (_req, res) => {
  res.json(await snapshot());
});

app.get("/scenes", auth, async (_req, res) => {
  try {
    const result = await call("GetSceneList");
    res.json({ ok: true, scenes: (result.scenes || []).map((x) => x.sceneName) });
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
});

app.post("/scene", auth, async (req, res) => {
  try {
    const scene = String(req.body?.scene || "").trim();
    if (!scene) throw new Error("scene is required");
    await call("SetCurrentProgramScene", { sceneName: scene });
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
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/live/stop", auth, async (_req, res) => {
  try {
    await call("StopStream");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
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
          ws.send(JSON.stringify({ type: "scene-changed", scene: message.scene }));
          break;
        case "start-stream":
          await call("StartStream");
          ws.send(JSON.stringify({ type: "stream-started" }));
          break;
        case "stop-stream":
          await call("StopStream");
          ws.send(JSON.stringify({ type: "stream-stopped" }));
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

// Manejar cierre de OBS
obs.on("ConnectionClosed", () => {
  connected = false;
  console.log("⚠️ OBS WebSocket desconectado; reintentando...");
});

obs.on("ConnectionError", (e) => {
  connected = false;
  lastError = e?.message || String(e);
  console.error("❌ Error en OBS WebSocket:", lastError);
});