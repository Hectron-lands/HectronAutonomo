// Arranque unificado de HECTRON (modo gratuito, sin GCP ni Vercel).
// Levanta la API (que también sirve el overlay 3D) y el agente local de PRISM
// con un solo comando:  npm start
//
// Uso:
//   npm start                 -> API + agente local
//   npm run start:overlay     -> solo la API + overlay (para añadir a PRISM como fuente navegador)
//   npm run start:agent       -> solo el agente local

import { spawn } from "node:child_process";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const mode = process.argv[2] || "all"; // all | api | agent

function run(label, cwd, args) {
  const child = spawn(npm, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  child.on("exit", (code) => {
    if (code && code !== 0) console.error(`\u274c ${label} terminó con código ${code}`);
  });
  return child;
}

function banner() {
  const port = process.env.PORT || 3000;
  console.log(`
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502 HECTRON Live Universe \u2014 Modo gratuito                 \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518

  Overlay 3D :  http://localhost:${port}/overlay/universe.html
  API        :  http://localhost:${port}/health
  WebSocket  :  ws://localhost:${port}/api/brain/ws

  Sin GCP ni Vercel: la telemetría se guarda localmente en local-agent/data/.
  Añade el overlay a PRISM Live Studio como fuente de Navegador (Browser Source).
`);
}

if (mode === "all" || mode === "api") {
  banner();
  run("API", path.join(root, "api"), ["run", "start"]);
}

if (mode === "all" || mode === "agent") {
  // Pequeña espera para que la API arranque primero.
  setTimeout(() => {
    run("Agent", path.join(root, "local-agent"), ["run", "start"]);
  }, 1500);
}
