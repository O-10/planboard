/* ============================================================
   Planboard · Servidor local con SQL Server
   ------------------------------------------------------------
   Sirve la aplicación y guarda los tableros en tu SQL Server.
   Así, quien tenga el enlace (a través de un túnel) ve y edita
   el mismo tablero, en tiempo real, sin depender de la nube.

   Arranque:
     npm install
     npm start

   Variables de entorno opcionales:
     PORT            Puerto local (por defecto 8090)
     PUBLIC_URL      URL pública del túnel (para el enlace de compartir)
     PLANBOARD_DB    Nombre de la base de datos (por defecto Planboard)
     PLANBOARD_CONN  Cadena de conexión ODBC completa (opcional)
   ============================================================ */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const odbc = require("msnodesqlv8");

const PORT = process.env.PORT ? Number(process.env.PORT) : 8090;
const ROOT = path.resolve(__dirname, "..");
const DB_NAME = process.env.PLANBOARD_DB || "Planboard";
const PUBLIC_URL = String(process.env.PUBLIC_URL || "").replace(/\/+$/, "");
const CONN_STR =
  process.env.PLANBOARD_CONN ||
  "Driver={ODBC Driver 18 for SQL Server};Server=localhost;Database=" +
    DB_NAME +
    ";Trusted_Connection=Yes;TrustServerCertificate=Yes;";

/* URL pública para el enlace de compartir. Si el script nos pasó PUBLIC_URL
   la usamos; si no (por ejemplo, el servidor arrancó antes que Tailscale),
   la deducimos de la propia petición: así quien entra por el Funnel recibe
   siempre la dirección correcta aunque el arranque fuera en local. */
function publicUrlFor(req) {
  if (PUBLIC_URL) return PUBLIC_URL;
  const host =
    (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim() ||
    "localhost:" + PORT;
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const proto = forwardedProto || (/\.ts\.net(:\d+)?$/i.test(host) ? "https" : "http");
  return proto + "://" + host;
}

/* ---------- Base de datos (con cola para no solapar consultas) ---------- */

let conn = null;
const queue = [];
let busy = false;

function openDb() {
  return new Promise((resolve, reject) => {
    odbc.open(CONN_STR, (err, c) => (err ? reject(err) : resolve(c)));
  });
}

function query(sql, params) {
  return new Promise((resolve, reject) => {
    queue.push({ sql, params: params || [], resolve, reject });
    drain();
  });
}

function drain() {
  if (busy || !queue.length || !conn) return;
  busy = true;
  const job = queue.shift();
  conn.query(job.sql, job.params, (err, rows) => {
    busy = false;
    if (err) job.reject(err);
    else job.resolve(rows || []);
    drain();
  });
}

const SQL_UPSERT =
  "MERGE dbo.Boards AS t " +
  "USING (SELECT ? AS ShareId) AS s ON t.ShareId = s.ShareId " +
  "WHEN MATCHED THEN UPDATE SET Payload = ?, UpdatedAt = SYSUTCDATETIME() " +
  "WHEN NOT MATCHED THEN INSERT (ShareId, Payload, UpdatedAt) VALUES (?, ?, SYSUTCDATETIME());";

const SQL_SELECT =
  "SELECT Payload, CONVERT(varchar(33), UpdatedAt, 126) AS UpdatedAt " +
  "FROM dbo.Boards WHERE ShareId = ?;";

/* Versión ligera: solo el sello de tiempo, para sondear si cambió. */
const SQL_REV =
  "SELECT CONVERT(varchar(33), UpdatedAt, 126) AS rev " +
  "FROM dbo.Boards WHERE ShareId = ?;";

async function ensureSchema() {
  await query("IF OBJECT_ID('dbo.Boards','U') IS NULL " +
    "CREATE TABLE dbo.Boards (ShareId VARCHAR(64) NOT NULL PRIMARY KEY, " +
    "Payload NVARCHAR(MAX) NOT NULL, UpdatedAt DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME());");
}

/* ---------- Utilidades HTTP ---------- */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8"
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 8 * 1024 * 1024) { reject(new Error("Cuerpo demasiado grande")); req.destroy(); return; }
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath);
  if (rel === "/" || rel === "") rel = "/index.html";
  const filePath = path.join(ROOT, path.normalize(rel));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end("Forbidden"); return; }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("No encontrado"); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

/* ---------- API ---------- */

function shareIdFromPath(pathname, suffix) {
  // /api/board/<shareId>[suffix]
  const m = pathname.match(/^\/api\/board\/([A-Za-z0-9_-]{1,64})(\/stream)?$/);
  if (!m) return null;
  return m[1];
}

async function handleApi(req, res, url) {
  const pathname = url.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return true;
  }

  if (pathname === "/api/health") {
    sendJson(res, 200, { ok: true, backend: "sqlserver", db: DB_NAME });
    return true;
  }

  if (pathname === "/api/info") {
    sendJson(res, 200, {
      ok: true,
      backend: "sqlserver",
      db: DB_NAME,
      publicUrl: publicUrlFor(req)
    });
    return true;
  }

  const m = pathname.match(/^\/api\/board\/([A-Za-z0-9_-]{1,64})(\/rev)?$/);
  if (m) {
    const shareId = m[1];
    const isRev = m[2] === "/rev";

    /* Sonda ligera: devuelve solo la versión (sello de tiempo) del tablero.
       El cliente la consulta cada pocos segundos y, si cambió, trae el
       tablero completo. Es lo más fiable a través de un túnel, donde los
       eventos en vivo (SSE) se quedan en búfer. */
    if (isRev && req.method === "GET") {
      try {
        const rows = await query(SQL_REV, [shareId]);
        sendJson(res, 200, { rev: rows && rows[0] ? rows[0].rev : null });
      } catch (err) {
        sendJson(res, 500, { error: String(err.message || err) });
      }
      return true;
    }

    if (req.method === "GET") {
      try {
        const rows = await query(SQL_SELECT, [shareId]);
        if (!rows || !rows[0]) { sendJson(res, 200, { board: null, rev: null }); return true; }
        sendJson(res, 200, { board: JSON.parse(rows[0].Payload), rev: rows[0].UpdatedAt, updatedAt: rows[0].UpdatedAt });
      } catch (err) {
        sendJson(res, 500, { error: String(err.message || err) });
      }
      return true;
    }

    if (req.method === "PUT") {
      try {
        const raw = await readBody(req);
        const data = JSON.parse(raw || "{}");
        if (!data || typeof data.board !== "object" || data.board === null) {
          sendJson(res, 400, { error: "falta el tablero" });
          return true;
        }
        const payload = JSON.stringify(data.board);
        await query(SQL_UPSERT, [shareId, payload, shareId, payload]);
        /* Leemos de vuelta la versión real guardada, para que el cliente que
           escribió no vuelva a traer su propio cambio al sondear. */
        let rev = null;
        try {
          const rows = await query(SQL_REV, [shareId]);
          rev = rows && rows[0] ? rows[0].rev : null;
        } catch (err) { /* ignore */ }
        sendJson(res, 200, { ok: true, rev: rev });
      } catch (err) {
        sendJson(res, 500, { error: String(err.message || err) });
      }
      return true;
    }
  }

  sendJson(res, 404, { error: "ruta no encontrada" });
  return true;
}

/* ---------- Arranque ---------- */

async function main() {
  try {
    conn = await openDb();
    await ensureSchema();
    console.log("Conectado a SQL Server · base de datos:", DB_NAME);
  } catch (err) {
    console.error("No se pudo conectar a SQL Server:");
    console.error("  " + (err.message || err));
    console.error("Revisa que el servicio 'SQL Server (MSSQLSERVER)' esté iniciado.");
    process.exit(1);
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) {
      handleApi(req, res, url).catch((err) => sendJson(res, 500, { error: String(err.message || err) }));
      return;
    }
    serveStatic(req, res, url.pathname);
  });

  server.listen(PORT, () => {
    console.log("Planboard (SQL Server) disponible en http://localhost:" + PORT);
    if (PUBLIC_URL) console.log("URL pública para compartir:", PUBLIC_URL);
  });
}

main();
