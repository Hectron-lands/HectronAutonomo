import { spawn } from 'node:child_process';
import process from 'node:process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args) {
  const child = spawn(npm, args, { stdio: 'inherit', env: process.env });
  child.on('exit', code => {
    if (code && code !== 0) console.error(`❌ Proceso terminado con código ${code}`);
  });
  return child;
}

console.log('🚀 HECTRON PC runtime');
run(['run', 'agent']);

if (process.env.HECTRON_DEV === '1') {
  run(['run', 'dev']);
} else {
  console.log('📌 Dashboard: usa la URL de Vercel. Para Vite local: HECTRON_DEV=1 npm run pc');
}