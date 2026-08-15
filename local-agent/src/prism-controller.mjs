// Controlador de PRISM Live Studio (Games & IRL) vía automatización del navegador.
//
// PRISM en su versión web no expone un OBS WebSocket accesible desde un script,
// por lo que este módulo reemplaza obs-websocket-js automatizando la interfaz
// de PRISM abierta en un navegador real mediante Playwright.
//
// Expone la misma función call(requestType, requestData) que usaba el agente con
// obs-websocket-js, de modo que los endpoints y brain-client.mjs no cambian.
//
// Selectores: PRISM no publica una API estable de selectores, así que se usan
// selectores heurísticos (texto visible y roles ARIA) centralizados en
// SELECTORS para poder ajustarlos sin tocar la lógica.

import { chromium } from "playwright";

const PRISM_URL = process.env.PRISM_URL || "https://prismlive.com";
const PRISM_PROFILE = process.env.PRISM_PROFILE || "";
const PRISM_HEADLESS = process.env.PRISM_HEADLESS === "true";
const PRISM_NAV_TIMEOUT = Number(process.env.PRISM_NAV_TIMEOUT || 60000);

// Selectores heurísticos de la UI de PRISM. Ajustar si cambia la interfaz.
const SELECTORS = {
  sceneList: '[data-testid="scene-list"], .scene-list, [class*="SceneList"]',
  sceneItem: '[data-testid="scene-item"], .scene-item, [class*="SceneItem"]',
  sceneItemByName: (name) =>
    `[data-testid="scene-item"][data-name="${name}"], .scene-item:has-text("${name}"), [class*="SceneItem"]:has-text("${name}")`,
  startStream: '[data-testid="start-stream"], button:has-text("Start Streaming"), button:has-text("Go Live"), [class*="StartStream"]',
  stopStream: '[data-testid="stop-stream"], button:has-text("Stop Streaming"), button:has-text("End Stream"), [class*="StopStream"]',
  currentScene: '[data-testid="current-scene"], .current-scene, [class*="CurrentScene"]',
  streamActiveIndicator: '[data-testid="stream-active"], .stream-active, [class*="StreamActive"]',
};

let browser = null;
let context = null;
let page = null;
let connected = false;
let lastError = null;

async function launch() {
  if (browser) return;
  const launchOptions = { headless: PRISM_HEADLESS };
  if (PRISM_PROFILE) {
    launchOptions.userDataDir = PRISM_PROFILE;
  }
  browser = await chromium.launchPersistentContext(PRISM_PROFILE || "", {
    headless: PRISM_HEADLESS,
  });
  context = browser;
  page = context.pages()[0] || (await context.newPage());
  page.setDefaultTimeout(PRISM_NAV_TIMEOUT);
}

async function connect() {
  if (connected && page && !page.isClosed()) return true;
  try {
    await launch();
    const currentUrl = page.url();
    if (!currentUrl || currentUrl === "about:blank") {
      await page.goto(PRISM_URL, { waitUntil: "domcontentloaded" });
    }
    connected = true;
    lastError = null;
    return true;
  } catch (e) {
    connected = false;
    lastError = e?.message || String(e);
    return false;
  }
}

// Lista de escenas leyendo el dock de escenas de PRISM.
async function getSceneList() {
  const locator = page.locator(SELECTORS.sceneItem);
  const count = await locator.count();
  const scenes = [];
  for (let i = 0; i < count; i++) {
    const text = (await locator.nth(i).innerText())?.trim();
    if (text) scenes.push(text);
  }
  return scenes;
}

async function getCurrentProgramScene() {
  try {
    const el = page.locator(SELECTORS.currentScene).first();
    const name = (await el.innerText())?.trim();
    return { currentProgramSceneName: name || "—" };
  } catch {
    return { currentProgramSceneName: "—" };
  }
}

async function setCurrentProgramScene({ sceneName }) {
  const sel = SELECTORS.sceneItemByName(sceneName);
  const item = page.locator(sel).first();
  await item.waitFor({ state: "visible", timeout: PRISM_NAV_TIMEOUT });
  await item.click();
  return { ok: true };
}

async function getStreamStatus() {
  try {
    const indicator = page.locator(SELECTORS.streamActiveIndicator).first();
    const visible = await indicator.isVisible().catch(() => false);
    const stopBtn = page.locator(SELECTORS.stopStream).first();
    const stopVisible = await stopBtn.isVisible().catch(() => false);
    const active = visible || stopVisible;
    return { outputActive: active, outputState: active ? "active" : "stopped" };
  } catch {
    return { outputActive: false, outputState: "unknown" };
  }
}

async function startStream() {
  const btn = page.locator(SELECTORS.startStream).first();
  await btn.waitFor({ state: "visible", timeout: PRISM_NAV_TIMEOUT });
  await btn.click();
  return { ok: true };
}

async function stopStream() {
  const btn = page.locator(SELECTORS.stopStream).first();
  await btn.waitFor({ state: "visible", timeout: PRISM_NAV_TIMEOUT });
  await btn.click();
  return { ok: true };
}

// Emula la versión que devolvía obs-websocket-js para no romper /status.
function getVersion() {
  return {
    obsVersion: "PRISM Live Studio (web)",
    obsWebSocketVersion: "playwright-automation",
  };
}

// API unificada, equivalente a obs.call(requestType, requestData).
async function call(requestType, requestData = {}) {
  if (!(await connect())) {
    throw new Error(lastError || "PRISM Live Studio no está conectado");
  }
  switch (requestType) {
    case "GetVersion":
      return getVersion();
    case "GetSceneList":
      return { scenes: (await getSceneList()).map((sceneName) => ({ sceneName })) };
    case "GetCurrentProgramScene":
      return getCurrentProgramScene();
    case "SetCurrentProgramScene":
      return setCurrentProgramScene(requestData);
    case "GetStreamStatus":
      return getStreamStatus();
    case "StartStream":
      return startStream();
    case "StopStream":
      return stopStream();
    default:
      throw new Error(`Operación no soportada por PRISM controller: ${requestType}`);
  }
}

async function disconnect() {
  connected = false;
  try {
    if (context) await context.close();
  } catch {
    /* ignore */
  }
  browser = null;
  context = null;
  page = null;
}

export { call, connect, disconnect, SELECTORS };
