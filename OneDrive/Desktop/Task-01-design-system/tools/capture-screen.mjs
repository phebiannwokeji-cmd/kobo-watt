#!/usr/bin/env node
/*
  Capture a deterministic full-page screenshot with headless Chrome.
  Usage: node tools/capture-screen.mjs <url> <output.png> [width] [height] [dpr]
  Defaults: 390 x 844 CSS px at device pixel ratio 1.
*/
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const url = args[0];
const output = args[1];
const width = Number(args[2] || 390);
const height = Number(args[3] || 844);
const deviceScaleFactor = Number(args[4] || 1);

if (!url || !output) {
  console.error("Usage: node tools/capture-screen.mjs <url> <output.png> [width] [height] [dpr]");
  process.exit(2);
}

const defaultChrome = process.platform === "win32"
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  : process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : "/usr/bin/google-chrome";

const chromePath = process.env.CHROME_PATH || defaultChrome;
const userDataDir = await mkdtemp(path.join(tmpdir(), "kw-capture-"));
const port = 9300 + Math.floor(Math.random() * 500);
const profile = path.join(userDataDir, "profile");

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "about:blank",
], { stdio: "ignore" });

let socket;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findPageTarget() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (response.ok) {
        const targets = await response.json();
        const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
        if (page) {
          return page;
        }
      }
    } catch {
      // Chrome is still starting.
    }
    await delay(100);
  }
  throw new Error("Chrome did not expose a page target in time.");
}

function connect(webSocketUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(webSocketUrl);
    const pending = new Map();
    let nextId = 0;

    ws.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const id = ++nextId;
          return new Promise((res, rej) => {
            pending.set(id, { res, rej });
            ws.send(JSON.stringify({ id, method, params }));
          });
        },
        close() {
          ws.close();
        },
      });
    });

    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !pending.has(message.id)) {
        return;
      }
      const { res, rej } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        rej(new Error(`${message.error.message} (${JSON.stringify(message.error.data ?? {})})`));
      } else {
        res(message.result);
      }
    });

    ws.addEventListener("error", () => reject(new Error("Could not connect to the Chrome DevTools WebSocket.")));
  });
}

try {
  const target = await findPageTarget();
  const client = await connect(target.webSocketDebuggerUrl);
  socket = client;

  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor,
    mobile: true,
    screenWidth: width,
    screenHeight: height,
  });
  await client.send("Emulation.setTouchEmulationEnabled", { enabled: true });

  await client.send("Page.navigate", { url });

  let ready = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await delay(100);
    const result = await client.send("Runtime.evaluate", {
      expression: "document.readyState",
      returnByValue: true,
    });
    if (result.result.value === "complete") {
      ready = true;
      break;
    }
  }
  if (!ready) {
    throw new Error("Page did not finish loading in time.");
  }

  await client.send("Runtime.evaluate", {
    expression: "document.fonts.ready.then(() => true)",
    awaitPromise: true,
    returnByValue: true,
  });
  await delay(300);

  const metrics = await client.send("Page.getLayoutMetrics");
  const contentSize = metrics.cssContentSize || metrics.contentSize;
  const shotHeight = Math.max(height, Math.ceil(contentSize.height));
  const shotWidth = Math.ceil(contentSize.width);

  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: shotWidth, height: shotHeight, scale: 1 },
  });

  await mkdir(path.dirname(path.resolve(output)), { recursive: true });
  await writeFile(output, Buffer.from(result.data, "base64"));

  console.log(JSON.stringify({
    url,
    output: path.resolve(output),
    viewport: { width, height, deviceScaleFactor, mobile: true },
    screenshotPixels: { width: shotWidth, height: shotHeight },
  }, null, 2));
} finally {
  if (socket) {
    socket.close();
  }
  chrome.kill();
  await delay(300);
  await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
}
