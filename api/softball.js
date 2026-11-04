const API_ORIGIN = "https://ncaa-api.henrygd.me";
const SOURCE = "NCAA.com via ncaa-api.henrygd.me";
const SUPPORTED_VIEWS = new Set(["scoreboard", "schedule", "rankings", "standings", "history", "bracket"]);

function inputError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function readYear(value, fallback) {
  const year = value || fallback;
  const currentYear = new Date().getUTCFullYear();
  if (!/^\d{4}$/.test(String(year)) || Number(year) < 2010 || Number(year) > currentYear + 1) {
    throw inputError("Year must be between 2010 and next year");
  }
  return String(year);
}

function buildUpstreamPath(view, query = {}) {
  if (!SUPPORTED_VIEWS.has(view)) throw inputError("Unsupported softball feed");
  if (view === "scoreboard") {
    if (!query.date) return "/scoreboard/softball/d3";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(query.date)) throw inputError("Date must use YYYY-MM-DD format");
    const parsed = new Date(`${query.date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== query.date) throw inputError("Date is invalid");
    return `/scoreboard/softball/d3/${query.date.replaceAll("-", "/")}/all-conf`;
  }
  if (view === "schedule") return `/schedule-alt/softball/d3/${readYear(query.year, "2026")}`;
  if (view === "bracket") return `/brackets/softball/d3/${readYear(query.year, "2026")}`;
  return `/${view}/softball/d3`;
}

function validatePayload(view, payload, query = {}) {
  if (!payload || typeof payload !== "object") return false;
  const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  if (view === "scoreboard") return Array.isArray(payload.games) && payload.games.every(isRecord);
  if (view === "schedule") return Array.isArray(payload.data?.schedules?.games) && typeof payload.data?.schedules?.today?.date === "string";
  if (view === "rankings" || view === "history") return Array.isArray(payload.data) && payload.data.every(isRecord) && String(payload.sport).toLowerCase() === "softball";
  if (view === "standings") return Array.isArray(payload.data) && payload.data.every(isRecord);
  if (view === "bracket") {
    const year = Number(query.year || 2026);
    return Array.isArray(payload.championships) && payload.championships.some((championship) => championship.year === year && Array.isArray(championship.games) && championship.games.length > 0 && championship.games.every(isRecord));
  }
  return false;
}

function readQuery(request) {
  if (request.query && typeof request.query === "object") return request.query;
  const url = new URL(request.url || "/", "https://d3hub.local");
  return Object.fromEntries(url.searchParams.entries());
}

async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const query = readQuery(request);
  const view = typeof query.view === "string" ? query.view : "scoreboard";
  let path;
  try {
    path = buildUpstreamPath(view, query);
  } catch (error) {
    return response.status(error.statusCode || 400).json({ error: error.message });
  }

  response.setHeader("Cache-Control", "public, s-maxage=45, stale-while-revalidate=15");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    const upstream = await fetch(`${API_ORIGIN}${path}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000)
    });
    if (!upstream.ok) throw new Error(`Upstream status ${upstream.status}`);

    const payload = await upstream.json();
    if (!validatePayload(view, payload, query)) throw new Error("Unexpected upstream response");

    return response.status(200).json({
      ...payload,
      source: SOURCE,
      retrievedAt: new Date().toISOString()
    });
  } catch (error) {
    return response.status(502).json({
      error: "Softball data is temporarily unavailable",
      available: false,
      feed: view
    });
  }
}

module.exports = handler;
module.exports.buildUpstreamPath = buildUpstreamPath;
module.exports.validatePayload = validatePayload;
