#!/usr/bin/env node
/**
 * HECTRON — Runner de tests unificado.
 * Ejecuta todos los tests de Node.js y Python en secuencia.
 *
 * Uso:
 *   node tests/run-tests.mjs          # ejecuta todo
 *   node tests/run-tests.mjs --node   # solo tests Node
 *   node tests/run-tests.mjs --python # solo tests Python
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const only = process.argv[2] || "all";

function run(label, command, args, cwd = root) {
  return new Promise((resolve) => {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`  🧪 ${label}`);
    console.log(`${"═".repeat(60)}\n`);

    const child = spawn(command, args, { cwd, stdio: "inherit", shell: true });
    child.on("exit", (code) => {
      if (code === 0) {
        console.log(`\n✅ ${label}: PASSED\n`);
      } else {
        console.log(`\n❌ ${label}: FAILED (código ${code})\n`);
      }
      resolve(code);
    });
    child.on("error", (e) => {
      console.log(`\n❌ ${label}: ERROR - ${e.message}\n`);
      resolve(1);
    });
  });
}

async function main() {
  let failures = 0;

  if (only === "all" || only === "--node") {
    // Tests de Node.js con el test runner nativo
    const nodeTests = [
      ["Telemetría", ["node", "--test", "tests/test_telemetry.mjs"]],
      ["Studio API", ["node", "--test", "tests/test_studio.mjs"]],
      ["PRISM Controller", ["node", "--test", "tests/test_prism_controller.mjs"]],
    ];

    for (const [label, args] of nodeTests) {
      const code = await run(label, args[0], args.slice(1));
      if (code !== 0) failures++;
    }
  }

  if (only === "all" || only === "--python") {
    // Tests de Python
    const pyCode = await run("Leviatán (Python)", "python3", ["tests/test_leviatan.py"]);
    if (pyCode !== 0) failures++;
  }

  console.log(`\n${"═".repeat(60)}`);
  if (failures === 0) {
    console.log("  🎉 TODOS LOS TESTS PASARON");
  } else {
    console.log(`  ⚠️ ${failures} suite(s) de test fallaron`);
  }
  console.log(`${"═".repeat(60)}\n`);

  process.exit(failures > 0 ? 1 : 0);
}

main();
