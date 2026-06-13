const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const STATE_FILE = path.join(DATA_DIR, "okodukai-state.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STATE_FILE)) fs.writeFileSync(STATE_FILE, JSON.stringify({ children: {} }, null, 2));
}

function send(response, status, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        reject(new Error("Request body is too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function serveStatic(requestUrl, response) {
  const url = new URL(requestUrl, `http://${HOST}:${PORT}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(ROOT, requestedPath));

  if (!filePath.startsWith(ROOT) || filePath.includes(`${path.sep}data${path.sep}`)) {
    send(response, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      send(response, 404, "Not found");
      return;
    }
    send(response, 200, content, MIME_TYPES[path.extname(filePath)] || "application/octet-stream");
  });
}

async function handleApi(request, response) {
  ensureDataFile();

  if (request.method === "GET") {
    fs.readFile(STATE_FILE, "utf8", (error, content) => {
      if (error) {
        send(response, 500, JSON.stringify({ error: "Failed to read state" }), "application/json; charset=utf-8");
        return;
      }
      send(response, 200, content || JSON.stringify({ children: {} }), "application/json; charset=utf-8");
    });
    return;
  }

  if (request.method === "PUT" || request.method === "POST") {
    try {
      const body = await readBody(request);
      const parsed = JSON.parse(body);
      fs.writeFileSync(STATE_FILE, JSON.stringify(parsed, null, 2));
      send(response, 200, JSON.stringify({ ok: true }), "application/json; charset=utf-8");
    } catch (error) {
      send(response, 400, JSON.stringify({ error: "Invalid state data" }), "application/json; charset=utf-8");
    }
    return;
  }

  send(response, 405, "Method not allowed");
}

const server = http.createServer((request, response) => {
  if (request.url.startsWith("/api/state")) {
    handleApi(request, response);
    return;
  }
  serveStatic(request.url, response);
});

server.listen(PORT, HOST, () => {
  console.log(`Okodukai CYO is running at http://localhost:${PORT}`);
  console.log(`Other PCs can open http://<this-pc-ip>:${PORT}`);
});
