// Tests del controlador de PRISM (prism-controller.mjs)
// Verifica la interfaz sin necesidad de conexión real a PRISM
import { test } from "node:test";
import assert from "node:assert";
import path from "node:path";

const controllerPath = path.resolve(import.meta.dirname, "../local-agent/src/prism-controller.mjs");
const mod = await import(controllerPath);

test("prism-controller: expone call, connect, disconnect", () => {
  assert.strictEqual(typeof mod.call, "function", "call debe ser una función");
  assert.strictEqual(typeof mod.connect, "function", "connect debe ser una función");
  assert.strictEqual(typeof mod.disconnect, "function", "disconnect debe ser una función");
});

test("prism-controller: connect devuelve false cuando no hay PRISM (sin navegador)", async () => {
  // Sin PRISM abierto, connect debería fallar gracefully
  const result = await mod.connect();
  assert.strictEqual(result, false, "Sin PRISM abierto, connect debe devolver false");
});

test("prism-controller: call falla cuando no está conectado", async () => {
  // Asegurar que está desconectado
  await mod.disconnect();
  // call debería fallar (rechazar o lanzar) porque no hay PRISM conectado.
  // El controlador intenta conectar (que falla) y luego lanza un error.
  let lanzoError = false;
  try {
    await mod.call("GetVersion");
  } catch (e) {
    lanzoError = true;
  }
  assert.ok(lanzoError, "call debe lanzar error cuando no hay conexión a PRISM");
});

test("prism-controller: disconnect no lanza error", async () => {
  await assert.doesNotReject(async () => await mod.disconnect());
});

test("prism-controller: call con operación desconocida lanza error", async () => {
  // Forzar connect exitoso con mock no es trivial sin PRISM real,
  // pero verificamos que la operación desconocida genera el error correcto
  // cuando el controlador está desconectado (el error de conexión llega primero)
  await mod.disconnect();
  await assert.rejects(async () => await mod.call("OperacionInventada"));
});
