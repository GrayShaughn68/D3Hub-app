const API_URL = "https://ncaa-api.henrygd.me/scoreboard/football/d3";

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  response.setHeader("Cache-Control", "public, s-maxage=45, stale-while-revalidate=15");
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    const upstream = await fetch(API_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000)
    });
    if (!upstream.ok) {
      return response.status(502).json({ error: `Score source returned ${upstream.status}` });
    }

    const payload = await upstream.json();
    if (!payload || !Array.isArray(payload.games)) {
      return response.status(502).json({ error: "Score source returned an unexpected response" });
    }

    return response.status(200).json({
      ...payload,
      source: "NCAA.com via ncaa-api.henrygd.me",
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    return response.status(502).json({ error: "Football data is temporarily unavailable" });
  }
};
