'use strict';

/** HTTP nhẹ để Fly.io giữ máy chạy + health check */
const http = require('http');
const port = Number(process.env.PORT || 8080);

const started = Date.now();
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    const body = JSON.stringify({
      ok: true,
      bot: global.config?.BOTNAME || 'Kurumi Bot',
      uptimeSec: Math.floor((Date.now() - started) / 1000),
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
    return;
  }
  res.writeHead(404);
  res.end('not found');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[fly-health] listening on ${port}`);
});
