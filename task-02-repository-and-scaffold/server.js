'use strict';
const express = require('express');
const path = require('node:path');
const app = express();
app.enable('strict routing');
app.disable('x-powered-by');
const rawPort = process.env.PORT ?? '3000';
if (!/^\d+$/.test(rawPort) || Number(rawPort) < 1 || Number(rawPort) > 65535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exit(1);
}
const port = Number(rawPort);
const task1 = path.resolve(__dirname, '../task-01-design-system');
app.use((req, res, next) => {
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - started) / 1e6;
    console.log(JSON.stringify({ time: new Date().toISOString(), method: req.method,
      path: req.path, status: res.statusCode, serverDurationMs: Number(duration.toFixed(3)) }));
  });
  next();
});
const routes = {
  '/': path.join(__dirname, 'public/index.html'),
  '/assets/layout-tokens.css': path.join(__dirname, 'public/assets/layout-tokens.css'),
  '/assets/home.css': path.join(__dirname, 'public/assets/home.css')
};
for (const name of ['index.html', 'help.html', 'help-no-power.html', 'screen.css', 'demo.js']) {
  routes['/demo/' + name] = path.join(task1, 'prototype', name);
}
routes['/demo/'] = path.join(task1, 'prototype/index.html');
for (const name of ['fonts.css', 'tokens.css', 'typography.css']) {
  routes['/styles/' + name] = path.join(task1, 'styles', name);
}
for (const name of ['SourceSansPro-SemiBold-latin.woff2', 'SourceSansPro-SemiBold-latin-ext.woff2']) {
  routes['/fonts/' + name] = path.join(task1, 'fonts', name);
}
app.get('/demo', (req, res) => res.redirect(302, '/demo/'));
for (const [url, file] of Object.entries(routes)) {
  app.get(url, (req, res, next) => res.sendFile(file, err => { if (err) next(err); }));
}
app.use((req, res) => res.status(404).type('text').send('Not found'));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error('File response failed:', err.code || 'UNKNOWN');
  res.status(err.status === 404 ? 404 : 500).type('text').send(
    err.status === 404 ? 'Not found' : 'Unable to load this page');
});
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Kobo Watt listening at http://127.0.0.1:${port}/ (PID ${process.pid})`);
});
server.on('error', err => {
  console.error(err.code === 'EADDRINUSE'
    ? `Port ${port} is already in use. No existing process was stopped.`
    : `Server could not start: ${err.code || err.message}`);
  process.exitCode = 1;
});
