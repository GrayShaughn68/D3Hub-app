const assert = require("node:assert/strict");
const test = require("node:test");
const { createServer } = require("../server");

async function withServer(fetchImpl, run) {
  const server = createServer({ fetchImpl });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

test("football upstream failures return one valid 502 and leave the server usable", async () => {
  let upstreamCalls = 0;
  const fetchImpl = async () => {
    upstreamCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, 20));
    throw new Error("simulated NCAA outage");
  };

  await withServer(fetchImpl, async (baseUrl) => {
    const responses = await Promise.all([
      fetch(`${baseUrl}/api/football`),
      fetch(`${baseUrl}/api/football`)
    ]);
    for (const response of responses) {
      assert.equal(response.status, 502);
      assert.deepEqual(await response.json(), { error: "Football data is temporarily unavailable" });
    }
    assert.equal(upstreamCalls, 2, "scoreboard and rankings share one upstream load");

    const staticResponse = await fetch(`${baseUrl}/`);
    assert.equal(staticResponse.status, 200);
  });
});

test("softball upstream failures return a labeled 502 and a later request recovers", async () => {
  let failBracket = true;
  const fetchImpl = async (url) => {
    if (String(url).includes("/brackets/softball/d3/2026") && failBracket) {
      throw new Error("simulated bracket outage");
    }
    if (String(url).includes("/scoreboard/softball/d3")) return jsonResponse({ games: [] });
    return jsonResponse({ championships: [{ year: 2026, games: [{ id: "game-1" }] }] });
  };

  await withServer(fetchImpl, async (baseUrl) => {
    const failed = await fetch(`${baseUrl}/api/softball?view=bracket&year=2026`);
    assert.equal(failed.status, 502);
    assert.deepEqual(await failed.json(), {
      error: "Softball data is temporarily unavailable",
      available: false,
      feed: "bracket"
    });

    failBracket = false;
    const recovered = await fetch(`${baseUrl}/api/softball?view=bracket&year=2026`);
    assert.equal(recovered.status, 200);
    const payload = await recovered.json();
    assert.equal(payload.source, "NCAA.com via ncaa-api.henrygd.me");
    assert.ok(payload.retrievedAt);
    assert.equal(payload.championships[0].year, 2026);
  });
});
