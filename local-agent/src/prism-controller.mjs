// Controlador de PRISM Live Studio (Games & IRL) vía automatización de escritorio.
//
// PRISM Live Studio Desktop es una aplicación Qt (C++) nativa, NO una web app,
// por lo que no se puede controlar con Playwright/selectores DOM. Este módulo
// automatiza la ventana de escritorio de PRISM usando pywinauto (Python), que
// accede a los widgets Qt por su objectName / automation ID reales.
//
// Los objectName se extrajeron del código fuente público de PRISM
// (github.com/naver/prism-live-studio):
//   - Botón Go Live / Finish Live: QPushButton "GoLiveShift"
//   - Botón Grabar: QPushButton "Record"
//   - Dock de escenas: PLSDock "scenesDock"
//   - Lista de escenas: PLSSceneListView
//   - Etiqueta de nombre de escena: QLabel "nameLabel" / "label"
//
// Expone la misma función call(requestType, requestData) que usaba obs-websocket-js,
// de modo que los endpoints y brain-client.mjs no cambian.

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PRISM_WINDOW_TITLE = process.env.PRISM_WINDOW_TITLE || "PRISM Live Studio";
const PRISM_PYTHON = process.env.PRISM_PYTHON || "python";
const PRISM_LAUNCH_CMD = process.env.PRISM_LAUNCH_CMD || "";
const PRISM_LAUNCH_TIMEOUT = Number(process.env.PRISM_LAUNCH_TIMEOUT || 30000);

let connected = false;
let lastError = null;

// Ejecuta el helper Python de pywinauto y devuelve su salida JSON.
function runPythonHelper(action, payload = {}) {
  return new Promise((resolve, reject) => {
    const helperPath = path.join(__dirname, "prism-desktop-bridge.py");
    const args = [helperPath, action, JSON.stringify(payload)];
    const proc = spawn(PRISM_PYTHON, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (e) => reject(new Error(`No se pudo ejecutar python: ${e.message}`)));
    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderr.trim() || `prism-desktop-bridge.py salió con código ${code}`));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error(`Respuesta no JSON del bridge Python: ${stdout.slice(0, 200)}`));
      }
    });
  });
}

async function launchPrism() {
  if (!PRISM_LAUNCH_CMD) return true;
  return new Promise((resolve) => {
    const proc = spawn(PRISM_LAUNCH_CMD, { shell: true, windowsHide: false, detached: true });
    proc.on("error", () => resolve(false));
    // No esperamos a que termine; solo damos tiempo a que la ventana aparezca.
    setTimeout(() => resolve(true), Math.min(PRISM_LAUNCH_TIMEOUT, 5000));
  });
}

async function connect() {
  if (connected) return true;
  try {
    await launchPrism();
    // Comprobar que la ventana de PRISM está accesible vía pywinauto.
    const res = await runPythonHelper("ping", { windowTitle: PRISM_WINDOW_TITLE });
    if (!res.ok) throw new Error(res.error || "Ventana de PRISM no encontrada");
    connected = true;
    lastError = null;
    return true;
  } catch (e) {
    connected = false;
    lastError = e?.message || String(e);
    return false;
  }
}

async function getSceneList() {
  const res = await runPythonHelper("get_scenes", { windowTitle: PRISM_WINDOW_TITLE });
  return res.scenes || [];
}

async function getCurrentProgramScene() {
  const res = await runPythonHelper("get_current_scene", { windowTitle: PRISM_WINDOW_TITLE });
  return { currentProgramSceneName: res.scene || "—" };
}

async function setCurrentProgramScene({ sceneName }) {
  await runPythonHelper("set_scene", { windowTitle: PRISM_WINDOW_TITLE, sceneName });
  return { ok: true };
}

async function getStreamStatus() {
  const res = await runPythonHelper("get_stream_status", { windowTitle: PRISM_WINDOW_TITLE });
  return { outputActive: Boolean(res.active), outputState: res.active ? "active" : "stopped" };
}

async function startStream() {
  await runPythonHelper("go_live", { windowTitle: PRISM_WINDOW_TITLE });
  return { ok: true };
}

async function stopStream() {
  await runPythonHelper("finish_live", { windowTitle: PRISM_WINDOW_TITLE });
  return { ok: true };
}

function getVersion() {
  return {
    obsVersion: "PRISM Live Studio (desktop, Qt)",
    obsWebSocketVersion: "pywinauto-desktop-bridge",
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
}

export { call, connect, disconnect };
