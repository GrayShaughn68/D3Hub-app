const app = document.getElementById("app");
const sportsStrip = document.getElementById("sports-strip");
const searchInput = document.getElementById("global-search");
const searchResults = document.getElementById("search-results");
const sportData = Object.fromEntries(D3_SPORTS.filter((sport) => sport.id !== "football").map((sport) => [sport.id, demoTeamsForSport(sport.id)]));
let footballData = null;
let footballLoading = false;
let footballError = false;
let footballRequest = null;

const iconPaths = {
  football: '<path d="M4.1 8.1c3.5-3.2 11-4.1 15.7-1.4 1.9 4.7 1.2 11.3-2.7 14.8-4.7 1.9-11.3 1.2-14.8-2.7C.4 14.1 1.1 10.5 4.1 8.1Z" fill="#9b552c" stroke="#69351f"/><path d="m7.3 17.1 9.4-10m-8.2 5.3 3.9 3.9m-1.8-6 3.9 3.9m-7.7-1.6 3.9 3.9" fill="none" stroke="#fff0d6" stroke-width="1.4"/>',
  basketball: '<circle cx="12" cy="12" r="9" fill="#e77b2b" stroke="#774019"/><path d="M3.4 9.2c5.2 1.8 12 1.8 17.2 0M3.4 14.8c5.2-1.8 12-1.8 17.2 0M9.1 3.8c2.4 4.8 2.4 11.6 0 16.4m5.8-16.4c-2.4 4.8-2.4 11.6 0 16.4" fill="none" stroke="#593216" stroke-width="1.2"/>',
  soccer: '<circle cx="12" cy="12" r="9" fill="#f5f5ef" stroke="#293342"/><path d="m12 7 3.2 2.3-1.2 3.8h-4l-1.2-3.8L12 7Zm0 0V3m-3.2 2.9L5.2 7.1m3.6 6-2.5 4m7.7-4 2.5 4m.7-7.8 3.5-1.2m-6.5 9.8.6 3.8m-5.6-3.8-.6 3.8" fill="none" stroke="#293342" stroke-width="1.2"/><path d="m12 7 3.2 2.3-1.2 3.8h-4l-1.2-3.8L12 7Z" fill="#293342" stroke="#293342"/>',
  baseball: '<circle cx="12" cy="12" r="9" fill="#f8f3e9" stroke="#c9c2b5"/><path d="M6.2 5.1c3.8 3.2 4.6 10.6 1.1 14m10.5-14.2c-3.8 3.2-4.6 10.6-1.1 14m-11-10.4 1.8.2m-.8 2.7 2 .3m-.6 2.5 1.9.4m9.7-6.1-1.8.2m.8 2.7-2 .3m.6 2.5-1.9.4" fill="none" stroke="#ba3744" stroke-width="1.15"/>',
  softball: '<circle cx="12" cy="12" r="9" fill="#f5e84b" stroke="#b9a92b"/><path d="M6.3 5.1c3.5 3.4 3.5 10.4 0 13.8m11.4-13.8c-3.5 3.4-3.5 10.4 0 13.8m-12-10.7 1.9.5m-1.5 2.8 2 .3m-1.3 2.6 1.8-.1m9.8-6.1-1.9.5m1.5 2.8-2 .3m1.3 2.6-1.8-.1" fill="none" stroke="#bd3945" stroke-width="1.15"/>',
  volleyball: '<circle cx="12" cy="12" r="9" fill="#f7f5ed" stroke="#52677b"/><path d="M5.2 6.1c4.1.1 8.1 2.7 10.1 6.6m3.5-5.1c-1.2 4.1-4.5 7.4-8.7 8.5M7.5 20c.2-4.1 2.5-8.1 6.2-10.4m4.8 9.1c-3.3-2.4-5.2-6.6-4.8-10.9M3 12.4c3.6-2 8.2-2.2 12-.4" fill="none" stroke="#3678a5" stroke-width="1.2"/>'
};

function icon(name) {
  return `<svg class="sport-mark sport-mark-${name}" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.football}</svg>`;
}

function sportById(id) {
  return D3_SPORTS.find((sport) => sport.id === id) || D3_SPORTS[0];
}

function teamById(sportId, teamId) {
  return (sportData[sportId] || []).find((team) => team.id === teamId);
}

function teamBadge(team, extraClass = "") {
  return `<span class="team-mini ${extraClass}" style="background:${team.color};color:white" aria-hidden="true">${team.abbreviation}</span>`;
}

function demoBanner() {
  return `<div class="demo-note"><strong>DEMO DATA</strong><span>Rankings, records and scores are illustrative.</span></div>`;
}

function footballTimestamp() {
  const value = footballData?.updated_at || footballData?.fetchedAt;
  if (!value) return "Update time unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? escapeHtml(value) : `Updated ${date.toLocaleString()}`;
}

function footballRetrievedAt() {
  const value = footballData?.fetchedAt;
  if (!value) return "Retrieval time unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? escapeHtml(value) : `Retrieved ${date.toLocaleString()}`;
}

function unwrapGame(record) {
  return record?.game || record || {};
}

function gameTeams(record) {
  const game = unwrapGame(record);
  const side = (team) => ({
    name: team?.names?.short || team?.names?.char6 || team?.name || team?.teamName || "Team unavailable",
    score: team?.score,
    id: team?.seo || team?.slug || team?.id || team?.names?.short || team?.name || ""
  });
  return { away: side(game.away), home: side(game.home) };
}

function teamSlug(name) {
  return String(name).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function gameStatus(record) {
  const game = unwrapGame(record);
  const raw = String(game.gameState || game.status || "").toLowerCase();
  if (["pre", "scheduled", "upcoming"].includes(raw)) return "Scheduled";
  if (["final", "post", "complete", "completed"].includes(raw)) return "Final";
  if (["live", "in", "inprogress", "in-progress", "halftime", "half", "period", "delayed"].includes(raw)) return "Live";
  return "Status unavailable";
}

function gameTime(record) {
  const game = unwrapGame(record);
  const dateValue = game.startDate || game.date || game.gameDate;
  const timeValue = game.startTime;
  if (dateValue && timeValue) {
    const parts = String(dateValue).split("/");
    if (parts.length === 3) {
      const [month, day, year] = parts.map(Number);
      const date = new Date(Date.UTC(year, month - 1, day, 12));
      const formattedDate = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
      return `${formattedDate} · ${timeValue}`;
    }
    return `${dateValue} · ${timeValue}`;
  }
  const epoch = Number(game.startTimeEpoch);
  if (Number.isFinite(epoch) && epoch > 0) {
    return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(new Date(epoch * 1000));
  }
  return String(timeValue || dateValue || "Start time unavailable");
}

function footballGameRow(game) {
  game = unwrapGame(game);
  const { away, home } = gameTeams(game);
  const status = gameStatus(game);
  const hasBothScores = away.score !== undefined && away.score !== null && away.score !== "" && home.score !== undefined && home.score !== null && home.score !== "";
  const score = status === "Scheduled" ? gameTime(game) : status !== "Status unavailable" && hasBothScores ? `${away.score} – ${home.score}` : "Score unavailable";
  const stateClass = status === "Live" ? "status-live" : status === "Final" ? "status-final" : status === "Scheduled" ? "status-scheduled" : "";
  return `<div class="snapshot-row"><div class="snapshot-team"><a href="#/team/football/${encodeURIComponent(teamSlug(away.name))}">${escapeHtml(away.name)}</a></div><div class="snapshot-score">${escapeHtml(score)}<small class="${stateClass}">${escapeHtml(status.toUpperCase())}</small></div><div class="snapshot-team"><a href="#/team/football/${encodeURIComponent(teamSlug(home.name))}">${escapeHtml(home.name)}</a></div></div>`;
}

function footballAttribution() {
  return `<div class="football-attribution">Source: <a href="https://www.ncaa.com/scoreboard/football/d3" target="_blank" rel="noreferrer">NCAA.com</a> via <a href="https://github.com/henrygd/ncaa-api" target="_blank" rel="noreferrer">ncaa-api</a> · ${footballTimestamp()}</div>`;
}

function footballRankingsAttribution() {
  const updated = footballData?.rankingsUpdated || "Update unavailable";
  return `<div class="football-attribution">Source: <a href="${escapeHtml(footballData?.rankingsUrl || "https://www.ncaa.com/rankings/football/d3/regional-rankings")}" target="_blank" rel="noreferrer">NCAA.com DIII football regional rankings</a> via <a href="https://github.com/henrygd/ncaa-api" target="_blank" rel="noreferrer">ncaa-api</a> · ${escapeHtml(updated)} · ${footballRetrievedAt()}</div>`;
}

function footballTop25Markup() {
  const poll = D3_FOOTBALL_TOP25;
  return `<div class="top25-table-wrap"><div class="top25-table-head"><span>Rank</span><span>School</span><span>W-L</span><span>Points</span><span>+/−</span><span>Prev.</span></div>${poll.entries.map((entry) => `<div class="top25-table-row"><strong>${entry.rank}</strong><span>${escapeHtml(entry.school)}${entry.firstPlaceVotes ? `<small>${entry.firstPlaceVotes} first-place ${entry.firstPlaceVotes === 1 ? "vote" : "votes"}</small>` : ""}</span><span>${escapeHtml(entry.record)}</span><span>${entry.points}</span><span>${escapeHtml(entry.change)}</span><span>${escapeHtml(entry.previous)}</span></div>`).join("")}</div><div class="rank-preview-foot"><span>Source: <a href="${escapeHtml(poll.url)}" target="_blank" rel="noreferrer">D3football.com Top 25</a> · ${escapeHtml(poll.week)} · ${escapeHtml(poll.through)}. Poll points and movement are published values.</span></div><section class="poll-notes"><p><strong>Dropped out:</strong> ${escapeHtml(poll.dropped)}</p><p><strong>Others receiving votes:</strong> ${escapeHtml(poll.others)}</p><p>This weekly poll is voted on by coaches, sports information directors, and media members. This Week 9 snapshot is dated and does not update automatically.</p></section>`;
}

function regionalRankingGroups() {
  const groups = new Map();
  (footballData?.rankings || []).forEach((entry) => {
    const region = entry.region || "Region unavailable";
    if (!groups.has(region)) groups.set(region, []);
    groups.get(region).push(entry);
  });
  return [...groups].map(([region, entries]) => [region, entries.sort((a, b) => a.rank - b.rank)]);
}

function footballRankingsMarkup(preview = false) {
  if (footballLoading && !footballData) return `<div class="empty-state">Loading NCAA regional rankings…</div>`;
  if (!footballData && footballError) return `<div class="empty-state">Football rankings are temporarily unavailable. Please refresh to try again.</div>`;
  if (!footballData?.rankingsAvailable || !footballData.rankings?.length) return `<div class="empty-state">NCAA regional rankings are temporarily unavailable. Scores and schedules are still available.</div>`;
  const groups = regionalRankingGroups();
  const shownGroups = preview ? groups.map(([region, entries]) => [region, entries.slice(0, 1)]) : groups;
  return `<div class="regional-ranking-list">${shownGroups.map(([region, entries]) => `<section class="regional-ranking-region"><h3>${escapeHtml(region)}</h3><div class="regional-ranking-head"><span>Rank</span><span>School</span><span>In-division</span><span>NPI</span></div>${entries.map((entry) => `<div class="regional-ranking-row"><span class="regional-rank-number">${escapeHtml(entry.rank)}</span><strong>${escapeHtml(entry.school)}</strong><span>${escapeHtml(entry.record)}</span><span>${escapeHtml(entry.npi)}</span></div>`).join("")}</section>`).join("")}</div>`;
}

function footballGamesMarkup(limit = Infinity) {
  if (footballLoading && !footballData) return `<div class="empty-state">Loading verified Division III football data…</div>`;
  if (!footballData && footballError) return `<div class="empty-state">Football data is temporarily unavailable. Please refresh to try again.</div>`;
  const games = footballData?.games || [];
  if (!games.length) return `<div class="empty-state">No football games are listed by the data source right now.</div>`;
  return games.slice(0, limit).map(footballGameRow).join("");
}

function footballTeamsMarkup() {
  if (footballLoading && !footballData) return `<div class="empty-state">Loading verified Division III football data…</div>`;
  if (!footballData && footballError) return `<div class="empty-state">Football data is temporarily unavailable. Please refresh to try again.</div>`;
  const teams = new Map();
  (footballData?.games || []).forEach((game) => {
    const { away, home } = gameTeams(game);
    [away, home].forEach((team) => { if (team.name !== "Team unavailable") teams.set(teamSlug(team.name), team.name); });
  });
  if (!teams.size) return `<div class="empty-state">No teams are listed by the data source right now.</div>`;
  return `<div class="directory-grid">${[...teams].sort((a, b) => a[1].localeCompare(b[1])).map(([slug, name]) => `<a class="directory-card" href="#/team/football/${encodeURIComponent(slug)}"><span class="team-mini">FB</span><span><strong>${escapeHtml(name)}</strong><small>NCAA Division III · current scoreboard</small></span></a>`).join("")}</div>`;
}

function refreshFootballViews() {
  document.querySelectorAll("[data-football-games]").forEach((element) => { element.innerHTML = footballGamesMarkup(Number(element.dataset.gameLimit) || Infinity); });
  document.querySelectorAll("[data-football-teams]").forEach((element) => { element.innerHTML = footballTeamsMarkup(); });
  document.querySelectorAll("[data-football-rankings]").forEach((element) => { element.innerHTML = footballRankingsMarkup(element.dataset.rankingPreview === "true"); });
  document.querySelectorAll("[data-football-attribution]").forEach((element) => { element.innerHTML = footballAttribution(); });
  document.querySelectorAll("[data-football-rankings-attribution]").forEach((element) => { element.innerHTML = footballRankingsAttribution(); });
  document.querySelectorAll("[data-football-timestamp]").forEach((element) => { element.textContent = footballTimestamp(); });
  document.querySelectorAll("[data-ranking-count]").forEach((element) => { element.textContent = footballData?.rankings?.length || "—"; });
  document.querySelectorAll("[data-ranking-updated]").forEach((element) => { element.textContent = footballData?.rankingsUpdated || "Unavailable"; });
  document.querySelectorAll("[data-football-error]").forEach((element) => { element.hidden = !footballError; });
}

function loadFootballData() {
  if (footballRequest) return footballRequest;
  footballLoading = true;
  footballError = false;
  refreshFootballViews();
  footballRequest = fetch("/api/football", { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error("Football API unavailable");
      return response.json();
    })
    .then((payload) => {
      if (!Array.isArray(payload.games)) throw new Error("Unexpected football response");
      footballData = payload;
    })
    .catch(() => { footballError = true; })
    .finally(() => {
      footballLoading = false;
      footballRequest = null;
      refreshFootballViews();
      const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
      if (parts[0] === "team" && parts[1] === "football" && parts[2]) renderFootballTeam(parts[2]);
    });
  return footballRequest;
}

function navMarkup() {
  sportsStrip.innerHTML = `<span class="sports-strip-label">Sports</span>${D3_SPORTS.map((sport) => `<a class="sport-pill" href="#/sport/${sport.id}">${sport.shortName}</a>`).join("")}`;
}

function setPrimaryNav(page) {
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.remove("active"));
  const target = page === "home" ? "#/" : page === "directory" || page === "teams" ? "#/directory" : "#/sport/football/top25";
  document.querySelector(`.nav-link[href="${target}"]`)?.classList.add("active");
}

function renderHome() {
  setPrimaryNav("home");
  app.innerHTML = `<div class="page"><div class="container">
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow"><span class="eyebrow-dot"></span>All Division III. All in one place.</div>
        <h1>Every game.<br><span>Every campus.</span></h1>
        <p>Your front row seat to Division III sports. Explore team rankings, find your school, and keep up with the stories across DIII.</p>
        <div class="hero-actions"><a class="button button-primary" href="#/sport/football">Explore football scores <span class="arrow">→</span></a><a class="button button-secondary" href="#/directory">Browse teams</a></div>
      </div>
      <div class="hero-art" aria-hidden="true"><span class="hero-number">III</span><div class="hero-ball"><svg viewBox="0 0 100 100"><path d="M16 27c19-13 47-14 67-2 13 20 12 48-2 66-20 13-48 12-66-2C2 69 2 42 16 27Z"/><path d="m28 70 44-44M32 40l27 28M40 32l27 28"/></svg></div><span class="hero-art-caption">The DIII community</span></div>
    </section>

    <div class="home-grid">
      <section>
        <div class="section-heading"><div><h2>Choose your sport</h2><p>Football scores and NCAA regional rankings are sourced live; other sport sections are labeled demo.</p></div><a class="text-link" href="#/sport/football">Football scoreboard <span class="arrow">→</span></a></div>
        <div class="sport-grid">${D3_SPORTS.map((sport) => `<a class="sport-card" href="#/sport/${sport.id}" data-symbol="${sport.symbol}"><div class="sport-card-top"><span class="sport-icon">${icon(sport.icon)}</span><span class="sport-card-meta">${sport.season} · DIII</span></div><span class="sport-card-title">${sport.name}</span><span class="sport-card-bottom"><span>${sport.id === "football" ? "Scores & schedule" : "Demo section"}</span><span>↗</span></span></a>`).join("")}</div>
      </section>
      <section>
        <div class="section-heading"><div><h2>DIII Football</h2><p>Scores and upcoming games from NCAA.com.</p></div><span class="live-label">Scoreboard</span></div>
        <div class="snapshot-card"><div class="snapshot-head"><strong>Football scoreboard</strong></div><div data-football-games data-game-limit="5">${footballGamesMarkup(5)}</div><div class="snapshot-foot" data-football-attribution>${footballAttribution()}</div></div>
      </section>
    </div>

      <section class="rank-section"><div class="section-heading"><div><h2>Football regional rankings</h2><p>NCAA Division III regional rank, in-division record, and NPI.</p></div><a class="text-link" href="#/sport/football/rankings">All regional rankings <span class="arrow">→</span></a></div><div class="rank-preview"><div data-football-rankings data-ranking-preview="true">${footballRankingsMarkup(true)}</div><div class="snapshot-foot" data-football-rankings-attribution>${footballRankingsAttribution()}</div></div></section>
  </div></div>`;
  loadFootballData();
}

function renderSport(sportId, view) {
  const sport = sportById(sportId);
  const teams = sportData[sport.id];
  if (!view) view = sport.id === "football" ? "scores" : "rankings";
  setPrimaryNav("rankings");
  document.querySelectorAll(".sport-pill").forEach((pill) => pill.classList.toggle("active", pill.getAttribute("href") === `#/sport/${sport.id}`));
  if (sport.id === "football") {
    const showingRankings = view === "rankings";
    const showingTop25 = view === "top25";
    const showingTeams = view === "teams";
    app.innerHTML = `<div class="page"><div class="container">
      <div class="breadcrumbs"><a href="#/">Home</a><span>/</span><span>Football</span></div>
      <header class="sport-page-header"><div class="sport-page-title-wrap"><span class="sport-large-icon">${icon(sport.icon)}</span><div><div class="eyebrow"><span class="eyebrow-dot"></span>Division III · ${sport.season} season</div><h1>Football</h1><p>NCAA scores and schedules, the D3football.com national poll, and NCAA regional rankings.</p></div></div><div class="sport-tabs" role="tablist" aria-label="Football sections"><button class="sport-tab ${view === "scores" ? "active" : ""}" data-view="scores" role="tab" aria-selected="${view === "scores"}">Scores & schedule</button><button class="sport-tab ${showingTop25 ? "active" : ""}" data-view="top25" role="tab" aria-selected="${showingTop25}">D3football Top 25</button><button class="sport-tab ${showingRankings ? "active" : ""}" data-view="rankings" role="tab" aria-selected="${showingRankings}">NCAA regional</button><button class="sport-tab ${showingTeams ? "active" : ""}" data-view="teams" role="tab" aria-selected="${showingTeams}">Teams in feed</button></div></header>
      <div class="content-layout"><section class="panel ranking-panel"><div class="panel-title-row"><h2>${showingTop25 ? "D3football.com Top 25" : showingRankings ? "DIII Football regional rankings" : showingTeams ? "Teams in current feed" : "DIII Football games"}</h2><small>${showingTop25 ? `${D3_FOOTBALL_TOP25.week} · dated poll` : showingRankings ? "Six regions · NCAA rankings" : "Division III · NCAA feed"}</small></div>${showingTop25 ? footballTop25Markup() : showingRankings ? `<div data-football-rankings>${footballRankingsMarkup()}</div><div class="rank-preview-foot" data-football-rankings-attribution>${footballRankingsAttribution()}</div>` : showingTeams ? `<div data-football-teams>${footballTeamsMarkup()}</div><div class="rank-preview-foot" data-football-attribution>${footballAttribution()}</div>` : `<div data-football-games>${footballGamesMarkup()}</div><div class="rank-preview-foot" data-football-attribution>${footballAttribution()}</div>`}</section><aside class="ranking-side"><section class="panel side-card"><h3>${showingTop25 ? "About the poll" : showingRankings ? "Ranking details" : "Data status"}</h3><p>${showingTop25 ? "This national Top 25 is D3football.com’s weekly poll. It is separate from the NCAA regional rankings, and this Week 9 snapshot is not a live feed." : showingRankings ? "NCAA regional rankings are grouped by region. Rank numbers restart in each region; they are not a national Top 25." : "Scores, teams, and game states come directly from the DIII football scoreboard. Unknown scores or statuses are shown as unavailable."}</p><div class="season-line"><span>Division</span><strong>NCAA Division III</strong></div>${showingTop25 ? `<div class="season-line"><span>Poll</span><strong>${escapeHtml(D3_FOOTBALL_TOP25.week)}</strong></div><div class="season-line"><span>Ranked teams</span><strong>25</strong></div>` : showingRankings ? `<div class="season-line"><span>Ranked teams</span><strong data-ranking-count>${footballData?.rankings?.length || "—"}</strong></div><div class="season-line"><span>Ranking update</span><strong data-ranking-updated>${escapeHtml(footballData?.rankingsUpdated || "Unavailable")}</strong></div>` : `<div class="season-line"><span>Source update</span><strong data-football-timestamp>${footballTimestamp()}</strong></div>`}</section></aside></div>
    </div></div>`;
    document.querySelectorAll(".sport-tab").forEach((button) => button.addEventListener("click", () => renderSport(sport.id, button.dataset.view)));
    loadFootballData();
    return;
  }
  app.innerHTML = `<div class="page"><div class="container">
    <div class="breadcrumbs"><a href="#/">Home</a><span>/</span><span>${sport.name}</span></div>
    <header class="sport-page-header"><div class="sport-page-title-wrap"><span class="sport-large-icon">${icon(sport.icon)}</span><div><div class="eyebrow"><span class="eyebrow-dot"></span>Division III · ${sport.season} season</div><h1>${sport.name}</h1><p>${sport.description}</p></div></div><div class="sport-tabs" role="tablist" aria-label="${sport.name} sections"><button class="sport-tab ${view === "rankings" ? "active" : ""}" data-view="rankings" role="tab" aria-selected="${view === "rankings"}">Top 25</button><button class="sport-tab ${view === "teams" ? "active" : ""}" data-view="teams" role="tab" aria-selected="${view === "teams"}">Teams</button></div></header>
    ${view === "rankings" ? renderRankingsContent(sport, teams) : renderSportTeams(sport, teams)}
  </div></div>`;
  document.querySelectorAll(".sport-tab").forEach((button) => button.addEventListener("click", () => renderSport(sport.id, button.dataset.view)));
}

function renderRankingsContent(sport, teams) {
  return `<div class="content-layout"><section class="panel ranking-panel"><div class="panel-title-row"><h2>${sport.name} Top 25</h2><small>Sample ranking · 25 teams</small></div><div class="ranking-table-head"><span>Rank</span><span>School / team</span><span>Record</span><span>For</span><span>Ag</span><span>Streak</span></div>${teams.map((team) => `<div class="ranking-entry"><span class="rank-num">${String(team.rank).padStart(2, "0")}</span><a class="rank-team-link" href="#/team/${sport.id}/${team.id}">${teamBadge(team)}<span class="rank-school">${team.school}<span class="rank-mascot">${team.mascot} · ${team.location}</span></span></a><span class="ranking-record">${team.record}</span><span class="ranking-record">${team.pointsFor}</span><span class="ranking-record">${team.pointsAgainst}</span><span class="ranking-record">${team.streak}</span></div>`).join("")}<div class="rank-preview-foot">${demoBanner()}<span class="footer-note">Last updated: demo</span></div></section><aside class="ranking-side"><section class="panel side-card"><h3>Season snapshot</h3><p>Browse the sample rankings and open a school to view its DIII team page.</p><div class="season-line"><span>Season</span><strong>${sport.season} 2026</strong></div><div class="season-line"><span>Teams listed</span><strong>25</strong></div><div class="season-line"><span>Level</span><strong>NCAA Division III</strong></div></section><section class="panel side-card"><h3>About these rankings</h3><p>This interface uses illustrative demo rankings, records, and statistics. Ranking methodology and official data feeds are not connected yet.</p></section><a class="button button-secondary" href="#/directory">Browse all sample teams <span class="arrow">→</span></a></aside></div>`;
}

function renderSportTeams(sport, teams) {
  return `<div class="section-heading"><div><h2>${sport.name} teams</h2><p>Choose a school to open its team page.</p></div>${demoBanner()}</div><div class="directory-grid">${teams.map((team) => `<a class="directory-card" href="#/team/${sport.id}/${team.id}">${teamBadge(team)}<span><strong>${team.school}</strong><small>${team.mascot} · ${team.record}</small></span></a>`).join("")}</div>`;
}

function renderTeam(sportId, teamId) {
  const sport = sportById(sportId);
  if (sport.id === "football") return renderFootballTeam(teamId);
  const team = teamById(sport.id, teamId);
  if (!team) return renderNotFound();
  setPrimaryNav("teams");
  const teammates = sportData[sport.id];
  const datesBySeason = { Fall: ["Sat, Oct 31", "Sat, Nov 7", "Sat, Nov 14", "Sat, Nov 21"], Winter: ["Sat, Jan 9 ’27", "Sat, Jan 16 ’27", "Sat, Jan 23 ’27", "Sat, Jan 30 ’27"], Spring: ["Sat, Mar 6 ’27", "Sat, Mar 13 ’27", "Sat, Mar 20 ’27", "Sat, Mar 27 ’27"] };
  const demoResult = sport.id.includes("basketball") ? "W 82–74" : sport.id.includes("soccer") ? "W 2–1" : sport.id === "baseball" ? "W 7–4" : sport.id === "softball" ? "W 5–2" : sport.id === "womens-volleyball" ? "W 3–1" : "W 31–17";
  const games = D3_DEMO_GAMES.map((game, index) => ({ ...game, date: datesBySeason[sport.season][game.dateIndex], opponent: teammates[(team.rank + index + 4) % teammates.length], result: index === 0 ? demoResult : index === 1 ? "12:00 PM" : index === 2 ? "1:00 PM" : "TBD" }));
  app.innerHTML = `<div class="page"><div class="container"><div class="breadcrumbs"><a href="#/">Home</a><span>/</span><a href="#/sport/${sport.id}">${sport.name}</a><span>/</span><span>${team.school}</span></div>
    <section class="team-hero"><div class="team-heading"><span class="team-crest" style="background:${team.color}" aria-hidden="true">${team.abbreviation}</span><div><div class="eyebrow"><span class="eyebrow-dot"></span>NCAA Division III · ${sport.name}</div><h1>${team.school}</h1><p>${team.mascot} · ${team.location}</p></div><div class="team-summary"><div class="summary-stat"><strong>${team.record}</strong><span>Record</span></div><div class="summary-stat"><strong>#${team.rank}</strong><span>Sample rank</span></div><div class="summary-stat"><strong>${team.streak}</strong><span>Streak</span></div></div></div></section>
    <div class="team-content"><section class="panel"><div class="panel-title-row"><h2>Schedule & results</h2><small>${sport.season} season · sample</small></div>${games.map((game, index) => `<div class="schedule-row"><span class="schedule-date">${game.date}</span><span class="schedule-opponent">${teamBadge(game.opponent)}<span><strong>${index < 1 ? "vs." : "at"} ${game.opponent.school}</strong><small>${game.opponent.mascot} · NCAA Division III</small></span></span><span class="schedule-result">${game.result}<small>${game.note}</small></span></div>`).join("")}<div class="rank-preview-foot">${demoBanner()}</div></section><aside class="ranking-side"><section class="panel side-card"><h3>Season stats</h3><div class="team-side-stats"><div class="team-side-stat"><strong>${team.pointsFor}</strong><span>For / game</span></div><div class="team-side-stat"><strong>${team.pointsAgainst}</strong><span>Ag / game</span></div><div class="team-side-stat"><strong>${team.streak}</strong><span>Current streak</span></div><div class="team-side-stat"><strong>#${team.rank}</strong><span>Sample rank</span></div></div></section><section class="panel side-card"><h3>Team information</h3><div class="season-line"><span>School</span><strong>${team.school}</strong></div><div class="season-line"><span>Nickname</span><strong>${team.mascot}</strong></div><div class="season-line"><span>Location</span><strong>${team.location}</strong></div><div class="season-line"><span>Sport</span><strong>${sport.name}</strong></div><div class="season-line"><span>Division</span><strong>NCAA DIII</strong></div></section><a class="button button-secondary" href="#/sport/${sport.id}">← Back to ${sport.shortName} Top 25</a></aside></div>
  </div></div>`;
}

function renderFootballTeam(teamId) {
  setPrimaryNav("teams");
  const matches = (footballData?.games || []).filter((game) => {
    const { away, home } = gameTeams(game);
    return teamSlug(away.name) === teamId || teamSlug(home.name) === teamId;
  });
  const teamName = matches.length ? (() => {
    const { away, home } = gameTeams(matches[0]);
    return teamSlug(away.name) === teamId ? away.name : home.name;
  })() : footballError ? "Football data unavailable" : "Football team";
  const gameRows = matches.map((game) => {
    const { away, home } = gameTeams(game);
    const isAway = teamSlug(away.name) === teamId;
    const opponent = isAway ? home : away;
    const status = gameStatus(game);
    const scoresPresent = away.score !== undefined && away.score !== null && away.score !== "" && home.score !== undefined && home.score !== null && home.score !== "";
    const result = status === "Scheduled" ? gameTime(game) : status !== "Status unavailable" && scoresPresent ? `${isAway ? away.score : home.score} – ${isAway ? home.score : away.score}` : "Score unavailable";
    return `<div class="schedule-row"><span class="schedule-date">${escapeHtml(gameTime(game))}</span><span class="schedule-opponent"><span><strong>${isAway ? "at" : "vs."} ${escapeHtml(opponent.name)}</strong><small>NCAA Division III</small></span></span><span class="schedule-result">${escapeHtml(result)}<small>${escapeHtml(status)}</small></span></div>`;
  }).join("");
  app.innerHTML = `<div class="page"><div class="container"><div class="breadcrumbs"><a href="#/">Home</a><span>/</span><a href="#/sport/football">Football</a><span>/</span><span>${escapeHtml(teamName)}</span></div><section class="team-hero"><div class="team-heading"><span class="team-crest">FB</span><div><div class="eyebrow"><span class="eyebrow-dot"></span>NCAA Division III · Football</div><h1>${escapeHtml(teamName)}</h1><p>Team information provided by the current NCAA DIII football scoreboard.</p></div></div></section><div class="team-content"><section class="panel"><div class="panel-title-row"><h2>Schedule & results</h2><small>Current scoreboard window</small></div>${footballLoading && !footballData ? `<div class="empty-state">Loading verified game information…</div>` : footballError ? `<div class="empty-state">Football data is temporarily unavailable. Please refresh to try again.</div>` : matches.length ? gameRows : `<div class="empty-state">This team has no game listed in the current NCAA scoreboard response.</div>`}<div class="rank-preview-foot" data-football-attribution>${footballAttribution()}</div></section><aside class="ranking-side"><section class="panel side-card"><h3>Verified team information</h3><p>${matches.length ? "This team appeared in the current Division III scoreboard response." : "No roster, record, or season statistics are available from the current scoreboard response."}</p><div class="season-line"><span>Team</span><strong>${escapeHtml(teamName)}</strong></div><div class="season-line"><span>Division</span><strong>NCAA Division III</strong></div><div class="season-line"><span>Season record</span><strong>Unavailable</strong></div></section><a class="button button-secondary" href="#/sport/football">← Back to Football</a></aside></div></div></div>`;
  if (!footballData) loadFootballData();
}

function renderDirectory(filter = "all", query = "") {
  setPrimaryNav("directory");
  const allTeams = D3_SCHOOLS.map((school) => ({ id: school[0], school: school[1], mascot: school[2], location: school[3], abbreviation: school[4], color: school[5] }));
  const normalized = query.trim().toLowerCase();
  const visible = allTeams.filter((team) => (!normalized || `${team.school} ${team.mascot} ${team.location}`.toLowerCase().includes(normalized)));
  app.innerHTML = `<div class="page"><div class="container"><div class="breadcrumbs"><a href="#/">Home</a><span>/</span><span>Team directory</span></div><header class="directory-head"><div><div class="eyebrow"><span class="eyebrow-dot"></span>Explore Division III</div><h1>Team directory</h1><p>Browse sample Division III team pages across the sports in D3Hub.</p></div>${demoBanner()}</header><div class="filter-row">${D3_SPORTS.map((sport, index) => `<a class="filter-chip ${filter === "all" ? (index === 0 ? "" : "") : filter === sport.id ? "active" : ""}" href="#/sport/${sport.id}">${sport.shortName}</a>`).join("")}<span class="filter-chip active">All sample schools</span></div>${visible.length ? `<div class="directory-grid">${visible.map((team) => `<a class="directory-card" href="#/team/football/${team.id}">${teamBadge(team)}<span><strong>${team.school}</strong><small>${team.mascot} · NCAA Division III</small></span></a>`).join("")}</div>` : `<div class="empty-state">No teams match “${escapeHtml(query)}”. Try another school name.</div>`}</div></div>`;
}

function renderNotFound() {
  app.innerHTML = `<div class="page"><div class="container"><div class="empty-state"><strong>Page not found.</strong><br><a class="text-link" href="#/">Return to D3Hub home →</a></div></div></div>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function route() {
  searchResults.hidden = true;
  searchInput.value = "";
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (!parts.length) {
    document.querySelectorAll(".sport-pill").forEach((pill) => pill.classList.remove("active"));
    return renderHome();
  }
  if (parts[0] === "sport" && parts[1]) return renderSport(parts[1], parts[2]);
  if (parts[0] === "team" && parts[1] && parts[2]) return renderTeam(parts[1], parts[2]);
  if (parts[0] === "directory") return renderDirectory();
  return renderNotFound();
}

function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    searchResults.hidden = true;
    return;
  }
  const seen = new Set();
  const matches = [];
  D3_SPORTS.filter((sport) => sport.id !== "football").forEach((sport) => sportData[sport.id].forEach((team) => {
    const key = `${sport.id}:${team.id}`;
    if (!seen.has(key) && `${team.school} ${team.mascot} ${team.location}`.toLowerCase().includes(query)) {
      seen.add(key);
      matches.push({ team, sport });
    }
  }));
  const footballTeams = new Map();
  (footballData?.games || []).forEach((game) => {
    const { away, home } = gameTeams(game);
    [away, home].forEach((team) => { if (team.name.toLowerCase().includes(query)) footballTeams.set(teamSlug(team.name), team.name); });
  });
  [...footballTeams].slice(0, 5).forEach(([slug, name]) => matches.push({ team: { id: slug, school: name, abbreviation: "FB" }, sport: sportById("football") }));
  searchResults.innerHTML = `<div class="search-results-title">${matches.length ? "Teams" : "No matches"}</div>${matches.slice(0, 7).map(({ team, sport }) => `<a class="search-result" href="#/team/${sport.id}/${team.id}">${teamBadge(team)}<span><strong>${team.school}</strong><small>${sport.name} · ${team.mascot}</small></span></a>`).join("") || `<div class="search-results-title">Try a school name or mascot.</div>`}`;
  searchResults.hidden = false;
}

navMarkup();
route();
window.addEventListener("hashchange", route);
window.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape") {
    searchResults.hidden = true;
    searchInput.blur();
  }
});
searchInput.addEventListener("input", handleSearch);
searchInput.addEventListener("focus", handleSearch);
document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-box") && !event.target.closest(".search-results")) searchResults.hidden = true;
});
document.getElementById("menu-toggle").addEventListener("click", (event) => {
  const isExpanded = event.currentTarget.getAttribute("aria-expanded") === "true";
  event.currentTarget.setAttribute("aria-expanded", String(!isExpanded));
  sportsStrip.classList.toggle("collapsed", isExpanded);
});
