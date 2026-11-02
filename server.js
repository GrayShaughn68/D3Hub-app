const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT) || 4174;
const scoreboardUrl = "https://ncaa-api.henrygd.me/scoreboard/football/d3";
const rankingsUrl = "https://ncaa-api.henrygd.me/rankings/football/d3/regional-rankings";
const publicFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/data.js", ["data.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]]
]);

let cachedPayload = null;
let cachedAt = 0;
let pendingFetch = null;

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

async function footballPayload() {
  if (cachedPayload && Date.now() - cachedAt < 45_000) return cachedPayload;
  if (pendingFetch) return pendingFetch;

  pendingFetch = (async () => {
    const [scoreResult, rankingResult] = await Promise.allSettled([
      fetch(scoreboardUrl, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }),
      fetch(rankingsUrl, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) })
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

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/api/football") {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    if (request.method !== "GET") {
      response.setHeader("Allow", "GET");
      response.writeHead(405).end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }
    try {
      response.writeHead(200).end(JSON.stringify(await footballPayload()));
    } catch (error) {
      response.writeHead(502).end(JSON.stringify({ error: "Football data is temporarily unavailable" }));
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

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`D3Hub local server: http://127.0.0.1:${port}\n`);
});
