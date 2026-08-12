import WebSocket from "ws";
import { call } from "./index.mjs";

// Configuración
const BRAIN_WS_URL = process.env.BRAIN_WS_URL || "ws://127.0.0.1:3000/api/brain/ws";
const AGENT_TOKEN = process.env.AGENT_TOKEN;

// Conectar al cerebro
function connectToBrain() {
  const ws = new WebSocket(BRAIN_WS_URL);

  ws.on("open", () => {
    console.log("🔗 Conectado al cerebro autónomo");
    ws.send(JSON.stringify({ type: "auth", token: AGENT_TOKEN }));
  });

  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data);
      console.log("📩 Mensaje del cerebro:", message);

      switch (message.type) {
        case "scene-change":
          await call("SetCurrentProgramScene", { sceneName: message.scene });
          break;
        case "start-stream":
          await call("StartStream");
          break;
        case "stop-stream":
          await call("StopStream");
          break;
        case "emotion":
          // Aquí podríamos enviar la emoción al overlay (si está conectado)
          break;
        default:
          console.log("⚠️ Tipo de mensaje desconocido:", message.type);
      }
    } catch (error) {
      console.error("❌ Error procesando mensaje del cerebro:", error);
    }
  });

  ws.on("close", () => {
    console.log("⚠️ Desconectado del cerebro. Reintentando...");
    setTimeout(connectToBrain, 5000);
  });

  ws.on("error", (error) => {
    console.error("❌ Error en WebSocket del cerebro:", error);
  });

  return ws;
}

// Iniciar conexión
connectToBrain();