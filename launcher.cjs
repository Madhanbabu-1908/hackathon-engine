const http = require('http');
const os = require('os');

const PORT = process.env.PORT || 3001;

console.log("=================================");
console.log(" Hackathon Engine Starting...");
console.log("=================================");

// IMPORTANT: start server directly (pkg-safe)
require('./server/index.js');

function waitForServer(retries = 30) {
  http.get(`http://localhost:${PORT}/api/health`, (res) => {
    if (res.statusCode === 200) {
      console.log("Server ready → http://localhost:" + PORT);
      openBrowser(`http://localhost:${PORT}`);
    } else if (retries > 0) {
      setTimeout(() => waitForServer(retries - 1), 500);
    }
  }).on('error', () => {
    if (retries > 0) setTimeout(() => waitForServer(retries - 1), 500);
  });
}

function openBrowser(url) {
  const cmd =
    os.platform() === "win32"
      ? `start ${url}`
      : os.platform() === "darwin"
      ? `open ${url}`
      : `xdg-open ${url}`;

  require("child_process").exec(cmd);
}

setTimeout(waitForServer, 1500);
