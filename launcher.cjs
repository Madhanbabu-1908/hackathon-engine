// ============================================================
// launcher.cjs — Entry point for pkg bundling
// Starts Express server + opens browser automatically
// ============================================================

const { spawn } = require('child_process');
const http      = require('http');
const path      = require('path');
const os        = require('os');

const PORT       = 3001;
const SERVER_DIR = path.join(__dirname, 'server');

// Set env vars for production mode
process.env.NODE_ENV          = 'production';
process.env.DISABLE_SSL_VERIFY = 'true';
process.env.PORT              = PORT;
// Point to bundled node_modules inside pkg snapshot
process.env.NODE_PATH         = SERVER_DIR;

console.log('==============================================');
console.log('  TCS GenAI Lab — Hackathon Engine');
console.log('  Enter as a Learner — Exit as an AI Engineer');
console.log('==============================================');
console.log('');
console.log('[LAUNCHER] Starting server...');

// Spawn server as child process using the same node binary
const server = spawn(process.execPath, ['index.js'], {
  cwd:   SERVER_DIR,
  env:   process.env,
  stdio: 'inherit',
});

server.on('error', (err) => {
  console.error('[LAUNCHER] Server error:', err.message);
});

// Wait for server to be ready, then open browser
function waitAndOpen(retries = 30) {
  http.get(`http://localhost:${PORT}/api/health`, (res) => {
    if (res.statusCode === 200) {
      console.log(`[LAUNCHER] Server ready → http://localhost:${PORT}`);
      openBrowser(`http://localhost:${PORT}`);
    } else if (retries > 0) {
      setTimeout(() => waitAndOpen(retries - 1), 500);
    }
  }).on('error', () => {
    if (retries > 0) setTimeout(() => waitAndOpen(retries - 1), 500);
    else console.error('[LAUNCHER] Server did not start in time.');
  });
}

function openBrowser(url) {
  const platform = os.platform();
  const cmd = platform === 'win32'  ? `start ${url}`
             : platform === 'darwin' ? `open ${url}`
             : `xdg-open ${url}`;
  require('child_process').exec(cmd);
}

// Give server 1s head start then begin polling
setTimeout(() => waitAndOpen(), 1000);

// Keep process alive
process.on('SIGINT',  () => { server.kill(); process.exit(); });
process.on('SIGTERM', () => { server.kill(); process.exit(); });
