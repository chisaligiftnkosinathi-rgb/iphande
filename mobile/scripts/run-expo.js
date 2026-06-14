const { spawn } = require('child_process');
const path = require('path');

const expoCli = path.join(__dirname, '..', 'node_modules', 'expo', 'bin', 'cli.js');
const args = process.argv.slice(2);
const existingNodeOptions = process.env.NODE_OPTIONS || '';
const legacyOpenSslFlag = '--openssl-legacy-provider';

const nodeOptions = existingNodeOptions.includes(legacyOpenSslFlag)
  ? existingNodeOptions
  : `${existingNodeOptions} ${legacyOpenSslFlag}`.trim();

const child = spawn(process.execPath, [expoCli, ...args], {
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
  },
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code || 0);
});
