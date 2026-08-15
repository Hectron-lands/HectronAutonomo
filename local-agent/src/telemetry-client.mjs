// Cliente de telemetría LOCAL y gratuito para HECTRON.
//
// Alternativa a BigQuery que NO requiere Google Cloud ni credenciales.
// Guarda los eventos en un archivo JSON local (data/telemetry.json) y los
// mantiene en memoria. Es deliberadamente simple para máxima portabilidad:
// cero dependencias nativas, cero compilación, funciona en Windows/Mac/Linux.
//
// Expone la misma interfaz que BigQueryClient para que el agente funcione
// igual con o sin GCP: saveChatLog, savePsycheState, saveAutonomousDecision,
// saveUserMetrics, getAutonomyMetrics, getChatMetrics, getPsycheMetrics,
// getAllMetrics, initialize.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "telemetry.json");

class LocalTelemetryClient {
  constructor() {
    this.data = {
      chatLogs: [],
      psycheStates: [],
      autonomousDecisions: [],
      userMetrics: [],
    };
  }

  async initialize() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      if (fs.existsSync(DATA_FILE)) {
        this.data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      }
      console.log("✅ Telemetría local inicializada (modo gratuito, sin GCP)");
    } catch (e) {
      console.error("⚠️ Error inicializando telemetría local:", e.message);
    }
  }

  _persist() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error("⚠️ Error guardando telemetría local:", e.message);
    }
  }

  async saveChatLog(logData) {
    try {
      this.data.chatLogs.push({
        id: logData.id || crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        user_id: logData.userId || "anonymous",
        user_name: logData.userName || "Anonymous",
        message: logData.message || "",
        emotion: logData.emotion || "neutral",
        scene: logData.scene || "DEFAULT",
        response: logData.response || "",
        response_emotion: logData.responseEmotion || "neutral",
        tokens_used: logData.tokensUsed || 0,
        processing_time_ms: logData.processingTimeMs || 0,
      });
      // Mantener solo las últimas 5000 entradas para no crecer indefinidamente.
      if (this.data.chatLogs.length > 5000)
        this.data.chatLogs = this.data.chatLogs.slice(-5000);
      this._persist();
    } catch (e) {
      console.error("⚠️ Error guardando chat log local:", e.message);
    }
  }

  async savePsycheState(state) {
    try {
      this.data.psycheStates.push({
        timestamp: new Date().toISOString(),
        ...state,
      });
      if (this.data.psycheStates.length > 2000)
        this.data.psycheStates = this.data.psycheStates.slice(-2000);
      this._persist();
    } catch (e) {
      console.error("⚠️ Error guardando psyche state local:", e.message);
    }
  }

  async saveAutonomousDecision(decision) {
    try {
      this.data.autonomousDecisions.push({
        timestamp: new Date().toISOString(),
        ...decision,
      });
      if (this.data.autonomousDecisions.length > 2000)
        this.data.autonomousDecisions = this.data.autonomousDecisions.slice(-2000);
      this._persist();
    } catch (e) {
      console.error("⚠️ Error guardando decisión autónoma local:", e.message);
    }
  }

  async saveUserMetrics(metrics) {
    try {
      this.data.userMetrics.push({
        timestamp: new Date().toISOString(),
        ...metrics,
      });
      if (this.data.userMetrics.length > 1000)
        this.data.userMetrics = this.data.userMetrics.slice(-1000);
      this._persist();
    } catch (e) {
      console.error("⚠️ Error guardando user metrics local:", e.message);
    }
  }

  _since(days) {
    const cutoff = Date.now() - days * 86400000;
    return (arr) => arr.filter((x) => new Date(x.timestamp).getTime() >= cutoff);
  }

  async getAutonomyMetrics(days = 7) {
    const recent = this._since(days)(this.data.autonomousDecisions);
    const success = recent.filter((x) => x.success).length;
    return {
      totalDecisions: recent.length,
      successfulDecisions: success,
      failedDecisions: recent.length - success,
      successRate: recent.length ? (success / recent.length) * 100 : 0,
    };
  }

  async getChatMetrics(days = 7) {
    const recent = this._since(days)(this.data.chatLogs);
    const tokens = recent.reduce((s, x) => s + (x.tokens_used || 0), 0);
    const times = recent.map((x) => x.processing_time_ms || 0);
    const avgTime = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    return {
      totalMessages: recent.length,
      totalTokens: tokens,
      avgResponseTimeMs: Math.round(avgTime),
    };
  }

  async getPsycheMetrics(days = 7) {
    const recent = this._since(days)(this.data.psycheStates);
    return { totalStates: recent.length, states: recent.slice(-10) };
  }

  async getAllMetrics(days = 7) {
    const [autonomy, chat, psyche] = await Promise.all([
      this.getAutonomyMetrics(days),
      this.getChatMetrics(days),
      this.getPsycheMetrics(days),
    ]);
    return { autonomy, chat, psyche };
  }
}

export const localTelemetryClient = new LocalTelemetryClient();
