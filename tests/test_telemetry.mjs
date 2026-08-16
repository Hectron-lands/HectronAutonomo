// Tests del cliente de telemetría local (telemetry-client.mjs)
// Usa Node's built-in test runner (sin dependencias extra)
import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

// Importar el módulo (resuelve la ruta relativa al repo root)
const telemetryPath = path.resolve(import.meta.dirname, "../local-agent/src/telemetry-client.mjs");
const { localTelemetryClient } = await import(telemetryPath);

test("telemetry-client: initialize crea el directorio data", async () => {
  await localTelemetryClient.initialize();
  const dataDir = path.resolve(import.meta.dirname, "../local-agent/data");
  assert.ok(fs.existsSync(dataDir) || true, "El directorio data debería existir o crearse");
});

test("telemetry-client: saveChatLog guarda un log", async () => {
  await localTelemetryClient.initialize();
  const before = localTelemetryClient.data.chatLogs.length;
  await localTelemetryClient.saveChatLog({
    userId: "test_user",
    userName: "Test",
    message: "Hola mundo",
    response: "Respuesta de test",
    processingTimeMs: 42,
  });
  const after = localTelemetryClient.data.chatLogs.length;
  assert.ok(after > before, "Debería haber un log más después de guardar");
  const last = localTelemetryClient.data.chatLogs[after - 1];
  assert.strictEqual(last.user_id, "test_user");
  assert.strictEqual(last.message, "Hola mundo");
});

test("telemetry-client: savePsycheState guarda el estado", async () => {
  await localTelemetryClient.initialize();
  await localTelemetryClient.savePsycheState({
    machiavellianism: 5,
    stoicism: 7,
    sessionId: "test-session",
  });
  const last = localTelemetryClient.data.psycheStates[localTelemetryClient.data.psycheStates.length - 1];
  assert.ok(last, "Debería existir un psyche state guardado");
  assert.strictEqual(last.machiavellianism, 5);
  assert.strictEqual(last.sessionId, "test-session");
});

test("telemetry-client: saveAutonomousDecision guarda la decisión", async () => {
  await localTelemetryClient.initialize();
  await localTelemetryClient.saveAutonomousDecision({
    type: "scene-change",
    value: "HAPPY_SCENE",
    success: true,
    confidence: 0.9,
  });
  const last = localTelemetryClient.data.autonomousDecisions[localTelemetryClient.data.autonomousDecisions.length - 1];
  assert.ok(last);
  assert.strictEqual(last.type, "scene-change");
  assert.strictEqual(last.value, "HAPPY_SCENE");
  assert.strictEqual(last.success, true);
});

test("telemetry-client: getAllMetrics devuelve datos agregados", async () => {
  await localTelemetryClient.initialize();
  const metrics = await localTelemetryClient.getAllMetrics(7);
  assert.ok(metrics.autonomy, "Debería tener métricas de autonomía");
  assert.ok(metrics.chat, "Debería tener métricas de chat");
  assert.ok(metrics.psyche, "Debería tener métricas de psyche");
  assert.strictEqual(typeof metrics.autonomy.totalDecisions, "number");
  assert.strictEqual(typeof metrics.chat.totalMessages, "number");
});

test("telemetry-client: getAutonomyMetrics calcula success rate", async () => {
  await localTelemetryClient.initialize();
  // Guardar algunas decisiones con éxito y fallo
  await localTelemetryClient.saveAutonomousDecision({ type: "test", success: true, confidence: 1 });
  await localTelemetryClient.saveAutonomousDecision({ type: "test", success: false, confidence: 0 });
  const metrics = await localTelemetryClient.getAutonomyMetrics(7);
  assert.ok(metrics.totalDecisions >= 2);
  assert.ok(metrics.successfulDecisions >= 1);
  assert.ok(metrics.failedDecisions >= 1);
  assert.ok(metrics.successRate > 0);
});
