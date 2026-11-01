'use strict';

const express = require('express');
const path = require('node:path');

const app = express();

// Enable strict routing so /demo and /demo/ are distinct
app.enable('strict routing');
app.disable('x-powered-by');

// Resolve port configuration
const rawPort = process.env.PORT ?? '3000';
if (!/^\d+$/.test(rawPort) || Number(rawPort) < 1 || Number(rawPort) > 65535) {
  console.error('PORT environment variable must be an integer between 1 and 65535.');
  process.exit(1);
}
const port = Number(rawPort);

// Resolve static source roots
const task1Dir = path.resolve(__dirname, '../task-01-design-system');
const publicDir = path.join(__dirname, 'public');

// Structured request logging middleware
app.use((req, res, next) => {
  const startHrTime = process.hrtime.bigint();
  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - startHrTime) / 1e6;
    console.log(JSON.stringify({
      time: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      serverDurationMs: Number(elapsedMs.toFixed(3))
    }));
  });
  next();
});

// Whitelist of explicit application routes
const routeMap = {
  // Task 2 home screen and assets
  '/': path.join(publicDir, 'index.html'),
  '/assets/layout-tokens.css': path.join(publicDir, 'assets/layout-tokens.css'),
  '/assets/home.css': path.join(publicDir, 'assets/home.css'),

  // Task 1 prototype files
  '/demo/': path.join(task1Dir, 'prototype/index.html'),
  '/demo/index.html': path.join(task1Dir, 'prototype/index.html'),
  '/demo/help.html': path.join(task1Dir, 'prototype/help.html'),
  '/demo/help-no-power.html': path.join(task1Dir, 'prototype/help-no-power.html'),
  '/demo/screen.css': path.join(task1Dir, 'prototype/screen.css'),
  '/demo/demo.js': path.join(task1Dir, 'prototype/demo.js'),

  // Task 1 styles and typography tokens
  '/styles/fonts.css': path.join(task1Dir, 'styles/fonts.css'),
  '/styles/tokens.css': path.join(task1Dir, 'styles/tokens.css'),
  '/styles/typography.css': path.join(task1Dir, 'styles/typography.css'),

  // Task 1 bundled fonts
  '/fonts/SourceSansPro-SemiBold-latin.woff2': path.join(task1Dir, 'fonts/SourceSansPro-SemiBold-latin.woff2'),
  '/fonts/SourceSansPro-SemiBold-latin-ext.woff2': path.join(task1Dir, 'fonts/SourceSansPro-SemiBold-latin-ext.woff2')
};

// Canonical redirect: /demo -> /demo/
app.get('/demo', (req, res) => {
  res.redirect(302, '/demo/');
});

// Register whitelist file endpoints
for (const [urlPath, filePath] of Object.entries(routeMap)) {
  app.get(urlPath, (req, res, next) => {
    res.sendFile(filePath, (err) => {
      if (err) next(err);
    });
  });
}

// Strict 404 handler for all non-whitelisted routes
app.use((req, res) => {
  res.status(404).type('text/plain').send('Not found');
});

// Central error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error('Request dispatch error:', err.code || err.message || 'UNKNOWN');
  const statusCode = err.status === 404 ? 404 : 500;
  res.status(statusCode).type('text/plain').send(
    statusCode === 404 ? 'Not found' : 'Unable to load this page'
  );
});

// Bind server exclusively to 127.0.0.1
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Kobo Watt listening at http://127.0.0.1:${port}/ (PID ${process.pid})`);
});

// Handle startup errors gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. No existing process was stopped.`);
  } else {
    console.error(`Server failed to start: ${err.code || err.message}`);
  }
  process.exitCode = 1;
});

// Graceful shutdown
const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

