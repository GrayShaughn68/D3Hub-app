const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { buildUpstreamPath, validatePayload } = require("./api/softball");

const root = __dirname;
const scoreboardUrl = "https://ncaa-api.henrygd.me/scoreboard/football/d3";
const rankingsUrl = "https://ncaa-api.henrygd.me/rankings/football/d3/regional-rankings";
const softballApiOrigin = "https://ncaa-api.henrygd.me";
const publicFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/data.js", ["data.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]]
]);

function sendJson(response, status, payload) {
  if (response.headersSent || response.writableEnded || response.destroyed) return false;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    response.writeHead(status);
    response.end(JSON.stringify(payload));
    return true;
  } catch (error) {
    // Once headers are written, an error cannot be turned into a second response.
    if (!response.destroyed) response.destroy();
    return false;
  }
}

function normalizeRegionalRankings(payload) {
  if (!payload || !Array.isArray(payload.data)) return null;
  let region = "";
  return payload.data.flatMap((row) => {
    const label = row["REGIONAL RANK"] || "";
    if (!row.SCHOOL && label.startsWith("Region")) {
      region = label;
      return [];
    }
    if (!row.SCHOOL || !/^\d+$/.test(label)) return [];
    return [{ region, rank: Number(label), school: row.SCHOOL, record: row["IN-DIVISION RECORD"] || "Unavailable", npi: row.NPI || "Unavailable" }];
  });
}

function createServer({ fetchImpl = globalThis.fetch } = {}) {
  let cachedPayload = null;
  let cachedAt = 0;
  let pendingFetch = null;
  const softballCache = new Map();
  const pendingSoftballFetches = new Map();

  async function footballPayload() {
    if (cachedPayload && Date.now() - cachedAt < 45_000) return cachedPayload;
    if (pendingFetch) return pendingFetch;

    pendingFetch = (async () => {
      const [scoreResult, rankingResult] = await Promise.allSettled([
        fetchImpl(scoreboardUrl, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }),
        fetchImpl(rankingsUrl, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) })
      ]);
      if (scoreResult.status !== "fulfilled" || !scoreResult.value.ok) throw new Error("Score source unavailable");
      const payload = await scoreResult.value.json();
      if (!payload || !Array.isArray(payload.games)) throw new Error("Score source returned an unexpected response");

      let rankingPayload = null;
      if (rankingResult.status === "fulfilled" && rankingResult.value.ok) {
        try { rankingPayload = await rankingResult.value.json(); } catch (error) { rankingPayload = null; }
      }
      const rankings = normalizeRegionalRankings(rankingPayload);
      cachedPayload = {
        ...payload,
        rankings: rankings || [],
        rankingsTitle: rankingPayload?.title || "DIII Football Regional Rankings",
        rankingsUpdated: rankingPayload?.updated || "Update unavailable",
        rankingsAvailable: rankings !== null,
        rankingsUrl: "https://www.ncaa.com/rankings/football/d3/regional-rankings",
        source: "NCAA.com via ncaa-api.henrygd.me",
        rankingsSource: "NCAA.com via ncaa-api.henrygd.me",
        fetchedAt: new Date().toISOString()
      };
      cachedAt = Date.now();
      return cachedPayload;
    })();

    try {
      return await pendingFetch;
    } finally {
      pendingFetch = null;
    }
  }

  async function softballPayload(feedPath, view, query) {
    const cached = softballCache.get(feedPath);
    if (cached && Date.now() - cached.cachedAt < 45_000) return cached.payload;
    if (pendingSoftballFetches.has(feedPath)) return pendingSoftballFetches.get(feedPath);

    const pending = (async () => {
      const upstream = await fetchImpl(`${softballApiOrigin}${feedPath}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000)
      });
      if (!upstream.ok) throw new Error(`Score source returned ${upstream.status}`);
      const payload = await upstream.json();
      if (!validatePayload(view, payload, query)) throw new Error("Score source returned an unexpected response");
      const result = { ...payload, source: "NCAA.com via ncaa-api.henrygd.me", retrievedAt: new Date().toISOString() };
      softballCache.set(feedPath, { payload: result, cachedAt: Date.now() });
      return result;
    })();

    pendingSoftballFetches.set(feedPath, pending);
    try {
      return await pending;
    } finally {
      pendingSoftballFetches.delete(feedPath);
    }
  }

  return http.createServer(async (request, response) => {
    // Client disconnects and EPIPE errors must not take down the local server.
    response.on("error", () => {});
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (pathname === "/api/football") {
      response.setHeader("Cache-Control", "no-store");
      if (request.method !== "GET") {
        response.setHeader("Allow", "GET");
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }
      try {
        // Resolve upstream data before sending headers, so failures can return one 502.
        const payload = await footballPayload();
        sendJson(response, 200, payload);
      } catch (error) {
        sendJson(response, 502, { error: "Football data is temporarily unavailable" });
      }
      return;
    }

    if (pathname === "/api/softball") {
      response.setHeader("Cache-Control", "no-store");
      if (request.method !== "GET") {
        response.setHeader("Allow", "GET");
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }
      const queryParams = Object.fromEntries(new URL(request.url, "http://localhost").searchParams.entries());
      const view = queryParams.view || "scoreboard";
      try {
        const feedPath = buildUpstreamPath(view, queryParams);
        const payload = await softballPayload(feedPath, view, queryParams);
        sendJson(response, 200, payload);
      } catch (error) {
        const status = error.statusCode || 502;
        const body = status === 400
          ? { error: error.message }
          : { error: "Softball data is temporarily unavailable", available: false, feed: view };
        sendJson(response, status, body);
      }
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
      return;
    }
    const entry = publicFiles.get(pathname);
    if (!entry) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }
    const [filename, contentType] = entry;
    const filePath = path.resolve(root, filename);
    if (!filePath.startsWith(`${root}${path.sep}`)) {
      response.writeHead(400).end("Bad request");
      return;
    }
    fs.readFile(filePath, (error, contents) => {
      if (error) {
        response.writeHead(404).end("Not found");
        return;
      }
      response.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-cache" });
      response.end(request.method === "HEAD" ? undefined : contents);
    });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 4174;
  createServer().listen(port, "127.0.0.1", () => {
    process.stdout.write(`D3Hub local server: http://127.0.0.1:${port}\n`);
  });
}

module.exports = { createServer, normalizeRegionalRankings };
