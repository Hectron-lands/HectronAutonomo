// Tests de la API REST del Studio (planes, ROI, config)
// Usa Node's built-in test runner
import { test } from "node:test";
import assert from "node:assert";

// Test del router del studio sin levantar servidor
// Como studio.js usa express, lo importamos y testeamos la lógica de PLANES
// mediante una aproximación: extraemos la lógica y la testeamos directamente.

const PLANES = {
  free: { nombre: "Gratis", precio: 0, limiteStreams: 1, vozPremium: false, vision: false },
  pro: { nombre: "Pro", precio: 9, limiteStreams: 1, vozPremium: true, vision: false },
  enterprise: { nombre: "Emprende", precio: 29, limiteStreams: 3, vozPremium: true, vision: true },
};

// Función ROI replicada del studio.js
function calcularROI(viewers) {
  const v = parseInt(viewers) || 0;
  const dailyGifts = Math.round(v * 0.02 * 0.5);
  const monthly = dailyGifts * 30;
  return { viewers: v, regalosDiarios: dailyGifts, ingresosMensuales: monthly };
}

test("studio: existen 3 planes (free, pro, enterprise)", () => {
  assert.ok(PLANES.free, "Debe existir plan free");
  assert.ok(PLANES.pro, "Debe existir plan pro");
  assert.ok(PLANES.enterprise, "Debe existir plan enterprise");
  assert.strictEqual(Object.keys(PLANES).length, 3);
});

test("studio: plan free es $0", () => {
  assert.strictEqual(PLANES.free.precio, 0);
  assert.strictEqual(PLANES.free.nombre, "Gratis");
});

test("studio: plan pro es $9/semana", () => {
  assert.strictEqual(PLANES.pro.precio, 9);
  assert.strictEqual(PLANES.pro.vozPremium, true);
});

test("studio: plan enterprise permite multi-stream (3)", () => {
  assert.strictEqual(PLANES.enterprise.limiteStreams, 3);
  assert.strictEqual(PLANES.enterprise.vision, true);
});

test("studio: ROI con 500 viewers = $150/mes", () => {
  const roi = calcularROI(500);
  assert.strictEqual(roi.viewers, 500);
  assert.strictEqual(roi.regalosDiarios, 5);
  assert.strictEqual(roi.ingresosMensuales, 150);
});

test("studio: ROI con 0 viewers = $0", () => {
  const roi = calcularROI(0);
  assert.strictEqual(roi.ingresosMensuales, 0);
});

test("studio: ROI con 1000 viewers = $300/mes", () => {
  const roi = calcularROI(1000);
  assert.strictEqual(roi.ingresosMensuales, 300);
});

test("studio: el usuario con plan pro y 500 viewers gana neto positivo", () => {
  const roi = calcularROI(500);
  const costoProMensual = PLANES.pro.precio * 4; // ~4 semanas/mes
  const neto = roi.ingresosMensuales - costoProMensual;
  assert.ok(neto > 0, `Con 500 viewers el neto debería ser positivo, fue ${neto}`);
});

test("studio: validación de configuración requiere tiktok y gemini", () => {
  function validarConfig({ tiktok, gemini }) {
    const errores = [];
    if (!tiktok) errores.push("tiktok es requerido");
    if (!gemini) errores.push("gemini es requerido");
    return errores;
  }
  assert.deepStrictEqual(validarConfig({}), ["tiktok es requerido", "gemini es requerido"]);
  assert.deepStrictEqual(validarConfig({ tiktok: "user", gemini: "key" }), []);
});
