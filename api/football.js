const SCOREBOARD_URL = "https://ncaa-api.henrygd.me/scoreboard/football/d3";
const RANKINGS_URL = "https://ncaa-api.henrygd.me/rankings/football/d3/regional-rankings";

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
    return [{
      region,
      rank: Number(label),
      school: row.SCHOOL,
      record: row["IN-DIVISION RECORD"] || "Unavailable",
      npi: row.NPI || "Unavailable"
    }];
  });
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  response.setHeader("Cache-Control", "public, s-maxage=45, stale-while-revalidate=15");
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    const [scoreResult, rankingResult] = await Promise.allSettled([
      fetch(SCOREBOARD_URL, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000)
      }),
      fetch(RANKINGS_URL, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000)
      })
    ]);

    if (scoreResult.status !== "fulfilled" || !scoreResult.value.ok) {
      const status = scoreResult.status === "fulfilled" ? scoreResult.value.status : "unavailable";
      return response.status(502).json({ error: `Score source returned ${status}` });
    }

    const payload = await scoreResult.value.json();
    if (!payload || !Array.isArray(payload.games)) {
      return response.status(502).json({ error: "Score source returned an unexpected response" });
    }

    let rankingPayload = null;
    if (rankingResult.status === "fulfilled" && rankingResult.value.ok) {
      try {
        rankingPayload = await rankingResult.value.json();
      } catch (error) {
        rankingPayload = null;
      }
    }
    const rankings = normalizeRegionalRankings(rankingPayload);

    return response.status(200).json({
      ...payload,
      rankings: rankings || [],
      rankingsTitle: rankingPayload?.title || "DIII Football Regional Rankings",
      rankingsUpdated: rankingPayload?.updated || "Update unavailable",
      rankingsAvailable: rankings !== null,
      rankingsUrl: "https://www.ncaa.com/rankings/football/d3/regional-rankings",
      source: "NCAA.com via ncaa-api.henrygd.me",
      rankingsSource: "NCAA.com via ncaa-api.henrygd.me",
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    return response.status(502).json({ error: "Football data is temporarily unavailable" });
  }
};
